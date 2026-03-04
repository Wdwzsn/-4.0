import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, Post, Comment, Friend, UserAccount, FriendRequest } from '../types';
import { getAICompanionResponse } from '../services/geminiService';
import API from '../services/apiService';

const UserProfileModal: React.FC<{ userId: string; currentUserId: string; onClose: () => void; onAddFriend: (phone: string) => void; onChat: (friend: Friend) => void }> = ({ userId, currentUserId, onClose, onAddFriend, onChat }) => {
  const [user, setUser] = useState<any>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [friendData, setFriendData] = useState<Friend | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const userRes: any = await API.user.getUserById(userId);
        if (userRes.success) {
          setUser(userRes.data);

          // Check if already friend
          const friendsRes: any = await API.friend.getFriends();
          if (friendsRes.success) {
            const foundFriend = friendsRes.data.find((f: any) => f.id === userId);
            if (foundFriend) {
              setIsFriend(true);
              setFriendData({
                id: foundFriend.id,
                phone: foundFriend.phone,
                name: foundFriend.name,
                avatar: foundFriend.avatar,
                motto: foundFriend.motto,
                status: foundFriend.status,
                isRealUser: foundFriend.isRealUser,
                lastActive: Date.now(), // fallback
                isPinned: foundFriend.isPinned
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (!user && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 rounded-[50px] p-8 md:p-10 w-full max-w-sm shadow-2xl relative flex flex-col items-center animate-in zoom-in duration-300 border border-slate-100 dark:border-slate-700">
        <button onClick={onClose} className="absolute top-6 right-8 text-slate-400 text-3xl font-black active:scale-90">✕</button>

        {isLoading ? (
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin my-10"></div>
        ) : (
          <>
            <img src={user.avatar} className="w-28 h-28 rounded-full border-4 border-emerald-500 shadow-xl mb-6 object-cover" />
            <h3 className="text-3xl font-black dark:text-white mb-2">{user.name}</h3>
            <p className="text-emerald-600 font-bold text-lg italic mb-6">“{user.motto || '暂无签名'}”</p>

            <div className="w-full space-y-4 mb-8">
              <div className="flex justify-between border-b dark:border-slate-700 pb-3">
                <span className="text-slate-400 font-black">来自</span>
                <span className="dark:text-white font-bold">{user.province || '未知'}</span>
              </div>
              <div className="flex justify-between border-b dark:border-slate-700 pb-3">
                <span className="text-slate-400 font-black">性别</span>
                <span className="dark:text-white font-bold">{user.gender || '保密'}</span>
              </div>
              <div className="flex justify-between border-b dark:border-slate-700 pb-3">
                <span className="text-slate-400 font-black">打卡</span>
                <span className="text-emerald-500 font-black">{user.streak || 1} 天</span>
              </div>
              <div className="mt-4">
                <p className="text-slate-400 font-black text-sm mb-2">个人简介</p>
                <p className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                  {user.bio || '这个人很懒，什么也没写'}
                </p>
              </div>
            </div>

            {currentUserId !== userId && (
              <button
                onClick={() => {
                  if (isFriend && friendData) {
                    onChat(friendData);
                  } else {
                    onAddFriend(user.phone);
                  }
                }}
                className={`w-full py-5 rounded-[25px] font-black text-xl shadow-lg active:scale-95 transition-all ${isFriend ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-emerald-600 text-white'}`}
              >
                {isFriend ? '发消息' : '加为好友'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const SocialSection: React.FC<{ currentUser: UserAccount | null }> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'feed' | 'friends'>('chat');
  const [companionMsgs, setCompanionMsgs] = useState<Message[]>([{ id: '1', role: 'assistant', fromId: 'ai', toId: 'me', content: '您好，老邻居！想聊点什么健康话题？', timestamp: Date.now() }]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 广场动态
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchError, setSearchError] = useState('');
  const [foundProfile, setFoundProfile] = useState<UserAccount | Friend | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [newPostText, setNewPostText] = useState('');

  // 好友列表
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // 好友申请
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  const [chattingFriend, setChattingFriend] = useState<Friend | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // 新增：管理员未读消息状态
  const [adminUnread, setAdminUnread] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 聊天记录
  const [messages, setMessages] = useState<Message[]>([]);

  // 加载动态
  useEffect(() => {
    if (activeSubTab === 'feed') {
      const fetchPosts = async () => {
        setIsLoadingPosts(true);
        try {
          const response: any = await API.post.getPosts();
          if (response.success && response.data && response.data.posts) {
            const loadedPosts = response.data.posts.map((p: any) => ({
              id: p.id,
              author: p.author,
              authorId: p.authorId,
              avatar: p.avatar,
              content: p.content,
              likes: p.likes || 0,
              targetLikes: p.targetLikes || 0,
              likedBy: p.likedBy || [],
              likedByIds: p.likedByIds || [],
              time: p.time,
              comments: p.comments.map((c: any) => ({
                id: c.id,
                author: c.author,
                content: c.content,
                time: c.time
              })),
              isUserPost: p.authorId === currentUser?.id,
              isLiked: (p.likedByIds || []).includes(currentUser?.id)
            }));
            setPosts(loadedPosts);
          }
        } catch (error) {
          console.error('加载动态失败', error);
        } finally {
          setIsLoadingPosts(false);
        }
      };
      fetchPosts();
    }
  }, [activeSubTab, currentUser]);

  // 加载好友和申请
  useEffect(() => {
    if (activeSubTab === 'friends' && currentUser) {
      const loadFriendsData = async () => {
        setIsLoadingFriends(true);
        try {
          // 加载好友
          const friendsRes: any = await API.friend.getFriends();
          let loadedFriends = [];
          if (friendsRes.success) {
            loadedFriends = friendsRes.data.map((f: any) => ({
              id: f.id,
              phone: f.phone,
              name: f.name,
              avatar: f.avatar,
              motto: f.motto,
              status: f.status,
              isRealUser: f.isRealUser,
              lastActive: Date.now(),
              isPinned: f.isPinned
            }));
          }

          // 始终在最前面插入管理员
          const adminFriend: Friend = {
            id: 'a8b8f3ff-c973-46d9-b068-e87131e9b65e',
            name: '管理员',
            phone: 'admin',
            avatar: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+CiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI5NSIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI2UyZThmMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1NSUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZvbnQtc2l6ZT0iMzYiIGZpbGw9ImJsYWNrIj6uluepueeQuuWRYTwvdGV4dD48L3N2Zz4=',
            status: 'online',
            isRealUser: false,
            motto: '为您服务，守护长青园',
            lastActive: Date.now(),
            isPinned: true,
            bio: '官方管理账号，负责系统维护与公告发布。',
            age: 'N/A',
            gender: '未设置',
            interests: ['公共服务'],
            province: '长青园',
            birthday: '2024-01-01',
            routine: '全职服务',
            joinedDate: '2024',
            streak: 365
          };

          setFriends([adminFriend, ...loadedFriends]);

          // 加载申请
          const reqRes: any = await API.friend.getFriendRequests();
          if (reqRes.success) {
            setFriendRequests(reqRes.data.map((r: any) => ({
              id: r.id,
              fromId: r.fromId,
              fromName: r.fromName,
              fromPhone: r.fromPhone,
              fromAvatar: r.fromAvatar,
              toPhone: r.toPhone,
              status: r.status
            })));
          }

          // 检查管理员消息是否有更新 (简化逻辑：检查最后一条消息时间)
          const msgRes: any = await API.message.getMessages('a8b8f3ff-c973-46d9-b068-e87131e9b65e');
          if (msgRes.success && msgRes.data.length > 0) {
            const lastMsg = msgRes.data[msgRes.data.length - 1];
            if (lastMsg.fromId !== currentUser.id) {
              // 如果最后一条是管理员发的，且还没在当前会话点开过，显示红点
              setAdminUnread(true);
            }
          }
        } catch (e) {
          console.error('加载好友数据失败', e);
        } finally {
          setIsLoadingFriends(false);
        }
      };
      loadFriendsData();
    }
  }, [activeSubTab, currentUser]);

  // 加载聊天记录
  useEffect(() => {
    if (chattingFriend) {
      const loadMessages = async () => {
        try {
          const res: any = await API.message.getMessages(chattingFriend.id);
          if (res.success) {
            setMessages(res.data.map((m: any) => ({
              id: m.id,
              role: m.fromId === currentUser?.id ? 'user' : 'friend',
              fromId: m.fromId,
              toId: m.toId,
              content: m.content,
              timestamp: m.timestamp // Backend returns number
            })));
          }
        } catch (error) {
          console.error('加载消息失败', error);
        }
      };
      loadMessages();
      // 设置轮询
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [chattingFriend, currentUser]);



  const isOnline = (user: Friend | UserAccount) => {
    if (!user.isRealUser) return true;
    if (!user.lastActive) return false;
    return (Date.now() - user.lastActive) < 600000;
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;

    if (chattingFriend) {
      try {
        const res: any = await API.message.sendMessage({
          toUserId: chattingFriend.id,
          content: inputValue,
          role: 'user'
        });

        if (res.success) {
          // 乐观更新 UI
          const newMsg: Message = {
            id: 'temp_' + Date.now(),
            role: 'user',
            fromId: currentUser.id,
            toId: chattingFriend.id,
            content: inputValue,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, newMsg]);
          setInputValue('');
        }
      } catch (error) {
        console.error('发送消息失败', error);
        alert('发送失败，请重试');
      }
    } else {
      // 陪伴助理对话 (保持原样，或改为 API)
      const userMsg: Message = { id: Date.now().toString(), role: 'user', fromId: 'me', toId: 'ai', content: inputValue, timestamp: Date.now() };
      setCompanionMsgs(prev => [...prev, userMsg]);
      setInputValue('');
      setIsTyping(true);
      const aiResponse = await getAICompanionResponse(inputValue);
      setCompanionMsgs(prev => [...prev, { id: Date.now().toString(), role: 'assistant', fromId: 'ai', toId: 'me', content: aiResponse, timestamp: Date.now() }]);
      setIsTyping(false);
    }
  };

  const handleStartChat = (friend: Friend) => {
    setActiveSubTab('chat');
    setChattingFriend(friend);
    if (friend.id === 'a8b8f3ff-c973-46d9-b068-e87131e9b65e') {
      setAdminUnread(false);
    }
    setViewingProfileId(null);
    setFoundProfile(null);
    setSearchPhone('');
  };

  const handleSearch = async () => {
    if (isSearching) return;
    setSearchError('');
    setFoundProfile(null);
    const phone = searchPhone.trim();
    if (!phone) return;
    if (phone === currentUser?.phone) {
      setSearchError('不能添加自己为好友');
      return;
    }

    setIsSearching(true);
    try {
      const res: any = await API.user.searchUserByPhone(phone);
      if (res.success && res.data) {
        setFoundProfile({
          ...res.data,
          status: 'online', // 默认状态，或者从 search 结果获取
          isRealUser: true
        });
      }
    } catch (error: any) {
      setSearchError(error.message || '搜索失败，请重试');
    } finally {
      setIsSearching(false);
    }
  };

  const sendRequest = async (target: any) => {
    if (!currentUser) return;
    // Check if already friend
    const existingFriend = friends.find(f => f.phone === target.phone);
    if (existingFriend) {
      handleStartChat(existingFriend);
      return;
    }

    // 如果是 AI 用户 (静态配置)，直接在前端将其加入好友列表以丰富体验
    if (target.isRealUser === false) {
      alert('已成功添加 AI 老伙计为好友！');
      setFriends(prev => [...prev, target]);
      setFoundProfile(null);
      setSearchPhone('');
      return;
    }

    try {
      const res: any = await API.friend.sendFriendRequest(target.phone);
      if (res.success) {
        alert('好友邀请已发送，请等待对方同意。');
        setFoundProfile(null);
        setSearchPhone('');
      } else {
        alert(res.error || '发送失败');
      }
    } catch (error: any) {
      alert(error.message || '发送请求失败');
    }
  };

  const acceptRequest = async (req: FriendRequest) => {
    try {
      const res: any = await API.friend.acceptFriendRequest(req.id);
      if (res.success) {
        alert('已成功同意申请，快去和老伙计聊天吧！');
        // 刷新列表
        const newFriendsRes: any = await API.friend.getFriends();
        if (newFriendsRes.success) {
          setFriends(newFriendsRes.data.map((f: any) => ({
            id: f.id,
            phone: f.phone,
            name: f.name,
            avatar: f.avatar,
            motto: f.motto,
            status: f.status,
            isRealUser: f.isRealUser,
            lastActive: Date.now(),
            isPinned: f.isPinned
          })));
        }
        setFriendRequests(prev => prev.filter(r => r.id !== req.id));
      }
    } catch (error) {
      console.error('接受请求失败', error);
      alert('操作失败');
    }
  };

  const publishUserPost = async () => {
    if (!newPostText.trim() || !currentUser) return;
    setIsPosting(true);

    try {
      const res: any = await API.post.createPost({
        content: newPostText,
        targetLikes: Math.floor(Math.random() * 8) + 3
      });

      if (res.success) {
        setNewPostText('');
        setIsPosting(false);
        // 刷新列表
        const response: any = await API.post.getPosts();
        if (response.success && response.data && response.data.posts) {
          const loadedPosts = response.data.posts.map((p: any) => ({
            id: p.id,
            author: p.author,
            authorId: p.authorId,
            avatar: p.avatar,
            content: p.content,
            likes: p.likes || 0,
            targetLikes: p.targetLikes || 0,
            likedBy: p.likedBy || [],
            likedByIds: p.likedByIds || [],
            time: p.time,
            comments: p.comments.map((c: any) => ({
              id: c.id,
              author: c.author,
              content: c.content,
              time: c.time
            })),
            isUserPost: p.authorId === currentUser?.id,
            isLiked: (p.likedByIds || []).includes(currentUser?.id)
          }));
          setPosts(loadedPosts);
        }
      }
    } catch (error) {
      console.error('发布动态失败', error);
      alert('发布失败，请重试');
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('确定要删除这条动态吗？')) return;
    try {
      const res: any = await API.post.deletePost(postId);
      if (res.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (error: any) {
      alert(error.message || '删除失败');
    }
  };

  const togglePin = (id: string) => {
    setFriends(prev => prev.map(f => f.id === id ? { ...f, isPinned: !f.isPinned } : f));
  };

  // 过滤出与当前选中好友的所有对话
  // 现在直接使用从 API 加载的 messages 状态
  const currentChatMessages = messages;

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => (a.isPinned ? -1 : 1));
  }, [friends]);

  const myRequests = friendRequests.filter(r => r.status === 'pending');

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* 动态发布窗口 */}
      {isPosting && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-800 rounded-[50px] p-8 md:p-10 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setIsPosting(false)} className="absolute top-6 right-8 text-slate-400 font-black text-2xl">✕</button>
            <h3 className="text-2xl font-black mb-6 dark:text-white text-center">分享新鲜事</h3>
            <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="记录生活点滴..." className="w-full h-40 bg-slate-50 dark:bg-slate-700 p-6 rounded-3xl dark:text-white text-xl outline-none" />
            <button onClick={publishUserPost} className="w-full bg-emerald-600 text-white py-5 rounded-[25px] font-black text-xl mt-6 shadow-xl active:scale-95 transition-all">确认发布</button>
          </div>
        </div>
      )}

      {/* 聊天窗口 */}
      {chattingFriend && (
        <div className="fixed inset-0 z-[130] bg-slate-50 dark:bg-slate-900 flex flex-col">
          <header className="p-6 border-b flex items-center dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shrink-0">
            <button onClick={() => setChattingFriend(null)} className="mr-4 text-emerald-600 text-3xl font-black active:scale-90">←</button>
            <img src={chattingFriend.avatar} className={`w-12 h-12 rounded-full mr-4 border-2 ${chattingFriend.isRealUser ? (isOnline(chattingFriend) ? 'border-emerald-500' : 'border-amber-400') : 'border-slate-200'}`} />
            <div className="flex flex-col">
              <h3 className="text-xl font-black dark:text-white">{chattingFriend.name}</h3>
              <span className="text-xs text-slate-400">{isOnline(chattingFriend) ? '此时线上' : '此时离线'}</span>
            </div>
          </header>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/50 dark:bg-slate-900/50">
            {currentChatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.fromId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-3xl text-xl shadow-sm ${msg.fromId === currentUser?.id ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-none border border-slate-100 dark:border-slate-600'}`}>{msg.content}</div>
              </div>
            ))}
            <div className="h-4"></div>
          </div>
          <div className="p-4 md:p-6 bg-white dark:bg-slate-800 border-t flex space-x-3 items-center shrink-0">
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-slate-100 dark:bg-slate-700 px-6 h-14 rounded-full text-xl dark:text-white outline-none" placeholder="输入你想说的话..." />
            <button onClick={handleSendMessage} className="bg-emerald-600 text-white w-14 h-14 flex items-center justify-center rounded-full shrink-0 shadow-lg active:scale-90 transition-transform">
              <span className="text-3xl text-white">▲</span>
            </button>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <div className="flex bg-white dark:bg-slate-800 p-2 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 mb-8 shrink-0 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveSubTab('chat')} className={`flex-1 min-w-[100px] py-4 text-lg md:text-xl font-black rounded-2xl transition-all ${activeSubTab === 'chat' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>陪伴助理</button>
        <button onClick={() => setActiveSubTab('feed')} className={`flex-1 min-w-[100px] py-4 text-lg md:text-xl font-black rounded-2xl transition-all ${activeSubTab === 'feed' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>广场中心</button>
        <button onClick={() => setActiveSubTab('friends')} className={`flex-1 min-w-[100px] py-4 text-lg md:text-xl font-black rounded-2xl transition-all ${activeSubTab === 'friends' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>
          我的邻居
          {(myRequests.length > 0 || adminUnread) && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">!</span>}
        </button>
      </div>

      {/* 列表区域 */}
      {activeSubTab === 'chat' && (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-[40px] shadow-sm overflow-hidden border border-slate-100 dark:border-slate-700">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-900/40 scrollbar-hide">
            {companionMsgs.map((msg) => (
              <div key={msg.id} className={`flex ${msg.fromId === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 md:p-6 rounded-[30px] text-xl shadow-sm ${msg.fromId === 'me' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-none'}`}>{msg.content}</div>
              </div>
            ))}
            {isTyping && <div className="text-slate-400 italic text-lg animate-pulse ml-4 font-black">园地助理正在思考中...</div>}
          </div>
          <div className="p-4 md:p-5 bg-white dark:bg-slate-800 border-t flex items-center space-x-3 md:space-x-4 shrink-0">
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="聊一聊近况..." className="flex-1 bg-slate-100 dark:bg-slate-700 dark:text-white px-6 md:px-8 h-14 rounded-full text-xl outline-none" />
            <button onClick={handleSendMessage} className="bg-emerald-600 text-white w-14 h-14 flex items-center justify-center rounded-full shadow-lg shrink-0 active:scale-90 transition-transform">
              <span className="text-3xl">▲</span>
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'feed' && (
        <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
          <button onClick={() => setIsPosting(true)} className="w-full bg-white dark:bg-slate-800 py-6 rounded-[35px] border-2 border-dashed border-emerald-200 text-emerald-600 font-black text-xl md:text-2xl active:scale-95 shadow-sm shrink-0">发布新鲜事生活 +</button>
          <div className="flex-1 overflow-y-auto space-y-8 pb-32 scrollbar-hide">
            {(isLoadingPosts && posts.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse transition-all">
                <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-black text-xl">园地动态正在快马加鞭加载中...</p>
              </div>
            ) : posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center space-x-5 mb-6">
                  <img src={post.avatar} onClick={() => setViewingProfileId(post.authorId)} className="w-14 h-14 md:w-16 md:h-16 rounded-full cursor-pointer border-2 border-slate-100 object-cover" />
                  <div className="flex-1">
                    <h4 onClick={() => setViewingProfileId(post.authorId)} className="font-black text-xl md:text-2xl dark:text-white cursor-pointer hover:text-emerald-600">{post.author}</h4>
                    <span className="text-slate-400 text-sm font-bold">{post.time}</span>
                  </div>
                  {post.isUserPost && (
                    <button onClick={() => handleDeletePost(post.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 active:scale-95">
                      <span className="text-2xl">🗑</span>
                    </button>
                  )}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xl md:text-2xl mb-6 leading-relaxed font-medium">{post.content}</p>

                {post.likedBy && post.likedBy.length > 0 && (
                  <div className="flex items-center space-x-[-12px] mb-4 pl-1">
                    {post.likedBy.slice(0, 8).map((av, idx) => (
                      <img key={idx} src={av} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 shadow-sm object-cover" />
                    ))}
                    <span className="ml-6 text-sm text-slate-400 font-black">{post.likes} 位老邻居已赞</span>
                  </div>
                )}

                <div className="flex space-x-10 text-slate-500 border-t pt-6 border-slate-100 dark:border-slate-700/50">
                  <button onClick={async () => {
                    if (!currentUser) return;
                    // 乐观更新
                    const isLiked = !post.isLiked;
                    const newLikes = isLiked ? post.likes + 1 : post.likes - 1;
                    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes, isLiked } : p));

                    try {
                      if (isLiked) {
                        await API.post.likePost(post.id);
                      } else {
                        await API.post.unlikePost(post.id);
                      }
                    } catch (e) {
                      console.error('点赞操作失败');
                      // 回滚
                      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: post.likes, isLiked: post.isLiked } : p));
                    }
                  }} className={`flex items-center space-x-3 ${post.isLiked ? 'text-red-500' : ''}`}><span className="text-3xl">❤</span> <span className="font-black text-xl">{post.likes}</span></button>
                  <button onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)} className={`flex items-center space-x-3 ${commentingPostId === post.id ? 'text-emerald-600' : ''}`}><span className="text-3xl">💬</span> <span className="font-black text-xl">{post.comments.length}</span></button>
                </div>

                {commentingPostId === post.id && (
                  <div className="mt-6 flex space-x-3">
                    <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="我也来说两句..." className="flex-1 bg-slate-50 dark:bg-slate-700/50 px-5 h-12 rounded-2xl outline-none dark:text-white border dark:border-slate-600" />
                    <button onClick={async () => {
                      if (!commentText.trim() || !currentUser) return;
                      try {
                        const res: any = await API.post.addComment(post.id, { content: commentText });
                        if (res.success && res.data) {
                          // 后端返回的 data 是评论对象
                          const newComm: Comment = {
                            id: res.data.id,
                            author: res.data.author,
                            content: res.data.content,
                            time: res.data.time
                          };
                          const updated = posts.map(p => p.id === post.id ? { ...p, comments: [...p.comments, newComm] } : p);
                          setPosts(updated); setCommentText(''); setCommentingPostId(null);
                        }
                      } catch (e) {
                        alert('评论失败');
                      }
                    }} className="bg-emerald-600 text-white px-6 rounded-2xl font-black">发送</button>
                  </div>
                )}
                {post.comments.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {post.comments.map(c => (
                      <div key={c.id} className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-3xl border dark:border-slate-800">
                        <span className="font-black dark:text-white text-lg block mb-1 text-emerald-700">{c.author}</span>
                        <p className="dark:text-slate-300 text-lg leading-relaxed">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* 用户详情弹窗 */}
      {viewingProfileId && (
        <UserProfileModal
          userId={viewingProfileId}
          currentUserId={currentUser?.id || ''}
          onClose={() => setViewingProfileId(null)}
          onChat={handleStartChat}
          onAddFriend={async (phone) => {
            try {
              const res: any = await API.friend.sendFriendRequest(phone);
              if (res.success) {
                alert('好友请求已发送');
                setViewingProfileId(null);
              } else {
                alert(res.error || '发送失败');
              }
            } catch (e: any) {
              alert(e.message || '发送失败');
            }
          }}
        />
      )}

      {activeSubTab === 'friends' && (
        <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
          {/* 加好友区域 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
            <h4 className="text-xl font-black mb-4 dark:text-white">寻找老伙计</h4>
            <div className="flex space-x-3">
              <input type="text" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} placeholder="输入手机号进行搜索" className="flex-1 bg-slate-50 dark:bg-slate-700 p-4 h-14 rounded-2xl dark:text-white text-lg outline-none border dark:border-slate-600" />
              <button onClick={handleSearch} disabled={isSearching} className={`bg-emerald-600 text-white px-8 rounded-2xl font-black shadow-md active:bg-emerald-700 transition-colors flex items-center justify-center gap-2 ${isSearching ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {isSearching && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isSearching ? '搜索中' : '搜索'}
              </button>
            </div>
            {searchError && <p className="text-red-500 font-black mt-3 ml-2">{searchError}</p>}
            {foundProfile && (
              <div className="mt-6 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-3xl border-2 border-emerald-100">
                <div className="flex items-center space-x-4">
                  <img src={foundProfile.avatar} className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover" />
                  <span className="text-xl font-black dark:text-white">{foundProfile.name}</span>
                </div>
                <button
                  onClick={() => sendRequest(foundProfile)}
                  className={`px-8 py-3 rounded-xl font-black active:scale-95 transition-transform ${friends.find(f => f.phone === foundProfile.phone) ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-emerald-600 text-white'}`}
                >
                  {friends.find(f => f.phone === foundProfile.phone) ? '发消息' : '申请加好友'}
                </button>
              </div>
            )}
          </div>

          {/* 好友申请 */}
          {myRequests.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-[35px] border border-amber-200 shrink-0">
              <h4 className="font-black text-amber-700 dark:text-amber-500 mb-4 text-lg">新伙计申请</h4>
              {myRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-amber-100 mb-2 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <img src={req.fromAvatar} className="w-12 h-12 rounded-full border-2 border-amber-400" />
                    <span className="font-black dark:text-white">{req.fromName}</span>
                  </div>
                  <button onClick={() => acceptRequest(req)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black">同意</button>
                </div>
              ))}
            </div>
          )}

          {/* 邻居列表 */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700 p-6 overflow-y-auto scrollbar-hide pb-24">
            <h4 className="text-xl font-black mb-6 dark:text-white px-2">我的老邻居</h4>
            {isLoadingFriends ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse transition-all">
                <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-black text-xl">正在为您寻找老邻居...</p>
              </div>
            ) : sortedFriends.length === 0 ? (
              <p className="text-center text-slate-400 py-10">暂无邻居，快去搜索手机号添加吧！</p>
            ) : sortedFriends.map(f => {
              const online = isOnline(f);
              return (
                <div key={f.id} className="flex items-center space-x-4 md:space-x-6 p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-[35px] transition-all border-b border-slate-50 dark:border-slate-700/50">
                  <div className="relative cursor-pointer shrink-0" onClick={() => handleStartChat(f)}>
                    <img src={f.avatar} className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 shadow-lg object-cover ${f.isRealUser ? (online ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-amber-400') : 'border-slate-100'}`} />
                    {online && <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />}
                    {f.id === 'a8b8f3ff-c973-46d9-b068-e87131e9b65e' && adminUnread && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center text-[10px] text-white font-black animate-pulse">!</div>
                    )}
                  </div>
                  <div className="flex-1 cursor-pointer overflow-hidden" onClick={() => setChattingFriend(f)}>
                    <h4 className="font-black text-xl md:text-2xl dark:text-white truncate">{f.name}</h4>
                    <p className="text-slate-400 truncate text-lg font-medium">{online ? '正在线上' : '此时休息'}</p>
                  </div>
                  <div className="flex space-x-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); togglePin(f.id); }} className={`p-3 rounded-2xl font-black ${f.isPinned ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{f.isPinned ? '取消' : '置顶'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
