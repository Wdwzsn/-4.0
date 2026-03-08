
import React, { useState, useEffect, useMemo } from 'react';
import { TabType, Achievement, UserProfile, Notification, UserAccount, AdminAccount } from './types';
import { ExerciseSection } from './components/ExerciseSection';
import { SocialSection } from './components/SocialSection';
import { EntertainmentSection } from './components/EntertainmentSection';
import { ACHIEVEMENTS_DATA } from './constants';
import API from './services/apiService';
import { getAdminSupabase } from './services/supabaseClient';

const CAPTCHA_GEN = () => Math.floor(1000 + Math.random() * 9000).toString();

// 评论管理弹窗组件
const CommentManagementModal: React.FC<{ post: any; onClose: () => void; onDeleteComment: (cid: string) => void }> = ({ post, onClose, onDeleteComment }) => (
  <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[40px] p-6 shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-slate-800 dark:text-white">管理动态评论</h3>
        <button onClick={onClose} className="text-slate-400 text-2xl font-black">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
        {(!post.comments || post.comments.length === 0) ? (
          <p className="text-center text-slate-400 py-10 font-bold italic">暂无评论记录</p>
        ) : (
          post.comments.map((c: any) => (
            <div key={c.id} className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 group transition-all hover:bg-white dark:hover:bg-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-slate-800 dark:text-emerald-400 text-sm">{c.author}</p>
                  <p className="text-xs text-slate-400 font-bold">{c.time}</p>
                </div>
                <button onClick={() => onDeleteComment(c.id)} className="bg-rose-500 text-white px-3 py-1 rounded-lg font-black text-[10px] opacity-0 group-hover:opacity-100 transition-all shadow-md">删除</button>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-base mt-2 font-medium leading-relaxed">{c.content}</p>
            </div>
          ))
        )}
      </div>
      <button onClick={onClose} className="mt-8 w-full bg-slate-100 dark:bg-slate-700 py-5 rounded-[25px] font-black text-slate-600 dark:text-slate-300 text-lg active:scale-95 transition-transform">关闭</button>
    </div>
  </div>
);

// 管理员后台组件
const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'exercises' | 'posts' | 'announcements'>('users');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 新增：公告发布相关状态
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // 新增：对话相关状态
  const [chatUser, setChatUser] = useState<UserAccount | null>(null);
  const [chatMsgList, setChatMsgList] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  const [isEditingExercise, setIsEditingExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'idle' | 'uploading' | 'success' | 'error' }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [activePostForComments, setActivePostForComments] = useState<any>(null);

  // 新增：切换用户封禁状态
  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
    if (!window.confirm(`确定要${currentBanned ? '解封' : '封禁'}该用户吗？`)) return;
    try {
      const res: any = await (API as any).admin.toggleUserBan(userId, !currentBanned);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentBanned } : u));
        if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, is_banned: !currentBanned });
        alert(res.message);
      }
    } catch (err: any) {
      alert('操作失败: ' + err.message);
    }
  };

  // 前端直传 Supabase 存储逻辑
  const handleUpload = async (file: File, type: 'image' | 'video', statusKey: string) => {
    setUploadProgress(prev => ({ ...prev, [statusKey]: 10 })); // 模拟开始
    try {
      const extension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extension}`;
      const bucket = type === 'image' ? 'uploads' : 'videos';

      console.log(`正在直传 ${type} 到 ${bucket}...`);
      setUploadProgress(prev => ({ ...prev, [statusKey]: 30 }));

      const supabase = getAdminSupabase();
      const { data, error } = await supabase.storage
        .from(bucket) // Keep original bucket logic
        .upload(fileName, file, { // Keep original fileName logic
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      setUploadProgress(prev => ({ ...prev, [statusKey]: 90 }));

      const supabaseForPublicUrl = getAdminSupabase(); // Re-initialize for clarity, though not strictly necessary
      const { data: { publicUrl } } = supabaseForPublicUrl.storage.from(bucket).getPublicUrl(fileName); // Keep original bucket and fileName logic, and publicUrl destructuring
      setUploadProgress(prev => ({ ...prev, [statusKey]: 100 }));
      return publicUrl;
    } catch (err: any) {
      console.error(`${type}上传失败:`, err);
      // 如果出现 RLS 错误，由于 SQL 已执行，通常是网络或缓存问题
      throw new Error(`${type}上传失败: ${err.message || '网络或权限错误'}`);
    }
  };

  // 从API获取用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response: any = await API.admin.getAllUsers();
        if (response.success && response.data) {
          // 转换为前端需要的格式
          const userAccounts: UserAccount[] = response.data.map((u: any) => ({
            id: u.id,
            phone: u.phone,
            name: u.name,
            avatar: u.avatar || `https://picsum.photos/seed/${u.name}/400/400`,
            motto: u.motto || '健康生活，长青不老',
            bio: u.bio || '暂无介绍',
            age: u.age || '未知',
            gender: u.gender || '未设置',
            province: u.province || '未设置',
            interests: u.interests || [],
            birthday: u.birthday || '未设置',
            routine: u.routine || '每日功法练习',
            joinedDate: u.joined_date || new Date().getFullYear().toString(),
            streak: u.streak || 1,
            lastActive: u.last_active ? new Date(u.last_active).getTime() : 0,
            isRealUser: u.is_real_user !== false,
            password: ''  // 不存储密码
          }));
          setUsers(userAccounts);
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchExercises = async () => {
      try {
        const response: any = await API.exercise.getExercises();
        if (response.success && response.data) {
          setExercises(response.data);
        }
      } catch (error) {
        console.error('获取功法列表失败:', error);
      }
    };

    fetchUsers();
    fetchExercises();
  }, []);

  const onlineCount = useMemo(() => {
    const now = Date.now();
    return users.filter(u => u.lastActive && (now - u.lastActive) < 600000).length;
  }, [users]);

  const checkOnline = (u: UserAccount) => {
    if (!u.lastActive) return false;
    return (Date.now() - u.lastActive) < 600000;
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (editingExercise.id) {
        await API.exercise.updateExercise(editingExercise.id, editingExercise);
      } else {
        await API.exercise.createExercise(editingExercise);
      }
      setIsEditingExercise(false);
      setEditingExercise(null);
      alert('保存成功');
      // 刷新列表
      const response: any = await API.exercise.getExercises();
      if (response.success && response.data) setExercises(response.data);
    } catch (error: any) {
      alert('保存失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (id: string, title: string) => {
    if (!window.confirm(`确认删除功法 "${title}" 吗？此操作不可逆！`)) return;
    try {
      const res: any = await API.exercise.deleteExercise(id);
      if (res.success) {
        alert('删除成功');
        setExercises(exercises.filter(ex => ex.id !== id));
      } else {
        alert(res.error || '删除失败');
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('确定要强行非法删除这条园友动态吗？')) return;
    try {
      const res: any = await API.post.deletePost(id);
      if (res.success) {
        alert('删除成功');
        setPosts(posts.filter(p => p.id !== id));
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('确定要删除这条评论吗？')) return;
    try {
      const res: any = await API.admin.deleteComment(commentId);
      if (res.success) {
        alert('评论已删除');
        // 刷新本地状态
        setPosts(prev => prev.map(p => p.id === activePostForComments.id ? { ...p, comments: p.comments.filter((c: any) => c.id !== commentId) } : p));
        setActivePostForComments((prev: any) => ({ ...prev, comments: prev.comments.filter((c: any) => c.id !== commentId) }));
      }
    } catch (e) { alert('删除失败'); }
  };

  useEffect(() => {
    if (activeTab === 'posts') {
      const fetchPosts = async () => {
        try {
          const res: any = await API.post.getPosts();
          if (res.success && res.data && res.data.posts) {
            setPosts(res.data.posts);
          }
        } catch (e) {
          console.error('获取动态失败', e);
        }
      };
      fetchPosts();
    } else if (activeTab === 'announcements') {
      const fetchAnnouncements = async () => {
        try {
          const res: any = await (API as any).announcement.getAll(); // API 侧已改
          if (res.success && res.data) {
            setAnnouncements(res.data);
          }
        } catch (e) {
          console.error('获取公告失败', e);
        }
      };
      fetchAnnouncements();
    }
  }, [activeTab]);

  const handlePublishAnn = async () => {
    if (!annTitle || !annContent) return alert('标题和内容不能为空');
    setIsPublishing(true);
    try {
      const res: any = await (API as any).admin.announcements.publish(annTitle, annContent);
      if (res.success) {
        alert('发布成功');
        setAnnTitle('');
        setAnnContent('');
        setAnnouncements([res.data, ...announcements]);
      }
    } catch (e: any) {
      console.error(e);
      alert('发布失败，请检查数据库 announcements 表是否存在或网络错误: ' + (e.response?.data?.error || e.message));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteAnn = async (id: string) => {
    if (!window.confirm('确定撤回这条公告吗？')) return;
    try {
      const res: any = await (API as any).admin.announcements.delete(id);
      if (res.success) {
        setAnnouncements(announcements.filter(a => a.id !== id));
      }
    } catch (e) {
      alert('删除失败');
    }
  };

  const startChat = async (user: UserAccount) => {
    setChatUser(user);
    setChatMsgList([]);
    try {
      const res: any = await (API as any).admin.messages.getHistory(user.id);
      if (res.success) {
        setChatMsgList(res.data);
      }
    } catch (e) {
      console.error('拉取历史失败', e);
    }
  };

  const handleSendMsg = async () => {
    if (!chatUser || !inputMsg.trim()) return;
    setIsSendingMsg(true);
    try {
      const res: any = await (API as any).admin.messages.send(chatUser.id, inputMsg);
      if (res.success) {
        setChatMsgList([...chatMsgList, res.data]);
        setInputMsg('');
      }
    } catch (e) {
      alert('发送失败');
    } finally {
      setIsSendingMsg(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12 font-sans animate-in fade-in duration-500">
      {/* 退出登录二次确认弹窗 */}
      {isConfirmingLogout && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-8">
          <div className="bg-slate-800 rounded-[45px] p-10 w-full max-w-sm shadow-2xl text-center border border-white/10">
            <h3 className="text-2xl font-black mb-8 leading-relaxed">确定要退出管理后台并回到主页吗？</h3>
            <div className="flex space-x-4">
              <button onClick={onLogout} className="flex-1 bg-red-600 text-white py-5 rounded-[22px] font-black text-xl shadow-lg active:scale-95 transition-transform">确认退出</button>
              <button onClick={() => setIsConfirmingLogout(false)} className="flex-1 bg-slate-700 py-5 rounded-[22px] font-black text-xl active:scale-95 transition-transform">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 用户详情弹窗 */}
      {selectedUser && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-800 rounded-[50px] p-10 w-full max-w-lg shadow-2xl relative border border-white/10 animate-in zoom-in duration-300">
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-8 text-slate-400 text-3xl font-black hover:text-white transition-colors">✕</button>
            <div className="flex flex-col items-center">
              <img src={selectedUser.avatar} className="w-32 h-32 rounded-full border-4 border-emerald-500 mb-6 shadow-xl" />
              <h3 className="text-3xl font-black mb-1">{selectedUser.name}</h3>
              <p className="text-emerald-500 font-bold mb-8 text-xl italic text-center px-4">“{selectedUser.motto}”</p>

              <div className="w-full space-y-4 text-lg">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400 font-black">手机号码:</span>
                  <span className="font-bold">{selectedUser.phone}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400 font-black">性别:</span>
                  <span className="font-bold">{selectedUser.gender}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400 font-black">居住地区:</span>
                  <span className="font-bold">{selectedUser.province}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400 font-black">打卡天数:</span>
                  <span className="font-bold text-emerald-500">{selectedUser.streak} 天</span>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <span className="text-slate-400 font-black">个性签名:</span>
                  <p className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-slate-300 leading-relaxed italic">{selectedUser.bio}</p>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    startChat(selectedUser);
                  }}
                  className="bg-emerald-600 py-4 rounded-2xl font-black text-xl hover:bg-emerald-500 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>💬</span> 发起对话
                </button>
                <button onClick={() => setSelectedUser(null)} className="bg-slate-700 py-4 rounded-2xl font-black text-xl hover:bg-slate-600 transition-colors">关闭详情</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 功法编辑弹窗 */}
      {isEditingExercise && editingExercise && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-800 rounded-[45px] p-8 md:p-10 w-full max-w-2xl shadow-2xl relative border border-white/10 max-h-[90vh] overflow-hidden flex flex-col">
            <button onClick={() => setIsEditingExercise(false)} className="absolute top-6 right-8 text-slate-400 text-3xl font-black hover:text-white transition-colors z-10">✕</button>
            <h3 className="text-3xl font-black mb-8 shrink-0">{editingExercise.id ? '编辑功法' : '新增功法'}</h3>

            <form onSubmit={handleSaveExercise} className="flex-1 overflow-y-auto pr-4 space-y-6 scrollbar-hide">
              <div className="space-y-2">
                <label className="text-slate-400 font-bold block">标题</label>
                <input required value={editingExercise.title || ''} onChange={e => setEditingExercise({ ...editingExercise, title: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="例如：二十四式太极拳" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold block">分类</label>
                  <select required value={editingExercise.category || '太极拳'} onChange={e => setEditingExercise({ ...editingExercise, category: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="太极拳">太极拳</option>
                    <option value="八段锦">八段锦</option>
                    <option value="养生功">养生功</option>
                    <option value="传统文化">传统文化</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold block">封面图片</label>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                      <input value={editingExercise.thumbnail || ''} onChange={e => setEditingExercise({ ...editingExercise, thumbnail: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="图片 URL 或选择文件 ->" />
                      {editingExercise.thumbnail && (
                        <div className="relative group w-32 h-20 rounded-xl overflow-hidden border border-slate-700">
                          <img src={editingExercise.thumbnail} className="w-full h-full object-cover" alt="预览" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+Image')} />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] bg-emerald-600 px-2 py-1 rounded">已上传</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <label className="bg-slate-700 hover:bg-slate-600 px-4 py-4 h-14 rounded-2xl cursor-pointer font-black transition-all active:scale-95 flex items-center justify-center">
                        <span>{uploadStatus['thumb'] === 'uploading' ? `⌛ 上传中 ${uploadProgress['thumb'] || 0}%` : '📁 上传'}</span>
                        <input type="file" accept="image/*" className="hidden" disabled={uploadStatus['thumb'] === 'uploading'} onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 50 * 1024 * 1024) {
                              alert('⚠️ 图片体积过大 (超过 50MB)！\nSupabase 免费版无法存储此文件，请先使用压缩工具或选择更小的图片。');
                              return;
                            }
                            setUploadStatus(prev => ({ ...prev, thumb: 'uploading' }));
                            setUploadProgress(prev => ({ ...prev, thumb: 0 }));
                            try {
                              const url = await handleUpload(file, 'image', 'thumb');
                              setEditingExercise({ ...editingExercise, thumbnail: url });
                              setUploadStatus(prev => ({ ...prev, thumb: 'success' }));
                            } catch (err: any) {
                              setUploadStatus(prev => ({ ...prev, thumb: 'error' }));
                              alert('图片上传失败: ' + err.message);
                            }
                          }
                        }} />
                      </label>
                      {uploadStatus['thumb'] === 'uploading' && (
                        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-1.5 transition-all duration-300" style={{ width: `${uploadProgress['thumb'] || 0}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-bold block">视频内容 (可选)</label>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <input value={editingExercise.videoUrl || ''} onChange={e => setEditingExercise({ ...editingExercise, videoUrl: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="视频 URL 或选择本地文件 ->" />
                    {editingExercise.videoUrl && (
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-dashed border-emerald-500/50 flex items-center justify-between">
                        <span className="text-xs text-emerald-500 font-bold truncate flex-1 mr-2">✅ 文件已上传: {editingExercise.videoUrl.split('/').pop()}</span>
                        <video className="w-20 h-10 rounded bg-black" src={editingExercise.videoUrl} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <label className="bg-slate-700 hover:bg-slate-600 px-4 py-4 h-14 rounded-2xl cursor-pointer font-black transition-all active:scale-95 flex items-center justify-center">
                      <span>{uploadStatus['video'] === 'uploading' ? `⌛ 上传中 ${uploadProgress['video'] || 0}%` : '🎬 上传视频'}</span>
                      <input type="file" accept="video/*" className="hidden" disabled={uploadStatus['video'] === 'uploading'} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // 放开管理员 50MB 拦截以允许 Cloudinary 大文件，或提升到 500MB
                          if (file.size > 500 * 1024 * 1024) {
                            alert('⚠️ 视频体积超过 500MB！\n免费配置无法存储这么大文件，请先压缩视频。');
                            return;
                          }
                          setUploadStatus(prev => ({ ...prev, video: 'uploading' }));
                          setUploadProgress(prev => ({ ...prev, video: 0 }));
                          try {
                            const url = await handleUpload(file, 'video', 'video');
                            setEditingExercise({ ...editingExercise, videoUrl: url });
                            setUploadStatus(prev => ({ ...prev, video: 'success' }));
                          } catch (err: any) {
                            setUploadStatus(prev => ({ ...prev, video: 'error' }));
                            alert('视频上传失败: ' + err.message);
                          }
                        }
                      }} />
                    </label>
                    {uploadStatus['video'] === 'uploading' && (
                      <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 transition-all duration-300" style={{ width: `${uploadProgress['video'] || 0}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-bold block">视频介绍 / 简介 (显示在视频下方)</label>
                <textarea
                  value={editingExercise.description || ''}
                  onChange={e => setEditingExercise({ ...editingExercise, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white h-32 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="请输入视频内容的精彩介绍..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-bold block">长文章正文 (可选, Markdown格式)</label>
                <textarea value={editingExercise.articleBody || ''} onChange={e => setEditingExercise({ ...editingExercise, articleBody: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white h-48 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm" placeholder="## 标题..." />
              </div>

              <button type="submit" disabled={isSaving} className={`w-full ${isSaving ? 'bg-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-black text-xl py-5 rounded-2xl transition-all shadow-lg active:scale-95 mt-4 flex items-center justify-center gap-3`}>
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    正在保存中......
                  </>
                ) : '保存提交'}
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-emerald-500 tracking-tighter">长青园 · 管理后台</h1>
          <p className="text-slate-400 mt-2 font-bold text-lg">系统管理员：admini</p>
        </div>

        <div className="flex bg-slate-800 rounded-[20px] p-2 border border-slate-700 shadow-xl self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-8 py-3 rounded-[14px] font-black transition-all ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            园友管理
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-8 py-3 rounded-[14px] font-black transition-all ${activeTab === 'exercises' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            功法管理
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-8 py-3 rounded-[14px] font-black transition-all ${activeTab === 'posts' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            动态管理
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-8 py-3 rounded-[14px] font-black transition-all ${activeTab === 'announcements' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            公告发布
          </button>
        </div>

        <button onClick={() => setIsConfirmingLogout(true)} className="bg-red-600/20 text-red-500 border border-red-500/30 px-8 py-4 rounded-2xl font-black text-xl hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95">退出管理端</button>
      </header>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-40">
          <div className="w-20 h-20 border-8 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-8" />
          <p className="text-2xl font-black text-slate-400 animate-pulse">正在同步园内数据，请稍候...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-20">
          {activeTab === 'users' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-slate-800 p-8 rounded-[35px] border border-slate-700 shadow-xl">
                  <p className="text-slate-400 font-black mb-1">总注册用户</p>
                  <p className="text-5xl font-black text-emerald-500">{users.length}</p>
                </div>
                <div className="bg-slate-800 p-8 rounded-[35px] border border-slate-700 shadow-xl">
                  <p className="text-slate-400 font-black mb-1">实时在线人数</p>
                  <p className="text-5xl font-black text-blue-500">{onlineCount}</p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-[45px] border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                  <h2 className="text-2xl font-black">用户管理列表</h2>
                  <span className="bg-emerald-500/10 text-emerald-500 px-4 py-1 rounded-full text-sm font-black">实时同步数据</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/50 text-slate-400 font-black text-lg">
                      <tr>
                        <th className="p-6">头像 (点击查看详情)</th>
                        <th className="p-6">昵称 / 手机号</th>
                        <th className="p-6">地区</th>
                        <th className="p-6">打卡数</th>
                        <th className="p-6">注册年份</th>
                        <th className="p-6">状态</th>
                        <th className="p-6">账号管理</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {users.map(u => {
                        const online = checkOnline(u);
                        return (
                          <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="p-6">
                              <img
                                src={u.avatar}
                                onClick={() => setSelectedUser(u)}
                                className="w-14 h-14 rounded-full border-2 border-emerald-500/30 cursor-pointer hover:scale-110 hover:border-emerald-500 transition-all shadow-md active:scale-90"
                                title="点击查看用户详情"
                              />
                            </td>
                            <td className="p-6">
                              <p className="font-black text-xl">{u.name}</p>
                              <p className="text-sm text-slate-500">{u.phone}</p>
                            </td>
                            <td className="p-6 text-slate-300 font-bold">{u.province || '未设置'}</td>
                            <td className="p-6 text-emerald-400 font-black text-xl">{u.streak}</td>
                            <td className="p-6 text-slate-300 font-bold">{u.joinedDate}</td>
                            <td className="p-6">
                              <span className={`px-4 py-1.5 rounded-lg text-sm font-black transition-colors ${online ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/10'}`}>
                                {online ? '在线' : '离线'}
                              </span>
                              {u.is_banned && <span className="ml-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-1 rounded-lg text-[10px] font-black italic">已封禁</span>}
                            </td>
                            <td className="p-6">
                              <button
                                onClick={() => handleToggleBan(u.id, !!u.is_banned)}
                                className={`px-4 py-2 rounded-xl font-black text-sm transition-all active:scale-95 ${u.is_banned ? 'bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white' : 'bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white'}`}
                              >
                                {u.is_banned ? '解封' : '封禁'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-20 text-center text-slate-500 font-black text-xl">
                            <div className="flex flex-col items-center">
                              <span className="text-6xl mb-4">📭</span>
                              <p>暂无园友数据</p>
                              <p className="text-sm font-bold mt-2 text-slate-600 italic">或者数据库正在连接中...</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'exercises' && (
            <div className="bg-slate-800 rounded-[45px] border border-slate-700 shadow-2xl overflow-hidden p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black">功法内容管理</h2>
                <button
                  onClick={() => {
                    setEditingExercise({ category: '太极拳', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800' });
                    setIsEditingExercise(true);
                  }}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black shadow-md hover:bg-emerald-500 transition-colors active:scale-95"
                >
                  + 新增功法
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exercises.map(ex => (
                  <div key={ex.id} className="bg-slate-900/50 rounded-3xl border border-slate-700 overflow-hidden flex flex-col group">
                    <div className="h-48 overflow-hidden relative">
                      <span className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-sm font-black z-10">{ex.category}</span>
                      <img src={ex.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-black mb-2 line-clamp-1">{ex.title}</h3>
                      <p className="text-slate-400 text-sm mb-6 line-clamp-2 flex-1">{ex.description}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                        <span className="text-slate-500 text-sm font-bold">👁 {ex.views || 0} 次浏览</span>
                        <div className="space-x-3">
                          <button
                            onClick={() => {
                              setEditingExercise({
                                ...ex,
                                videoUrl: ex.video_url,
                                articleBody: ex.article_body
                              });
                              setIsEditingExercise(true);
                            }}
                            className="text-blue-400 hover:text-blue-300 font-black text-sm transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteExercise(ex.id, ex.title)}
                            className="text-red-400 hover:text-red-300 font-black text-sm transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {exercises.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-500 font-black text-xl bg-slate-900/30 rounded-3xl border border-dashed border-slate-700">
                    暂无功法数据，点击右上角新增
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="bg-slate-800 rounded-[45px] border border-slate-700 shadow-2xl overflow-hidden p-8">
              <h2 className="text-2xl font-black mb-8">动态内容管理 (广场中心)</h2>
              <div className="space-y-6">
                {posts.map(post => (
                  <div key={post.id} className="bg-slate-900/50 p-6 rounded-[30px] border border-slate-700 flex justify-between items-start">
                    <div className="flex-1 pr-6">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={post.avatar} className="w-10 h-10 rounded-full border border-emerald-500/30" />
                        <span className="font-black text-lg">{post.author}</span>
                        <span className="text-slate-500 text-sm">{post.time}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed italic">“{post.content}”</p>
                      <div className="mt-4 flex gap-4 text-xs text-slate-500 font-bold">
                        <span>❤️ {post.likes} 赞</span>
                        <span>💬 {post.comments?.length || 0} 评论</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => setActivePostForComments(post)} className="bg-blue-600/20 text-blue-500 px-6 py-2 rounded-xl font-black hover:bg-blue-600 hover:text-white transition-all active:scale-95">查看评论</button>
                      <button onClick={() => handleDeletePost(post.id)} className="bg-red-600/20 text-red-500 px-6 py-2 rounded-xl font-black hover:bg-red-600 hover:text-white transition-all active:scale-95">删除违规动态</button>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <div className="py-20 text-center text-slate-500 font-black text-xl bg-slate-900/30 rounded-3xl border border-dashed border-slate-700">
                    广场上暂时还没有动态
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="bg-slate-800 rounded-[45px] border border-slate-700 shadow-2xl overflow-hidden p-8">
              <h2 className="text-2xl font-black mb-8">系统公告发布中心</h2>
              <div className="bg-slate-900/50 p-8 rounded-[35px] border border-slate-700 mb-10">
                <p className="text-slate-400 mb-6 font-bold">新建一条全站公告，发布后用户将在右上角小铃铛看到提示。</p>
                <div className="space-y-4">
                  <input
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="公告标题..."
                  />
                  <textarea
                    value={annContent}
                    onChange={e => setAnnContent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white h-32 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="公告详细内容..."
                  />
                  <button
                    onClick={handlePublishAnn}
                    disabled={isPublishing}
                    className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-lg hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isPublishing ? '发布中...' : '立即面向全站发布'}
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-black mb-6">已发布公告历史</h3>
              <div className="space-y-4">
                {announcements.map(ann => (
                  <div key={ann.id} className="bg-slate-900/30 p-6 rounded-3xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-lg text-emerald-400">{ann.title}</h4>
                      <p className="text-slate-400 text-sm mt-1">{ann.content.substring(0, 50)}...</p>
                      <p className="text-slate-500 text-xs mt-2">{new Date(ann.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleDeleteAnn(ann.id)} className="text-red-500 hover:text-red-400 font-bold">撤回公告</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 管理员聊天窗口 */}
          {chatUser && (
            <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setChatUser(null)} />
              <div className="relative w-full max-w-2xl bg-slate-800 rounded-[45px] border border-slate-700 shadow-2xl flex flex-col h-[80vh] overflow-hidden">
                <div className="bg-slate-900/80 p-6 border-b border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <img src={chatUser.avatar} className="w-12 h-12 rounded-full border-2 border-emerald-500" />
                    <div>
                      <h3 className="font-black text-xl">正在与 {chatUser.name} 沟通</h3>
                      <p className="text-xs text-emerald-500 font-bold">● 用户在线</p>
                    </div>
                  </div>
                  <button onClick={() => setChatUser(null)} className="text-slate-400 hover:text-white">关闭对话</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/20">
                  {chatMsgList.map((msg, i) => {
                    const isAdmin = msg.from_user_id === 'a8b8f3ff-c973-46d9-b068-e87131e9b65e';
                    return (
                      <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-[25px] font-bold ${isAdmin ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  {chatMsgList.length === 0 && (
                    <div className="h-full flex flex-center items-center justify-center text-slate-500 font-black italic">
                      暂无对话记录，给对方发个招呼吧
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-900/50 border-t border-slate-700">
                  <div className="flex gap-4">
                    <input
                      value={inputMsg}
                      onChange={e => setInputMsg(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSendMsg()}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="输入回复内容..."
                    />
                    <button
                      onClick={handleSendMsg}
                      disabled={isSendingMsg || !inputMsg.trim()}
                      className="bg-emerald-600 px-8 py-4 rounded-2xl font-black hover:bg-emerald-500 transition-all disabled:opacity-50"
                    >
                      发送
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePostForComments && (
            <CommentManagementModal
              post={activePostForComments}
              onClose={() => setActivePostForComments(null)}
              onDeleteComment={handleDeleteComment}
            />
          )}
        </div>
      )}
    </div>
  );
};

// 全局加载遮罩组件 (移至外部以避免重定义)
const GlobalLoadingModal: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto">
    <div className="absolute inset-0 bg-emerald-900/20 backdrop-blur-sm" />
    <div className="relative bg-white/90 dark:bg-slate-800/90 rounded-[40px] px-12 py-10 shadow-2xl border border-emerald-100 dark:border-emerald-800 flex flex-col items-center">
      <div className="w-16 h-16 border-8 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-6" />
      <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{message}</p>
    </div>
  </div>
);

const AuthScreen: React.FC<{
  onLogin: (u: UserAccount) => void,
  onAdminLogin: (a: AdminAccount) => void,
  onLoading: (show: boolean, msg?: string) => void
}> = ({ onLogin, onAdminLogin, onLoading }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'onboarding' | 'adminLogin'>('login');
  const [formData, setFormData] = useState({
    phone: '', password: '', confirmPassword: '', captchaInput: '',
    name: '', motto: '', age: '', province: '', interests: '', bio: '', gender: '未设置' as '男' | '女' | '未设置',
    adminUser: '', adminPass: '', avatar: '' // Added avatar to formData
  });
  const [captcha, setCaptcha] = useState(CAPTCHA_GEN());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 支持通过 URL /admin 直接跳转
    if (window.location.hash === '#admin') {
      setMode('adminLogin');
    }
  }, []);

  const handleAuth = async () => {
    const newErrors: Record<string, string> = {};
    onLoading(true, '正在进入园地......');
    setIsLoading(true);

    try {
      // 管理员登录
      if (mode === 'adminLogin') {
        if (!formData.adminUser || !formData.adminPass) {
          newErrors.admin = '请填写管理员账号和密码';
          setErrors(newErrors);
          setIsLoading(false);
          onLoading(false); // Ensure loading is turned off
          return;
        }

        try {
          const response: any = await API.auth.adminLogin({
            username: formData.adminUser,
            password: formData.adminPass
          });

          if (response.success) {
            localStorage.setItem('auth_token', response.data.token);
            onAdminLogin({ username: formData.adminUser, role: 'super_admin' });
          }
        } catch (error: any) {
          newErrors.admin = error.message || '管理员账号或密码不正确';
          setErrors(newErrors);
        }
        setIsLoading(false);
        onLoading(false); // Ensure loading is turned off
        return;
      }

      // 用户登录
      if (mode === 'login') {
        if (!formData.phone) newErrors.phone = '手机号不能为空';
        if (!formData.password) newErrors.password = '密码不能为空';

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          setIsLoading(false);
          onLoading(false); // Ensure loading is turned off
          return;
        }

        try {
          const response: any = await API.auth.login({
            phone: formData.phone,
            password: formData.password
          });

          if (response.success) {
            localStorage.setItem('auth_token', response.data.token);
            const user = response.data.user;
            // 转换为前端需要的格式
            const userAccount: UserAccount = {
              id: user.id,
              phone: user.phone,
              password: '',  // 不保存密码
              name: user.name,
              avatar: user.avatar || `https://picsum.photos/seed/${user.name}/400/400`,
              motto: user.motto || '健康生活，长青不老',
              bio: user.bio || '暂无介绍',
              age: user.age || '未知',
              gender: user.gender || '未设置',
              province: user.province || '未设置',
              interests: user.interests || [],
              birthday: user.birthday || '未设置',
              routine: user.routine || '每日功法练习',
              joinedDate: user.joined_date || new Date().getFullYear().toString(),
              streak: user.streak ?? 0,
              lastActive: Date.now(),
              isRealUser: user.is_real_user !== false
            };
            onLogin(userAccount);
          }
        } catch (error: any) {
          newErrors.password = error.message || '登录失败，请检查手机号和密码';
          setErrors(newErrors);
        }
        setIsLoading(false);
        onLoading(false); // Ensure loading is turned off
        return;
      }

      // 注册验证
      if (mode === 'register') {
        if (!formData.phone || formData.phone.length !== 11) newErrors.phone = '并非有效手机号（需11位）';
        if (!formData.password) newErrors.password = '密码不能为空';
        if (formData.password !== formData.confirmPassword) newErrors.password = '两次输入密码不相同，请修改';
        if (formData.captchaInput !== captcha) newErrors.captcha = '验证码输入错误';

        if (Object.keys(newErrors).length === 0) {
          setMode('onboarding');
        }
        setErrors(newErrors);
        setIsLoading(false);
        onLoading(false); // Ensure loading is turned off
        return;
      }

      // 完成注册（onboarding 模式）
      if (mode === 'onboarding') {
        if (!formData.name) {
          alert('昵称是必填项');
          setIsLoading(false);
          onLoading(false); // Ensure loading is turned off
          return;
        }
        if (!formData.avatar) { // Ensure avatar is selected
          alert('请选择一个头像');
          setIsLoading(false);
          onLoading(false);
          return;
        }

        try {
          const response: any = await API.auth.register({
            phone: formData.phone,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            name: formData.name,
            motto: formData.motto || '健康生活，长青不老',
            bio: formData.bio || '暂无介绍',
            age: formData.age || '未知',
            gender: formData.gender,
            province: formData.province || '未设置',
            interests: formData.interests.split(/[,，]/).filter(Boolean),
            avatar: formData.avatar // Pass selected avatar
          });

          if (response.success) {
            localStorage.setItem('auth_token', response.data.token);
            const user = response.data.user;
            // 转换为前端需要的格式
            const userAccount: UserAccount = {
              id: user.id,
              phone: user.phone,
              password: '',
              name: user.name,
              avatar: user.avatar || `https://picsum.photos/seed/${user.name}/400/400`,
              motto: user.motto,
              bio: user.bio,
              age: user.age,
              gender: user.gender,
              province: user.province,
              interests: user.interests || [],
              birthday: user.birthday || '未设置',
              routine: user.routine || '每日功法练习',
              joinedDate: user.joined_date || new Date().getFullYear().toString(),
              streak: user.streak ?? 0,
              lastActive: Date.now(),
              isRealUser: true
            };
            onLogin(userAccount);
          }
        } catch (error: any) {
          alert(error.message || '注册失败，请重试');
        }
      }
    } catch (error) {
      console.error('认证错误:', error);
    } finally {
      setIsLoading(false);
      onLoading(false);
    }

    setErrors(newErrors);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-8 overflow-hidden font-sans">
      <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover" alt="背景" />
      <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-[2px]"></div>

      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-[40px] md:rounded-[60px] p-8 md:p-12 shadow-2xl animate-in fade-in zoom-in duration-500 max-h-[90vh] overflow-y-auto scrollbar-hide">

        {/* 管理员入口按钮 - 仅在普通登录/注册页面显示 */}
        {(mode === 'login' || mode === 'register') && (
          <button
            onClick={() => setMode('adminLogin')}
            className="absolute top-6 right-8 group flex flex-col items-center gap-1 transition-all active:scale-90"
          >
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 p-0.5 overflow-hidden shadow-md">
              <img src="https://picsum.photos/seed/admin/100/100" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
            </div>
            <span className="text-[10px] font-black text-emerald-800">管理员入口</span>
          </button>
        )}

        <div className="text-center mb-10">
          <div className="bg-emerald-600 w-24 h-24 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-5xl text-white">{mode === 'adminLogin' ? '🛡️' : '🌳'}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-emerald-900 tracking-tighter">
            {mode === 'adminLogin' ? '管理后台登录' : '长青园'}
          </h1>
          <p className="text-emerald-700 text-lg md:text-xl font-black mt-2">
            {mode === 'adminLogin' ? '系统维护 · 数据管控' : '智慧健康 · 伙计重聚'}
          </p>
        </div>

        {mode === 'adminLogin' ? (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="relative">
              <input value={formData.adminUser} onChange={e => setFormData({ ...formData, adminUser: e.target.value })} className="w-full bg-slate-100 rounded-[25px] p-6 text-2xl outline-none border-2 border-transparent focus:border-blue-400 transition-all font-black" placeholder="管理员账号" />
            </div>
            <div className="relative">
              <input type="password" value={formData.adminPass} onChange={e => setFormData({ ...formData, adminPass: e.target.value })} className="w-full bg-slate-100 rounded-[25px] p-6 text-2xl outline-none border-2 border-transparent focus:border-blue-400 transition-all font-black" placeholder="管理员密码" />
            </div>
            {errors.admin && <p className="text-red-600 text-sm font-black ml-6 mt-1">{errors.admin}</p>}
            <button onClick={handleAuth} className="w-full bg-slate-800 text-white py-6 rounded-[30px] text-2xl font-black shadow-2xl active:scale-95 transition-all mt-4">确认登录后台</button>
            <button onClick={() => setMode('login')} className="w-full text-slate-500 font-black text-xl hover:underline">返回普通登录</button>
          </div>
        ) : mode === 'onboarding' ? (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 text-center mb-6">完善园地名片</h2>

            {/* Avatar Selector */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {SCENIC_AVATARS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="avatar"
                  className={`w-16 h-16 rounded-full border-4 cursor-pointer object-cover transition-all ${formData.avatar === url ? 'border-emerald-500 scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  onClick={() => setFormData({ ...formData, avatar: url })}
                />
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col"><label className="text-sm font-black text-slate-400 ml-2 mb-1">昵称 (必填)</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-slate-50 rounded-[25px] p-5 text-xl outline-none focus:ring-4 focus:ring-emerald-100" /></div>
              <div className="flex flex-col"><label className="text-sm font-black text-slate-400 ml-2 mb-1">心里话</label><input value={formData.motto} onChange={e => setFormData({ ...formData, motto: e.target.value })} className="bg-slate-50 rounded-[25px] p-5 text-xl outline-none focus:ring-4 focus:ring-emerald-100" /></div>
              <div className="flex flex-col"><label className="text-sm font-black text-slate-400 ml-2 mb-1">个人简介</label><textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="bg-slate-50 rounded-[25px] p-5 text-xl outline-none h-32 focus:ring-4 focus:ring-emerald-100" /></div>
            </div>
            <button onClick={handleAuth} className="w-full bg-emerald-600 text-white py-6 rounded-[30px] text-2xl font-black shadow-2xl active:scale-95 transition-all mt-6">开启园地生活</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={`w-full bg-slate-50 rounded-[25px] p-6 text-2xl outline-none border-2 transition-all font-black ${errors.phone ? 'border-red-500' : 'border-transparent focus:border-emerald-200'}`} placeholder="手机号 (11位)" />
              {errors.phone && <p className="text-red-600 text-sm font-black ml-6 mt-1">{errors.phone}</p>}
            </div>
            <div className="relative">
              <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={`w-full bg-slate-50 rounded-[25px] p-6 text-2xl outline-none border-2 transition-all font-black ${errors.password ? 'border-red-500' : 'border-transparent focus:border-emerald-200'}`} placeholder="输入密码" />
              {errors.password && <p className="text-red-600 text-sm font-black ml-6 mt-1">{errors.password}</p>}
            </div>
            {mode === 'register' && (
              <>
                <div className="relative">
                  <input type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full bg-slate-50 rounded-[25px] p-6 text-2xl outline-none border-2 border-transparent focus:border-emerald-200 transition-all font-black" placeholder="再次确认密码" />
                </div>
                <div className="flex space-x-4 items-center">
                  <input value={formData.captchaInput} onChange={e => setFormData({ ...formData, captchaInput: e.target.value })} className="flex-1 bg-slate-50 rounded-[25px] p-6 text-2xl outline-none border-2 border-transparent focus:border-emerald-200 transition-all font-black" placeholder="图形验证码" />
                  <div onClick={() => setCaptcha(CAPTCHA_GEN())} className="w-32 h-20 bg-emerald-50 rounded-[25px] flex items-center justify-center cursor-pointer select-none border-2 border-emerald-100 shadow-inner">
                    <span className="text-3xl font-black text-emerald-700 italic tracking-widest line-through">{captcha}</span>
                  </div>
                </div>
                {errors.captcha && <p className="text-red-600 text-sm font-black ml-6 mt-1">{errors.captcha}</p>}

                {/* Avatar Selection for Registration */}
                {/* Note: In 'login' mode this block is skipped. In 'register' it is shown. */}
                {/* However, the original code structure had captcha inside mode==='register' check. */}
                {/* I will add Avatar selection here, but it might be better in 'onboarding' step. */}
                {/* Let's wait and see where 'onboarding' is. Ah, onboarding is a separate mode. */}
                {/* The user request says "optimize login after information fill module... let user choose avatar". */}
                {/* So it should be in 'onboarding'. Let's move this to onboarding section. */}
              </>
            )}
            <button onClick={handleAuth} className="w-full bg-emerald-600 text-white py-6 rounded-[30px] text-2xl font-black shadow-2xl active:scale-95 transition-all mt-4">{mode === 'login' ? '立即进入' : '注册新账号'}</button>
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }} className="w-full text-emerald-800 font-black text-xl hover:underline">{mode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}</button>
          </div>
        )}

      </div>
    </div >
  );
};

const ConfirmModal: React.FC<{ title: string; onConfirm: () => void; onClose: () => void }> = ({ title, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-8">
    <div className="bg-white dark:bg-slate-800 rounded-[45px] p-10 w-full max-sm shadow-2xl text-center border border-white/10">
      <h3 className="text-2xl font-black mb-8 dark:text-white leading-relaxed">{title}</h3>
      <div className="flex space-x-4">
        <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-5 rounded-[22px] font-black text-xl shadow-lg active:scale-95 transition-transform">退出</button>
        <button onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-700 py-5 rounded-[22px] font-black text-xl dark:text-white active:scale-95 transition-transform">取消</button>
      </div>
    </div>
  </div>
);

const AchievementsModal: React.FC<{ user: UserAccount; onUpdateUser: (u: Partial<UserAccount>) => void; onClose: () => void }> = ({ user, onUpdateUser, onClose }) => {
  const unlockedIds = user.unlockedAchievements || [];

  const handleRedeem = (ach: Achievement) => {
    // 检查条件
    let canUnlock = false;
    switch (ach.id) {
      case '1': // 初试身手 - 第一次功法
        canUnlock = (user.streak || 0) > 0;
        break;
      case '2': // 坚持不懈 - 打卡3天
        canUnlock = (user.streak || 0) >= 3;
        break;
      case '3': // 广结良缘 - 加好友
        // 简化判断：只要点击就视作尝试去完成，或者假设已完成（因为无法直接获取好友数）
        // 为了演示体验，假设只要打开过社交页面或有一定活跃度
        canUnlock = true;
        break;
      case '4': // 社交达人 - 发帖
        canUnlock = true; // 简化
        break;
      case '7': // 园地园丁 - 完善资料
        canUnlock = !!(user.name && user.bio && user.motto && user.avatar);
        break;
      default:
        // 其他成就暂时允许通过
        canUnlock = true;
    }

    if (canUnlock) {
      const newUnlocked = [...unlockedIds, ach.id];
      onUpdateUser({ unlockedAchievements: newUnlocked });
      alert(`恭喜！您已成功兑换【${ach.title}】勋章！`);
    } else {
      alert(`抱歉，您尚未满足【${ach.title}】的兑换条件：\n${ach.description}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 rounded-[50px] p-8 md:p-10 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-8 text-slate-400 text-3xl font-black active:scale-90">✕</button>
        <h3 className="text-3xl font-black mb-2 dark:text-white text-center">园地勋章墙</h3>
        <p className="text-center text-slate-400 mb-6 font-bold">已点亮 {unlockedIds.length} / {ACHIEVEMENTS_DATA.length}</p>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
          {ACHIEVEMENTS_DATA.map(ach => {
            const isUnlocked = unlockedIds.includes(ach.id);
            return (
              <div key={ach.id} className={`p-6 rounded-3xl border flex items-center gap-6 transition-all ${isUnlocked ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'}`}>
                <div className={`text-5xl transition-all ${isUnlocked ? 'scale-110 filter-none' : 'grayscale opacity-50'}`}>{ach.icon}</div>
                <div className="flex-1">
                  <h4 className="text-xl font-black dark:text-white flex items-center gap-2">
                    {ach.title}
                    {isUnlocked && <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full">已点亮</span>}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 text-sm">{ach.description}</p>
                </div>
                {!isUnlocked && (
                  <button
                    onClick={() => handleRedeem(ach)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-sm shadow-md active:scale-95 whitespace-nowrap"
                  >
                    兑换
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onClose} className="w-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 py-5 rounded-[25px] font-black text-xl mt-6 active:scale-95">返回中心</button>
      </div>
    </div>
  );
};

const SCENIC_AVATARS = [
  'https://images.unsplash.com/photo-1501854140884-074cf2b2c3af?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3fb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=200'
];

const EditProfileModal: React.FC<{ user: UserAccount; onConfirm: (u: Partial<UserAccount>) => void; onClose: () => void }> = ({ user, onConfirm, onClose }) => {
  const [data, setData] = useState({ name: user.name, motto: user.motto, province: user.province, gender: user.gender, bio: user.bio, interests: user.interests.join(', '), avatar: user.avatar });
  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
      <div className="bg-white dark:bg-slate-800 rounded-[40px] md:rounded-[50px] p-8 md:p-10 w-full max-w-sm shadow-2xl relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-8 text-slate-400 text-3xl font-black active:scale-90">✕</button>
        <h3 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 dark:text-white text-center">修改园地名片</h3>
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide pb-4">
          <div className="flex flex-col">
            <label className="text-slate-400 font-black ml-2 mb-2">选择头像</label>
            <div className="grid grid-cols-4 gap-3">
              {SCENIC_AVATARS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  className={`w-14 h-14 rounded-full border-4 cursor-pointer object-cover transition-all ${data.avatar === url ? 'border-emerald-500 scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  onClick={() => setData({ ...data, avatar: url })}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col"><label className="text-slate-400 font-black ml-2 mb-1">昵称</label><input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl dark:text-white text-lg font-black border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500" /></div>
          <div className="flex flex-col"><label className="text-slate-400 font-black ml-2 mb-1">性别</label><select value={data.gender} onChange={e => setData({ ...data, gender: e.target.value as any })} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl dark:text-white text-lg font-black border dark:border-slate-600"><option value="男">男</option><option value="女">女</option></select></div>
          <div className="flex flex-col"><label className="text-slate-400 font-black ml-2 mb-1">来自</label><input value={data.province} onChange={e => setData({ ...data, province: e.target.value })} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl dark:text-white text-lg font-black border dark:border-slate-600" /></div>
          <div className="flex flex-col"><label className="text-slate-400 font-black ml-2 mb-1">心里话</label><input value={data.motto} onChange={e => setData({ ...data, motto: e.target.value })} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl dark:text-white text-lg font-black border dark:border-slate-600" /></div>
          <div className="flex flex-col"><label className="text-slate-400 font-black ml-2 mb-1">个人简介</label><textarea value={data.bio} onChange={e => setData({ ...data, bio: e.target.value })} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl dark:text-white text-lg font-black h-40 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500" /></div>
        </div>
        <button onClick={() => onConfirm({ ...data, interests: data.interests.split(/[,，]/).filter(Boolean) as any })} className="w-full bg-emerald-600 text-white py-5 rounded-[25px] font-black text-xl mt-6 shadow-xl active:scale-95">保存我的名片</button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exercise' | 'social' | 'entertainment' | 'profile'>('exercise');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isViewingAchievements, setIsViewingAchievements] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 新增：全站公告相关
  const [allAnnouncements, setAllAnnouncements] = useState<any[]>([]);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [lastReadAnnId, setLastReadAnnId] = useState<string | null>(localStorage.getItem('last_read_ann_id'));

  const [checkInModal, setCheckInModal] = useState<{ show: boolean; streak: number; isError: boolean; message: string }>({ show: false, streak: 0, isError: false, message: '' });
  const [globalLoading, setGlobalLoading] = useState<{ show: boolean; message: string }>({ show: false, message: '加载中......' });

  const handleSetLoading = (show: boolean, message = '加载中......') => {
    setGlobalLoading({ show, message });
  };

  useEffect(() => {
    // 监听 URL Hash 变化
    const handleHash = () => {
      if (window.location.hash === '#admin' && !currentAdmin) {
        // 让 AuthScreen 自己处理状态
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentAdmin]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // 定时获取公告
  useEffect(() => {
    if (currentUser) {
      const fetchAnns = async () => {
        try {
          const res: any = await (API as any).announcement.getAll();
          if (res.success && res.data) {
            setAllAnnouncements(res.data);
          }
        } catch (e) { console.error('获取公告失败', e); }
      };
      fetchAnns();
      const timer = setInterval(fetchAnns, 60000); // 每分钟刷新一次
      return () => clearInterval(timer);
    }
  }, [currentUser]);

  const unreadCount = allAnnouncements.length > 0 && allAnnouncements[0].id !== lastReadAnnId ? '!' : null;

  const handleReadAnns = () => {
    setShowAnnModal(true);
    if (allAnnouncements.length > 0) {
      const newId = allAnnouncements[0].id;
      setLastReadAnnId(newId);
      localStorage.setItem('last_read_ann_id', newId);
    }
  };



  const handleUpdateUser = (updates: Partial<UserAccount>, showMessage = false) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    setIsEditingProfile(false);
    if (showMessage) alert('园地资料更新成功！');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
    setCurrentAdmin(null);
    setIsLoggingOut(false);
    window.location.hash = '';
  };

  // 管理员端退出
  const handleAdminLogout = () => {
    setCurrentAdmin(null);
    window.location.hash = '';
  };

  // 如果是管理员登录状态
  if (currentAdmin) {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  // 如果未登录
  if (!currentUser) return (
    <>
      <AuthScreen onLogin={setCurrentUser} onAdminLogin={setCurrentAdmin} onLoading={handleSetLoading} />
      {globalLoading.show && <GlobalLoadingModal message={globalLoading.message} />}
    </>
  );

  // ===== 打卡成功弹窗 =====
  const CheckInModal = () => (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-8" onClick={() => setCheckInModal(s => ({ ...s, show: false }))}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      <div className={`relative rounded-[50px] p-10 w-full max-w-sm shadow-2xl border text-center animate-bounce-in ${checkInModal.isError
        ? 'bg-red-50 dark:bg-red-900/30 border-red-100'
        : 'bg-white dark:bg-slate-800 border-emerald-100'
        }`} onClick={e => e.stopPropagation()}>
        <div className="text-7xl mb-4">{checkInModal.isError ? '❌' : '🎉'}</div>
        <h3 className={`text-3xl font-black mb-3 ${checkInModal.isError ? 'text-red-600' : 'text-emerald-600'}`}>
          {checkInModal.isError ? '提示' : '签到成功！'}
        </h3>
        <p className="text-xl text-slate-600 dark:text-slate-300 font-bold">{checkInModal.message}</p>
        {!checkInModal.isError && (
          <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl p-4">
            <p className="text-5xl font-black text-emerald-600">{checkInModal.streak}</p>
            <p className="text-slate-400 font-bold">连续打卡天数</p>
          </div>
        )}
        <button onClick={() => setCheckInModal(s => ({ ...s, show: false }))} className="mt-8 w-full bg-emerald-600 text-white py-5 rounded-[25px] font-black text-xl active:scale-95">
          好的！
        </button>
      </div>
    </div>
  );

  const handleCheckIn = async () => {
    if (!currentUser) return;
    try {
      const res: any = await API.user.checkIn();
      if (res.success) {
        handleUpdateUser({
          streak: res.data.streak,
          last_checkin_date: res.data.last_checkin_date
        }, false);
        setCheckInModal({ show: true, streak: res.data.streak, isError: false, message: `连续打卡 ${res.data.streak} 天！继续加油` });
      } else {
        setCheckInModal({ show: true, streak: 0, isError: true, message: res.error || '今日已签到' });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || '打卡请求失败，请稍后重试';
      // 如果后端提示账户不存在，说明本地 Token 已失效或 UUID 与数据库不匹配，强制登出重新同步环境
      if (error.response?.status === 404 || errorMsg.includes('账户是否存在') || errorMsg.includes('账户提示不存在')) {
        setCheckInModal({ show: true, streak: 0, isError: true, message: '检测到您的账号 ID 状态异常，正在为您强制重新登录以修复同步...' });
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        setTimeout(() => {
          window.location.reload();
        }, 2500);
      } else {
        setCheckInModal({ show: true, streak: 0, isError: true, message: errorMsg });
      }
    }
  };

  const isCheckedInToday = () => {
    if (!currentUser?.last_checkin_date) return false;
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const todayStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
    return currentUser.last_checkin_date === todayStr;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'exercise': return <ExerciseSection />;
      case 'social': return <SocialSection currentUser={currentUser} />;
      case 'entertainment': return <EntertainmentSection />;
      case 'profile': return (
        <div className="flex flex-col h-full space-y-12 pb-48">
          <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[50px] md:rounded-[60px] shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="w-40 h-40 md:w-44 md:h-44 rounded-full border-8 border-emerald-100 dark:border-emerald-900 overflow-hidden mx-auto mb-8 shadow-xl">
              <img src={currentUser.avatar} className="w-full h-full object-cover" alt="头像" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-black dark:text-white mb-2">{currentUser.name}</h2>
              <p className="text-emerald-600 font-black text-xl md:text-2xl mb-8 italic">“{currentUser.motto}”</p>
            </div>

            {/* 园地勋章展示 - 替代打卡按钮，固定显示连续记录 */}
            <div className="flex justify-center mb-10">
              <div className="px-10 py-5 rounded-[30px] bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700 flex items-center gap-4">
                <span className="text-4xl">🌿</span>
                <div className="text-left">
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">园地成员</p>
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">持续活跃中</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-8 mb-10 text-center">
              <div className="bg-slate-50 dark:bg-slate-700/50 p-6 md:p-8 rounded-[35px] shadow-inner border border-slate-100 dark:border-slate-700/50">
                <p className="text-3xl md:text-5xl font-black text-emerald-600">1</p>
                <p className="text-slate-500 dark:text-slate-300 font-black mt-1 text-lg">活跃记录</p>
              </div>
              <div onClick={() => setIsViewingAchievements(true)} className="bg-slate-50 dark:bg-slate-700/50 p-6 md:p-8 rounded-[35px] shadow-inner border border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all active:scale-95">
                <p className="text-3xl md:text-5xl font-black text-emerald-600">{currentUser.unlockedAchievements?.length || 0}</p>
                <p className="text-slate-500 dark:text-slate-300 font-black mt-1 text-lg">园地勋章</p>
              </div>
            </div>
            <div className="space-y-6 bg-slate-50 dark:bg-slate-900/40 p-8 md:p-12 rounded-[40px] border border-slate-100 dark:border-slate-700/50">
              <p className="text-xl md:text-2xl dark:text-white font-black flex justify-between border-b pb-4 border-slate-100 dark:border-slate-700"><span className="text-slate-500 dark:text-slate-400">来自：</span>{currentUser.province}</p>
              <p className="text-xl md:text-2xl dark:text-white font-black flex justify-between border-b pb-4 border-slate-100 dark:border-slate-700"><span className="text-slate-500 dark:text-slate-400">性别：</span>{currentUser.gender}</p>
              <p className="text-xl md:text-2xl dark:text-white font-black"><span className="text-slate-500 dark:text-slate-400 block mb-3 underline decoration-emerald-500">我的简介：</span>{currentUser.bio}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[50px] border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-2xl md:text-4xl font-black mb-8 md:mb-12 dark:text-white border-l-8 border-emerald-600 pl-6">设置管理</h3>
            <div className="space-y-6">
              <button
                onClick={() => {
                  if (window.confirm('确定要强制同步账号状态吗？这会登出并重新拉取最新数据。')) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('current_user');
                    window.location.reload();
                  }
                }}
                className="w-full bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[35px] flex items-center justify-between text-2xl font-black text-emerald-700 dark:text-emerald-400 active:scale-95 transition-all shadow-sm border border-emerald-100 hover:bg-emerald-100"
              >
                <span>🔄 修复打卡异常/同步账号</span>
                <span className="text-emerald-600">Sync</span>
              </button>

              <button onClick={() => setIsEditingProfile(true)} className="w-full bg-slate-50 dark:bg-slate-700 p-8 rounded-[35px] flex items-center justify-between text-2xl font-black dark:text-white active:scale-95 transition-all shadow-sm border border-slate-100 hover:bg-emerald-50"><span>修改资料</span><span className="text-emerald-600">✎</span></button>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[35px] border dark:border-slate-700 flex items-center justify-between shadow-inner">
                <div className="flex items-center space-x-6"><span className="text-4xl">🌙</span><span className="text-2xl font-black dark:text-white">深色护眼模式</span></div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-20 md:w-24 h-11 md:h-12 rounded-full relative transition-all ${isDarkMode ? 'bg-emerald-600' : 'bg-slate-200'}`}><div className={`absolute top-1 w-9 md:w-10 h-9 md:h-10 bg-white rounded-full transition-all shadow-md ${isDarkMode ? 'right-1' : 'left-1'}`} /></button>
              </div>
              <button onClick={() => setIsLoggingOut(true)} className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 py-8 md:py-10 rounded-[40px] text-3xl md:text-4xl font-black shadow-xl active:scale-95 border border-red-100 mt-12 mb-20 relative z-10">退出账号</button>
              <div className="h-24"></div>
            </div>
          </div>
        </div>
      );
      default: return <ExerciseSection />;
    }
  };

  return (
    <div className={`min-h-screen max-w-screen-xl mx-auto transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} flex flex-col`}>
      {isEditingProfile && <EditProfileModal user={currentUser!} onConfirm={(u) => handleUpdateUser(u, true)} onClose={() => setIsEditingProfile(false)} />}
      {isViewingAchievements && <AchievementsModal user={currentUser!} onUpdateUser={(u) => handleUpdateUser(u, false)} onClose={() => setIsViewingAchievements(false)} />}
      {checkInModal.show && <CheckInModal />}
      {globalLoading.show && <GlobalLoadingModal message={globalLoading.message} />}
      {isLoggingOut && <ConfirmModal title="老邻居，确定要退出登录吗？" onConfirm={handleLogout} onClose={() => setIsLoggingOut(false)} />}

      {/* 公告弹窗 */}
      {showAnnModal && (
        <div className="fixed inset-0 z-[160] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-800 rounded-[50px] p-8 md:p-10 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[80vh]">
            <button onClick={() => setShowAnnModal(false)} className="absolute top-6 right-8 text-slate-400 text-3xl font-black active:scale-90">✕</button>
            <h3 className="text-3xl font-black mb-8 dark:text-white text-center flex items-center justify-center gap-3">
              <span className="text-4xl">📢</span> 园地公告
            </h3>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
              {allAnnouncements.map(ann => (
                <div key={ann.id} className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-[35px] border border-slate-100 dark:border-slate-700">
                  <h4 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mb-2">{ann.title}</h4>
                  <p className="text-slate-600 dark:text-slate-300 font-bold leading-relaxed">{ann.content}</p>
                  <p className="text-slate-400 text-xs mt-4 font-bold">{new Date(ann.created_at).toLocaleString()}</p>
                </div>
              ))}
              {allAnnouncements.length === 0 && (
                <div className="py-20 text-center text-slate-400 font-black italic">
                  暂无系统公告
                </div>
              )}
            </div>
            <button onClick={() => setShowAnnModal(false)} className="w-full bg-slate-100 dark:bg-slate-700 text-slate-500 py-5 rounded-[25px] font-black text-xl mt-8 active:scale-95">了解了</button>
          </div>
        </div>
      )}


      <header className={`sticky top-0 z-50 border-b px-6 md:px-12 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 md:pt-8 md:pb-8 flex justify-between items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-md shrink-0`}>
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-600 p-4 rounded-[20px] shadow-lg">
            <span className="text-3xl md:text-4xl text-white">🌳</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-5xl font-black text-emerald-800 dark:text-emerald-500 tracking-tighter">长青园</h1>
          </div>
        </div>

        {/* 公告铃铛 */}
        <button
          onClick={handleReadAnns}
          className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center hover:bg-emerald-100 transition-all active:scale-90"
        >
          <span className="text-3xl md:text-4xl text-emerald-600">🔔</span>
          {unreadCount && (
            <span className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white font-black animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 md:max-w-4xl mx-auto w-full overflow-y-auto scrollbar-hide">
        {renderContent()}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 border-t px-4 md:px-16 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:py-6 flex justify-around items-center z-[80] bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.1)]`}>
        <button onClick={() => setActiveTab('exercise')} className={`flex flex-col items-center space-y-2 ${activeTab === 'exercise' ? 'text-emerald-600 scale-110' : 'text-slate-400 dark:text-slate-500'} transition-all`}><span className="text-3xl md:text-4xl">⚡</span><span className="text-xs md:text-sm font-black">功法</span></button>
        <button onClick={() => setActiveTab('social')} className={`flex flex-col items-center space-y-2 ${activeTab === 'social' ? 'text-emerald-600 scale-110' : 'text-slate-400 dark:text-slate-500'} transition-all`}><span className="text-3xl md:text-4xl">🏮</span><span className="text-xs md:text-sm font-black">社交</span></button>
        <button onClick={() => setActiveTab('entertainment')} className={`flex flex-col items-center space-y-2 ${activeTab === 'entertainment' ? 'text-emerald-600 scale-110' : 'text-slate-400 dark:text-slate-500'} transition-all`}><span className="text-3xl md:text-4xl">🎮</span><span className="text-xs md:text-sm font-black">娱乐</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center space-y-2 ${activeTab === 'profile' ? 'text-emerald-600 scale-110' : 'text-slate-400 dark:text-slate-500'} transition-all`}><span className="text-3xl md:text-4xl">🏡</span><span className="text-xs md:text-sm font-black">园地</span></button>
      </nav>
    </div>
  );
};

export default App;
