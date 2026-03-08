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

            // 临时关闭: 401 未授权 - 清除 token 并跳转登录 (因为后端 API 不可用会导致误判)
            if (error.response.status === 401) {
                console.warn('捕获到 401 错误，但为了保持会话，暂不执行全局登出。');
                // localStorage.removeItem('auth_token');
                // localStorage.removeItem('current_user');
                // window.location.href = '/';
            }

            // 临时关闭: 403 封禁处理
            if (error.response.status === 403 && error.response.data?.isBanned) {
                console.warn('捕获到 403 账号封禁错误。');
                // alert(error.response.data.error || '账号已被封禁');
                // localStorage.removeItem('auth_token');
                // localStorage.removeItem('current_user');
                // window.location.href = '/';
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
    // 用户注册 - 直接通过 Supabase 处理，无需后端
    register: async (data: RegisterData) => {
        const { directAuthAPI } = await import('./directAuth');
        return directAuthAPI.register(data as any);
    },

    // 用户登录 - 直接通过 Supabase 处理，无需后端
    login: async (data: LoginData) => {
        const { directAuthAPI } = await import('./directAuth');
        return directAuthAPI.login(data);
    },

    // 管理员登录 - 直接通过 Supabase 处理，无需后端
    adminLogin: async (data: AdminLoginData) => {
        const { directAuthAPI } = await import('./directAuth');
        return directAuthAPI.adminLogin(data);
    },

    // 登出
    logout: async () => {
        return { success: true, message: '登出成功' };
    },
};


// ========== 用户相关 API (部分直连改造) ==========

export const userAPI = {
    // 获取当前用户信息 - 切换为直接从 localStorage 读取然后直连获取
    getProfile: async () => {
        try {
            const userStr = localStorage.getItem('current_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const { directAuthAPI } = await import('./directAuth');
                // 我们在 directAuth 中暴露一个快速查询的方法，或者前端直接包装返回值
                return { success: true, data: user };
            }
            return { success: false, error: '未找到本地用户信息' };
        } catch (e) {
            return { success: false, error: '获取个人资料失败' };
        }
    },

    // 更新用户资料
    updateProfile: async (data: any) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false, error: '未登录' };
        const user = JSON.parse(userStr);
        const { getAdminSupabase } = await import('./directAuth');
        const db = getAdminSupabase();

        const { error } = await db.from('users').update(data).eq('id', user.id);
        if (error) throw new Error('更新失败');

        const updatedUser = { ...user, ...data };
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        return { success: true, data: updatedUser };
    },

    // 获取指定用户信息
    getUserById: async (userId: string) => {
        const { getAdminSupabase } = await import('./directAuth');
        const { data, error } = await getAdminSupabase().from('users').select('*').eq('id', userId).single();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    // 更新用户活跃时间
    updateActivity: async () => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const { getAdminSupabase } = await import('./directAuth');
        await getAdminSupabase().from('users').update({ last_active: new Date().toISOString() }).eq('id', user.id);
        return { success: true };
    },

    // 搜索用户
    searchUserByPhone: async (phone: string) => {
        const { getAdminSupabase } = await import('./directAuth');
        const { data, error } = await getAdminSupabase().from('users').select('id, name, avatar, bio, motto').eq('phone', phone).limit(5);
        if (error) return { success: false };
        return { success: true, data };
    },

    // 每日打卡
    checkIn: async () => {
        return { success: true, message: '打卡成功（演示环境）' };
    }
};

// ========== 动态相关 API (部分直连改造) ==========

export const postAPI = {
    // 获取动态列表
    getPosts: async (page: number = 1, limit: number = 20) => {
        const { getAdminSupabase } = await import('./directAuth');
        const db = getAdminSupabase();

        // 简单获取 post，前端按点赞和评论拼接
        const { data: posts, error } = await db.from('posts')
            .select(`
                *,
                author:users(name, avatar),
                post_likes(id, user_id),
                comments(id, content, user_id, created_at, users(name))
            `)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) return { success: false, data: [] };

        // 格式化数据以匹配原 Vue/React 组件期待的格式
        const formattedPosts = (posts || []).map((p: any) => ({
            id: p.id,
            author: p.author?.name || '未知用户',
            avatar: p.author?.avatar || 'https://picsum.photos/400/400',
            time: new Date(p.created_at).toLocaleString(),
            content: p.content,
            fullContent: p.full_content,
            image: p.image_url,
            likes: p.post_likes?.length || 0,
            hasLiked: p.post_likes?.some((l: any) => l.user_id === (localStorage.getItem('current_user') ? JSON.parse(localStorage.getItem('current_user')!).id : '')),
            commentsCount: p.comments?.length || 0,
            comments: (p.comments || []).map((c: any) => ({
                id: c.id,
                author: c.users?.name || '用户',
                time: new Date(c.created_at).toLocaleString(),
                content: c.content
            }))
        }));

        return { success: true, data: { posts: formattedPosts, total: formattedPosts.length } };
    },

    // 创建动态
    createPost: async (data: { content: string; fullContent?: string; image?: string; targetLikes?: number }) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false, error: '未登录' };
        const user = JSON.parse(userStr);
        const { getAdminSupabase } = await import('./directAuth');

        const newPost = {
            user_id: user.id,
            content: data.content,
            full_content: data.fullContent || '',
            image_url: data.image || ''
        };

        const { error } = await getAdminSupabase().from('posts').insert(newPost);
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    // 点赞动态
    likePost: async (postId: string) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false };
        const user = JSON.parse(userStr);
        const { getAdminSupabase } = await import('./directAuth');
        await getAdminSupabase().from('post_likes').insert({ post_id: postId, user_id: user.id });
        return { success: true };
    },

    // 取消点赞
    unlikePost: async (postId: string) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false };
        const user = JSON.parse(userStr);
        const { getAdminSupabase } = await import('./directAuth');
        await getAdminSupabase().from('post_likes').delete().match({ post_id: postId, user_id: user.id });
        return { success: true };
    },

    // 添加评论
    addComment: async (postId: string, data: { content: string; parentCommentId?: string }) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false };
        const user = JSON.parse(userStr);
        const { getAdminSupabase } = await import('./directAuth');
        await getAdminSupabase().from('comments').insert({
            post_id: postId,
            user_id: user.id,
            content: data.content
        });
        return { success: true };
    },

    // 获取评论列表
    getComments: async (postId: string) => {
        return { success: true, data: [] }; // 在 getPosts 时已连带返回
    },

    // 删除动态
    deletePost: async (postId: string) => {
        const { getAdminSupabase } = await import('./directAuth');
        await getAdminSupabase().from('posts').delete().eq('id', postId);
        return { success: true };
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

// ========== 功法相关 API (部分直连改造) ==========
export const exerciseAPI = {
    // 获取功法列表
    getExercises: async () => {
        const { getAdminSupabase } = await import('./directAuth');
        const db = getAdminSupabase();
        const { data, error } = await db.from('exercises').select('*').order('created_at', { ascending: false });
        if (error) return { success: false, data: [] };

        // 格式化数据，兼容原对象结构
        const formatted = (data || []).map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            difficulty: e.difficulty,
            duration: e.duration,
            type: e.type,
            videoUrl: e.video_url,
            thumbnailUrl: e.thumbnail_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?fit=crop&q=80',
            calories: e.calories || 0,
            views: e.views || 0,
            likes: e.likes || 0,
            hasLiked: e.likes_users?.includes(localStorage.getItem('current_user') ? JSON.parse(localStorage.getItem('current_user')!).id : '')
        }));

        return { success: true, data: formatted };
    },

    // 增加浏览量
    incrementViews: async (id: string) => {
        const { getAdminSupabase } = await import('./directAuth');
        const db = getAdminSupabase();
        const { data: ex } = await db.from('exercises').select('views').eq('id', id).single();
        if (ex) {
            await db.from('exercises').update({ views: ex.views + 1 }).eq('id', id);
        }
        return { success: true };
    },

    // (管理员) 新增功法
    createExercise: async (data: any) => {
        const { getAdminSupabase } = await import('./directAuth');
        const { error } = await getAdminSupabase().from('exercises').insert({
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            duration: data.duration,
            type: data.type,
            video_url: data.videoUrl,
            thumbnail_url: data.thumbnailUrl,
            calories: data.calories || 0
        });
        return { success: !error };
    },

    // (管理员) 编辑功法
    updateExercise: async (id: string, data: any) => {
        const { getAdminSupabase } = await import('./directAuth');
        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.difficulty) updateData.difficulty = data.difficulty;
        if (data.duration) updateData.duration = data.duration;
        if (data.type) updateData.type = data.type;
        if (data.videoUrl) updateData.video_url = data.videoUrl;
        if (data.thumbnailUrl) updateData.thumbnail_url = data.thumbnailUrl;
        if (data.calories) updateData.calories = data.calories;

        const { error } = await getAdminSupabase().from('exercises').update(updateData).eq('id', id);
        return { success: !error };
    },

    // (管理员) 删除功法
    deleteExercise: async (id: string) => {
        const { getAdminSupabase } = await import('./directAuth');
        const { error } = await getAdminSupabase().from('exercises').delete().eq('id', id);
        return { success: !error };
    },

    // 点赞
    toggleLike: async (id: string) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false };
        const userId = JSON.parse(userStr).id;

        const { getAdminSupabase } = await import('./directAuth');
        const db = getAdminSupabase();

        const { data: ex } = await db.from('exercises').select('likes, likes_users').eq('id', id).single();
        if (!ex) return { success: false };

        const likesUsers = ex.likes_users || [];
        const isLiked = likesUsers.includes(userId);

        const newLikesUsers = isLiked ? likesUsers.filter((u: string) => u !== userId) : [...likesUsers, userId];
        const newLikesCount = isLiked ? Math.max(0, ex.likes - 1) : ex.likes + 1;

        await db.from('exercises').update({ likes: newLikesCount, likes_users: newLikesUsers }).eq('id', id);
        return { success: true };
    }
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
