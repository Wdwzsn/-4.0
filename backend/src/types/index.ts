import { Request } from 'express';

// 扩展 Express Request 接口，添加用户信息
export interface AuthRequest extends Request {
    user?: {
        id: string;
        phone: string;
        isAdmin?: boolean;
    };
}

// 用户注册请求
export interface RegisterRequest {
    phone: string;
    password: string;
    confirmPassword: string;
    name: string;
    motto?: string;
    bio?: string;
    age?: string;
    gender?: '男' | '女' | '未设置';
    province?: string;
    interests?: string[];
}

// 用户登录请求
export interface LoginRequest {
    phone: string;
    password: string;
}

// 管理员登录请求
export interface AdminLoginRequest {
    username: string;
    password: string;
}

// 用户资料更新请求
export interface UpdateProfileRequest {
    name?: string;
    motto?: string;
    bio?: string;
    age?: string;
    gender?: '男' | '女' | '未设置';
    province?: string;
    interests?: string[];
}

// 发布动态请求
export interface CreatePostRequest {
    content: string;
    fullContent?: string;
    image?: string;
    targetLikes?: number;
}

// 添加评论请求
export interface CreateCommentRequest {
    content: string;
    parentCommentId?: string;
}

// 发送好友请求
export interface SendFriendRequestRequest {
    toPhone: string;
}

// 发送消息请求
export interface SendMessageRequest {
    toUserId: string;
    content: string;
    role?: 'user' | 'friend';
}

// 数据库用户模型
export interface User {
    id: string;
    phone: string;
    password_hash: string;
    name: string;
    avatar: string;
    motto: string;
    bio: string;
    age: string;
    gender: '男' | '女' | '未设置';
    province: string;
    birthday: string;
    routine: string;
    joined_date: string;
    streak: number;
    last_active: Date | null;
    is_real_user: boolean;
    created_at: Date;
    updated_at: Date;
}

// 动态模型
export interface Post {
    id: string;
    author_id: string;
    content: string;
    full_content: string | null;
    image: string | null;
    likes_count: number;
    target_likes: number | null;
    created_at: Date;
    updated_at: Date;
}

// 评论模型
export interface Comment {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    parent_comment_id: string | null;
    created_at: Date;
}

// 好友关系模型
export interface Friend {
    id: string;
    user_id: string;
    friend_id: string;
    is_pinned: boolean;
    created_at: Date;
}

// 好友请求模型
export interface FriendRequest {
    id: string;
    from_user_id: string;
    to_phone: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: Date;
    updated_at: Date;
}

// 消息模型
export interface Message {
    id: string;
    from_user_id: string;
    to_user_id: string;
    content: string;
    role: 'user' | 'assistant' | 'friend';
    is_read: boolean;
    created_at: Date;
}

// 成就模型
export interface Achievement {
    id: string;
    user_id: string;
    achievement_type: string;
    unlocked_at: Date;
}

// 公告模型
export interface Announcement {
    id: string;
    title: string;
    content: string;
    author_id: string;
    created_at: Date;
}

// 创建公告请求
export interface CreateAnnouncementRequest {
    title: string;
    content: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
