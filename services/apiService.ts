/// <reference types="vite/client" />
import axios, { AxiosInstance, AxiosError } from 'axios';

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 300000, // 超时时间延长到 5 分钟，避免视频等大文件上传超时
});

// 请求拦截器 - 添加 token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器 - 错误处理
apiClient.interceptors.response.use(
    (response) => response.data,
    (error: AxiosError<any>) => {
        if (error.response) {
            // 服务器返回了错误
            const message = error.response.data?.error || '请求失败';

            // 401 未授权 - 清除 token 并跳转登录
            if (error.response.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user');
                window.location.href = '/';
            }

            // 403 封禁处理
            if (error.response.status === 403 && error.response.data?.isBanned) {
                alert(error.response.data.error || '账号已被封禁');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user');
                window.location.href = '/';
            }

            return Promise.reject(new Error(message));
        } else if (error.request) {
            // 请求已发送但没有收到响应
            return Promise.reject(new Error('服务器无响应，请检查网络连接'));
        } else {
            // 其他错误
            return Promise.reject(new Error('请求配置错误'));
        }
    }
);

// ========== 认证相关 API ==========

export interface RegisterData {
    phone: string;
    password: string;
    confirmPassword: string;
    name: string;
    avatar?: string;
    motto?: string;
    bio?: string;
    age?: string;
    gender?: '男' | '女' | '未设置';
    province?: string;
    interests?: string[];
}

export interface LoginData {
    phone: string;
    password: string;
}

export interface AdminLoginData {
    username: string;
    password: string;
}

export const authAPI = {
    // 用户注册
    register: async (data: RegisterData) => {
        return apiClient.post('/auth/register', data);
    },

    // 用户登录
    login: async (data: LoginData) => {
        return apiClient.post('/auth/login', data);
    },

    // 管理员登录
    adminLogin: async (data: AdminLoginData) => {
        return apiClient.post('/auth/admin-login', data);
    },

    // 登出
    logout: async () => {
        return apiClient.post('/auth/logout');
    },
};

// ========== 用户相关 API ==========

export const userAPI = {
    // 获取当前用户信息
    getProfile: async () => {
        return apiClient.get('/users/profile');
    },

    // 更新用户资料
    updateProfile: async (data: any) => {
        return apiClient.put('/users/profile', data);
    },

    // 获取指定用户信息
    getUserById: async (userId: string) => {
        return apiClient.get(`/users/${userId}`);
    },

    // 更新用户活跃时间
    updateActivity: async () => {
        return apiClient.put('/users/activity');
    },

    // 搜索用户
    searchUserByPhone: async (phone: string) => {
        return apiClient.get(`/users/search?phone=${phone}`);
    },

    // 每日打卡
    checkIn: async () => {
        return apiClient.post('/users/checkin');
    }
};

// ========== 动态相关 API ==========

export const postAPI = {
    // 获取动态列表
    getPosts: async (page: number = 1, limit: number = 20) => {
        return apiClient.get(`/posts?page=${page}&limit=${limit}`);
    },

    // 创建动态
    createPost: async (data: { content: string; fullContent?: string; image?: string; targetLikes?: number }) => {
        return apiClient.post('/posts', data);
    },

    // 点赞动态
    likePost: async (postId: string) => {
        return apiClient.post(`/posts/${postId}/like`);
    },

    // 取消点赞
    unlikePost: async (postId: string) => {
        return apiClient.delete(`/posts/${postId}/like`);
    },

    // 添加评论
    addComment: async (postId: string, data: { content: string; parentCommentId?: string }) => {
        return apiClient.post(`/posts/${postId}/comments`, data);
    },

    // 获取评论列表
    getComments: async (postId: string) => {
        return apiClient.get(`/posts/${postId}/comments`);
    },

    // 删除动态
    deletePost: async (postId: string) => {
        return apiClient.delete(`/posts/${postId}`);
    }
};

// ========== 好友相关 API ==========

export const friendAPI = {
    // 获取好友列表
    getFriends: async () => {
        return apiClient.get('/friends');
    },

    // 发送好友请求
    sendFriendRequest: async (toPhone: string) => {
        return apiClient.post('/friends/request', { toPhone });
    },

    // 获取好友请求列表
    getFriendRequests: async () => {
        return apiClient.get('/friends/requests');
    },

    // 接受好友请求
    acceptFriendRequest: async (requestId: string) => {
        return apiClient.put(`/friends/requests/${requestId}/accept`);
    },

    // 删除好友
    deleteFriend: async (friendId: string) => {
        return apiClient.delete(`/friends/${friendId}`);
    },
};

// ========== 消息相关 API ==========

export const messageAPI = {
    // 获取与某好友的聊天记录
    getMessages: async (friendId: string) => {
        return apiClient.get(`/messages/${friendId}`);
    },

    // 发送消息
    sendMessage: async (data: { toUserId: string; content: string; role?: 'user' | 'friend' }) => {
        return apiClient.post('/messages', data);
    },

    // 标记消息已读
    markAsRead: async (messageId: string) => {
        return apiClient.put(`/messages/${messageId}/read`);
    },
};

// ========== 管理员相关 API ==========

export const adminAPI = {
    // 获取所有用户列表
    getAllUsers: async () => {
        return apiClient.get('/admin/users');
    },

    // 获取统计数据
    getStats: async () => {
        return apiClient.get('/admin/stats');
    },

    // 文件上传
    upload: async (file: File, onUploadProgress?: (progressEvent: any) => void) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/admin/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress
        });
    },

    // 管理员消息相关
    messages: {
        // 发送管理员消息
        send: async (toUserId: string, content: string) => {
            return apiClient.post('/admin/messages', { toUserId, content });
        },
        // 获取管理员消息历史
        getHistory: async (userId: string) => {
            return apiClient.get(`/admin/messages/${userId}`);
        },
    },

    // 管理员公告相关
    announcements: {
        // 发布公告
        publish: async (title: string, content: string) => {
            return apiClient.post('/admin/announcements', { title, content });
        },
        // 删除公告
        delete: async (id: string) => {
            return apiClient.delete(`/admin/announcements/${id}`);
        },
    },

    // 删除评论
    deleteComment: async (commentId: string) => {
        return apiClient.delete(`/admin/comments/${commentId}`);
    },

    // 封禁/解封用户
    toggleUserBan: async (userId: string, isBanned: boolean) => {
        return apiClient.put(`/admin/users/${userId}/ban`, { isBanned });
    }
};

// ========== 公告 API (用户侧) ==========
export const announcementAPI = {
    // 获取所有公告
    getAll: async () => {
        return apiClient.get('/announcements');
    }
};

// ========== 功法相关 API ==========
export const exerciseAPI = {
    // 获取功法列表
    getExercises: async () => {
        return apiClient.get('/exercises');
    },

    // 增加浏览量
    incrementViews: async (id: string) => {
        return apiClient.post(`/exercises/${id}/views`);
    },

    // (管理员) 新增功法
    createExercise: (data: any) => apiClient.post('/exercises', data),

    // (管理员) 编辑功法
    updateExercise: (id: string, data: any) => apiClient.put(`/exercises/${id}`, data),

    // (管理员) 删除功法
    deleteExercise: (id: string) => apiClient.delete(`/exercises/${id}`),

    // 点赞
    toggleLike: (id: string) => apiClient.post(`/exercises/${id}/like`)
};

// ========== 游戏排行榜 API ==========
export const gameAPI = {
    // 获取某个游戏的排行榜
    getLeaderboard: async (gameType: string) => {
        return apiClient.get(`/games/scores/${gameType}`);
    },

    // 提交游戏分数
    submitScore: async (data: { game_type: string; score: number }) => {
        return apiClient.post('/games/scores', data);
    }
};

const API = {
    auth: authAPI,
    user: userAPI,
    post: postAPI,
    friend: friendAPI,
    message: messageAPI,
    admin: adminAPI,
    exercise: exerciseAPI,
    game: gameAPI,
    announcement: announcementAPI
};

export default API;
