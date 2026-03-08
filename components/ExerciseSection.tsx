
import React, { useState, useEffect } from 'react';
import { VIDEO_DATA } from '../constants';
import { VideoContent, ExerciseStep, ExerciseChapter } from '../types';
import API from '../services/apiService';

interface VideoCardProps {
  video: VideoContent;
  onStart: (video: VideoContent) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onStart }) => {
  const isArticle = !!video.articleBody;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 mb-6 transition-all hover:shadow-md">
      <div className="relative aspect-video">
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full text-sm font-bold">
            {video.category}
          </span>
          <span className="text-slate-400 text-sm">{video.views} 学习</span>
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">{video.title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">{video.description}</p>
        <button
          onClick={() => onStart(video)}
          className="mt-4 w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg active:scale-95 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
        >
          {isArticle ? '阅读文章' : '进入训练'}
        </button>
      </div>
    </div>
  );
};

const ArticleOverlay: React.FC<{ video: VideoContent; onClose: () => void }> = ({ video, onClose }) => {
  const [likes, setLikes] = useState(video.likes || 0);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = async () => {
    if (isLiked) return;
    try {
      const res: any = await API.exercise.toggleLike(video.id);
      if (res.success) {
        setLikes(res.likes);
        setIsLiked(true);
      }
    } catch (e) {
      console.error('点赞失败', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-white dark:bg-slate-900 flex flex-col items-center p-0 overflow-hidden">
      <div className="w-full max-w-2xl flex flex-col h-full bg-white dark:bg-slate-900 border-x border-slate-100 dark:border-slate-800">
        <header className="flex justify-between items-center p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
          <h3 className="text-xl md:text-2xl font-black dark:text-white truncate pr-4">{video.title}</h3>
          <button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 p-2 md:p-3 rounded-full active:scale-90 transition-all">
            <span className="text-xl dark:text-white font-black">✕</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
          {/* 上方由背景图填充的核心视觉区 */}
          <div className="relative w-full aspect-[21/9] md:aspect-video overflow-hidden">
            <img src={video.thumbnail} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"></div>
          </div>

          {/* 如果有视频，在这里展示嵌入式窗口 */}
          {video.videoUrl && (
            <div className="px-4 md:px-6 -mt-12 md:-mt-16 relative z-10 mb-8">
              <div className="bg-black rounded-[30px] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-video group relative">
                <video
                  src={video.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  poster={video.thumbnail}
                />
              </div>
              <p className="text-center text-slate-400 font-bold text-sm mt-3 italic">点击窗口即可开始练习视频</p>
            </div>
          )}

          {/* 互动数据栏 */}
          <div className="px-6 md:px-8 flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl font-black text-sm">
                #{video.category}
              </span>
              <span className="text-slate-400 font-bold text-sm">👁 {video.views} 学习次</span>
            </div>
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-2 rounded-2xl font-black transition-all ${isLiked ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
            >
              <span className="text-xl">{isLiked ? '👍' : '🤍'}</span>
              <span>{likes} 点赞</span>
            </button>
          </div>

          {/* 文章详情正文 */}
          <div className="prose prose-emerald dark:prose-invert max-w-none px-6 md:px-10 text-xl leading-loose">
            {video.articleBody?.split('\n').map((para, i) => {
              if (para.trim().startsWith('##')) return <h2 key={i} className="text-2xl md:text-3xl font-black text-emerald-600 mb-4 mt-8">{para.replace('##', '')}</h2>;
              if (para.trim().startsWith('###')) return <h3 key={i} className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-3 mt-6">{para.replace('###', '')}</h3>;
              if (para.trim().length === 0) return null;
              return <p key={i} className="mb-6">{para}</p>;
            })}
          </div>
        </div>

        {/* 底部吸底关闭按钮（增强交互） */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xl shadow-xl shadow-emerald-200 dark:shadow-none active:scale-95 transition-all"
          >
            我已学完，返回功法列表
          </button>
        </div>
      </div>
    </div>
  );
};

const VirtualTeacher: React.FC<{ animationType: string }> = ({ animationType }) => {
  const getAnimationClass = () => {
    switch (animationType) {
      case 'raise': return 'animate-bounce';
      case 'bend': return 'animate-pulse scale-95';
      case 'stretch': return 'translate-y-[-15px] scale-y-110 transition-all duration-1000';
      case 'sway': return 'translate-x-6 transition-all duration-700 ease-in-out alternate infinite';
      case 'jump': return 'animate-bounce scale-110';
      case 'rotate': return 'animate-spin duration-3000';
      default: return '';
    }
  };

  return (
    <div className="relative w-28 h-28 md:w-40 md:h-40 bg-emerald-50 dark:bg-slate-800/80 rounded-full flex items-center justify-center border-4 border-emerald-500/30 overflow-hidden shadow-inner shrink-0">
      <svg width="60" height="60" viewBox="0 0 100 100" className={`text-emerald-600 dark:text-emerald-400 transition-all ${getAnimationClass()}`}>
        <circle cx="50" cy="20" r="10" fill="currentColor" />
        <path d="M50 30 L50 60 L30 90 M50 60 L70 90 M25 45 L50 35 L75 45" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
};

const PracticeOverlay: React.FC<{ video: VideoContent; onClose: () => void }> = ({ video, onClose }) => {
  const [activeChapter, setActiveChapter] = useState<ExerciseChapter | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [completedChapters, setCompletedChapters] = useState<string[]>(() => {
    const saved = localStorage.getItem(`completed-${video.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`completed-${video.id}`, JSON.stringify(completedChapters));
  }, [completedChapters, video.id]);

  if (!video.chapters) return null;

  if (!activeChapter) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-50 dark:bg-slate-900 flex flex-col p-4 md:p-8 overflow-hidden">
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h3 className="text-2xl md:text-3xl font-black dark:text-white">{video.title}</h3>
            <p className="text-slate-400 font-bold mt-1 text-lg">请选择练习大节</p>
          </div>
          <button onClick={onClose} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm text-2xl font-black active:scale-95 transition-all">✕</button>
        </header>
        <div className="flex-1 overflow-y-auto space-y-4 pb-20 scrollbar-hide">
          {video.chapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => { setActiveChapter(ch); setStepIndex(0); }}
              className="w-full bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[35px] border-2 border-transparent hover:border-emerald-500 transition-all flex items-center justify-between shadow-sm group"
            >
              <div className="flex items-center space-x-4 md:space-x-6 text-left">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center font-black text-emerald-600 text-xl">
                  {completedChapters.includes(ch.id) ? '✓' : ''}
                </div>
                <span className="text-xl md:text-2xl font-black dark:text-white">{ch.title}</span>
              </div>
              <span className="text-emerald-500 font-black text-lg">开始训练 →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentStep = activeChapter.steps[stepIndex];
  const isLastStep = stepIndex === activeChapter.steps.length - 1;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900 flex flex-col p-4 md:p-6 text-white overflow-hidden">
      <header className="w-full flex justify-between items-center mb-4 shrink-0">
        <div className="flex flex-col flex-1 overflow-hidden pr-4">
          <h3 className="text-lg md:text-2xl font-black truncate text-emerald-400">{activeChapter.title}</h3>
          <p className="text-white font-bold text-xs md:text-lg">动作进展：{stepIndex + 1} / {activeChapter.steps.length}</p>
        </div>
        <button onClick={() => setActiveChapter(null)} className="bg-white/10 px-4 py-2 rounded-xl font-black text-sm whitespace-nowrap active:bg-white/20">退出大节</button>
      </header>

      {/* 练习内容区域 */}
      <div className="flex-1 flex flex-col items-center overflow-hidden">
        <div className="py-4 shrink-0">
          <VirtualTeacher animationType={currentStep.animationType} />
        </div>

        {/* 详细描述区域 */}
        <div className="w-full max-w-2xl bg-white/5 p-5 md:p-8 rounded-[35px] border border-white/10 backdrop-blur-xl shadow-2xl overflow-y-auto scrollbar-hide flex-1 mb-4">
          <h4 className="text-2xl md:text-3xl font-black text-emerald-400 mb-6 text-center">{currentStep.title}</h4>

          <div className="space-y-6">
            <div className="bg-black/20 p-4 rounded-2xl border-l-4 border-amber-400">
              <h5 className="font-black text-amber-400 text-lg mb-2">【步伐 Stance】</h5>
              <p className="text-lg leading-relaxed text-slate-100">{currentStep.stance}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border-l-4 border-blue-400">
              <h5 className="font-black text-blue-400 text-lg mb-2">【动作 Movement】</h5>
              <p className="text-lg leading-relaxed text-slate-100">{currentStep.movement}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border-l-4 border-emerald-400">
              <h5 className="font-black text-emerald-400 text-lg mb-2">【手势 Hand Gesture】</h5>
              <p className="text-lg leading-relaxed text-slate-100">{currentStep.handGesture}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部按钮栏：明确设置 z-index 确保永远处于最上层并可点 */}
      <div className="relative z-[150] flex space-x-4 w-full max-w-2xl mx-auto shrink-0 py-6 bg-slate-900 border-t border-white/5">
        <button
          disabled={stepIndex === 0}
          onClick={(e) => { e.stopPropagation(); setStepIndex(s => s - 1); }}
          className="flex-1 bg-white/10 py-5 rounded-[25px] text-xl font-black disabled:opacity-20 active:scale-95 active:bg-white/20 transition-all pointer-events-auto"
        >
          上个动作
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isLastStep) {
              if (!completedChapters.includes(activeChapter.id)) {
                setCompletedChapters([...completedChapters, activeChapter.id]);
              }
              setActiveChapter(null);
            } else {
              setStepIndex(s => s + 1);
            }
          }}
          className="flex-1 bg-emerald-600 py-5 rounded-[25px] text-xl font-black shadow-2xl shadow-emerald-500/20 active:scale-95 active:bg-emerald-500 transition-all pointer-events-auto"
        >
          {isLastStep ? "完成训练" : "下个动作"}
        </button>
      </div>
    </div>
  );
};

// ========== 新增：沉浸式视频详情页 (上屏视频 下屏互动) ==========
const VideoPlayDetailPage: React.FC<{ video: VideoContent; onClose: () => void }> = ({ video, onClose }) => {
  const [likes, setLikes] = useState(video.likes || 0);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = async () => {
    if (isLiked) return;
    try {
      const { default: API } = await import('../services/apiService');
      const res: any = await API.exercise.toggleLike(video.id);
      if (res.success) {
        setLikes(res.likes);
        setIsLiked(true);
      }
    } catch (e) {
      console.error('点赞失败', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
      {/* 顶部固定视频区 */}
      <div className="relative w-full aspect-video bg-black shadow-xl shrink-0">
        <video
          src={video.videoUrl}
          controls
          autoPlay
          className="w-full h-full object-contain"
          playsInline
        />
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xl z-10 active:scale-90 transition-all font-black"
        >
          ✕
        </button>
      </div>

      {/* 下部详情交互区 */}
      <div className="flex-1 overflow-y-auto bg-white p-6 md:p-10 scrollbar-hide">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{video.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-slate-400 font-bold text-sm">
              <span>{video.category}</span>
              <span>•</span>
              <span>{video.views} 学习次</span>
            </div>
          </div>
          <button
            onClick={handleLike}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isLiked ? 'text-emerald-600 scale-110' : 'text-slate-400 hover:text-emerald-500 active:scale-95'}`}
          >
            <span className="text-4xl">{isLiked ? '👍' : '🤍'}</span>
            <span className="font-black text-sm">{likes} 点赞</span>
          </button>
        </div>

        {/* 描述区域 */}
        <div className="bg-slate-50 rounded-[35px] p-8 border border-slate-100 mb-20 shadow-inner">
          <h3 className="text-xl font-black text-emerald-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📝</span> 视频介绍
          </h3>
          <p className="text-slate-600 text-xl leading-relaxed font-medium whitespace-pre-wrap">
            {video.description || '暂无详细介绍，请管理员在后台添加。'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-emerald-600 text-white py-5 rounded-[25px] font-black text-xl shadow-xl shadow-emerald-100 active:scale-95 transition-all mb-10"
        >
          返回功法列表
        </button>
      </div>
    </div>
  );
};

export const ExerciseSection: React.FC = () => {
  const [activeContent, setActiveContent] = useState<VideoContent | null>(null);
  const [filter, setFilter] = useState('全部');
  const [videos, setVideos] = useState<VideoContent[]>(VIDEO_DATA); // 默认先给本地数据，防白屏

  useEffect(() => {
    // 从后端拉取管理员添加的功法，追加到本地内置互动功法之后
    API.exercise.getExercises().then((res: any) => {
      if (res.success && res.data && res.data.length > 0) {
        // 将后端数据转换为前端格式
        const remoteData = res.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.type || item.category || '功法',
          // API 返回的是 thumbnailUrl字段
          thumbnail: item.thumbnailUrl || item.thumbnail || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?fit=crop&q=80',
          description: item.description || '',
          views: item.views || 0,
          articleBody: item.articleBody,
          videoUrl: item.videoUrl,
          chapters: item.chapters,
          likes: item.likes || 0
        }));
        // 拼接在本地数据之后，以免覆盖本地带动画的互动功法
        setVideos([...VIDEO_DATA, ...remoteData]);
      }
      // 如果后端空数据，保留 VIDEO_DATA（默认值已设置）
    }).catch((err: any) => {
      console.error('获取后端功法失败，使用默认配置', err);
      // 失败时保持默认本地数据，不做任何修改
    });
  }, []);

  const filteredVideos = filter === '全部'
    ? videos
    : videos.filter(v => v.category === filter);

  const renderOverlay = () => {
    if (!activeContent) return null;

    // 如果有文章内容或有视频链接，统一进入沉浸式详情页 (ArticleOverlay 已升级为复合模式)
    if (activeContent.articleBody || activeContent.videoUrl) {
      return <ArticleOverlay video={activeContent} onClose={() => setActiveContent(null)} />;
    }

    // 否则进入 3D 动作分步练习
    return <PracticeOverlay video={activeContent} onClose={() => setActiveContent(null)} />;
  };

  return (
    <div className="pb-24">
      {renderOverlay()}

      <div className="mb-8 md:mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">每日功法训练</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl mt-2 font-medium">分节指导 · 动作精修</p>
      </div>

      <div className="flex space-x-3 md:space-x-4 mb-8 md:mb-10 overflow-x-auto pb-4 scrollbar-hide">
        {['全部', '太极拳', '八段锦', '养生功', '传统文化'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`whitespace-nowrap px-6 md:px-8 py-3 md:py-4 rounded-2xl text-lg md:text-xl font-black transition-all ${filter === cat
              ? 'bg-emerald-600 text-white shadow-xl scale-105'
              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredVideos.map(video => (
          <VideoCard key={video.id} video={video} onStart={setActiveContent} />
        ))}
        {filteredVideos.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 font-black text-xl bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            这个分类下暂时没有收到功法哦
          </div>
        )}
      </div>
    </div>
  );
};
