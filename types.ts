
export interface VideoContent {
  id: string;
  title: string;
  category: '太极拳' | '八段锦' | '养生功' | '传统文化';
  thumbnail: string;
  duration?: string;
  description: string;
  views: number;
  chapters?: ExerciseChapter[];
  articleBody?: string;
}

export interface ExerciseChapter {
  id: string;
  title: string;
  steps: ExerciseStep[];
}

export interface ExerciseStep {
  title: string;
  stance: string;
  movement: string;
  handGesture: string;
  animationType: 'sway' | 'bend' | 'stretch' | 'raise' | 'jump' | 'rotate';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'friend';
  fromId: string;
  toId: string;
  content: string;
  timestamp: number;
  senderName?: string;
}

export type TabType = 'exercise' | 'social' | 'profile' | 'admin_dashboard';

export interface Post {
  id: string;
  author: string;
  authorId: string;
  avatar: string;
  content: string;
  fullContent?: string;
  image?: string;
  likes: number;
  targetLikes?: number;
  likedBy?: string[];
  time: string;
  comments: Comment[];
  isLiked?: boolean;
  isUserPost?: boolean;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  time: string;
  replies?: Comment[];
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  isUnlocked: boolean;
  date?: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  bio: string;
  motto: string;
  age: string;
  gender: '男' | '女' | '未设置';
  interests: string[];
  birthday: string;
  routine: string;
  province: string;
  joinedDate: string;
  streak: number;
  last_checkin_date?: string;
  lastActive?: number;
  isRealUser?: boolean;
  unlockedAchievements?: string[];
}

export interface Friend extends UserProfile {
  status: 'online' | 'offline';
  lastMessage?: string;
  isPinned?: boolean;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromPhone: string;
  fromAvatar: string;
  toPhone: string;
  status: 'pending' | 'accepted';
}

export interface UserAccount extends UserProfile {
  password: string;
}

export interface AdminAccount {
  username: string;
  role: 'super_admin';
}
