/// <reference types="vite/client" />
import { directAuthAPI } from './directAuth';
import { getAdminSupabase } from './supabaseClient';
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

        return directAuthAPI.register(data as any);
    },

    // 用户登录 - 直接通过 Supabase 处理，无需后端
    login: async (data: LoginData) => {

        return directAuthAPI.login(data);
    },

    // 管理员登录 - 直接通过 Supabase 处理，无需后端
    adminLogin: async (data: AdminLoginData) => {

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

        const db = getAdminSupabase();

        const { error } = await db.from('users').update(data).eq('id', user.id);
        if (error) throw new Error('更新失败');

        const updatedUser = { ...user, ...data };
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        return { success: true, data: updatedUser };
    },

    // 获取指定用户信息
    getUserById: async (userId: string) => {

        const { data, error } = await getAdminSupabase().from('users').select('*').eq('id', userId).single();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    // 更新用户活跃时间
    updateActivity: async () => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        await getAdminSupabase().from('users').update({ last_active: new Date().toISOString() }).eq('id', user.id);
        return { success: true };
    },

    // 搜索用户
    searchUserByPhone: async (phone: string) => {

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

        const db = getAdminSupabase();

        const { data: posts, error } = await db.from('posts')
            .select(`
                *,
                author:users!posts_author_id_fkey(name, avatar),
                post_likes(id, user_id),
                comments(id, content, author_id, created_at)
            `)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) {
            console.error('getPosts error:', error.message);
            return { success: false, data: [] };
        }

        const currentUserId = (() => {
            try { return JSON.parse(localStorage.getItem('current_user') || '{}').id || ''; }
            catch { return ''; }
        })();

        // 批量获取评论作者名字
        const allAuthorIds = [...new Set((posts || []).flatMap((p: any) =>
            (p.comments || []).map((c: any) => c.author_id).filter(Boolean)
        ))];

        let authorMap: Record<string, { name: string; avatar: string }> = {};
        if (allAuthorIds.length > 0) {
            const { data: authorData } = await db.from('users').select('id, name, avatar').in('id', allAuthorIds);
            for (const u of authorData || []) authorMap[u.id] = u;
        }

        const formattedPosts = (posts || []).map((p: any) => ({
            id: p.id,
            author: p.author?.name || '未知用户',
            avatar: p.author?.avatar || 'https://picsum.photos/400/400',
            time: new Date(p.created_at).toLocaleString(),
            content: p.content,
            fullContent: p.full_content,
            image: p.image,  // DB真实字段名是 image 不是 image_url
            likes: p.post_likes?.length || 0,
            hasLiked: (p.post_likes || []).some((l: any) => l.user_id === currentUserId),
            commentsCount: p.comments?.length || 0,
            comments: (p.comments || []).map((c: any) => ({
                id: c.id,
                author: authorMap[c.author_id]?.name || '用户',
                avatar: authorMap[c.author_id]?.avatar || '',
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

        const newPost = {
            author_id: user.id,  // DB真实字段名是 author_id
            content: data.content,
            full_content: data.fullContent || '',
            image: data.image || ''  // DB真实字段名是 image
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

        const { error } = await getAdminSupabase().from('post_likes').insert({ post_id: postId, user_id: user.id });
        return { success: !error };
    },

    // 取消点赞
    unlikePost: async (postId: string) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false };
        const user = JSON.parse(userStr);

        await getAdminSupabase().from('post_likes').delete().match({ post_id: postId, user_id: user.id });
        return { success: true };
    },

    // 添加评论 - 使用 author_id（DB真实字段名）
    addComment: async (postId: string, data: { content: string; parentCommentId?: string }) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false, error: '未登录' };
        const user = JSON.parse(userStr);

        const { error } = await getAdminSupabase().from('comments').insert({
            post_id: postId,
            author_id: user.id,  // DB真实字段是 author_id，不是 user_id
            content: data.content,
            parent_comment_id: data.parentCommentId || null
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    // 获取评论列表
    getComments: async (postId: string) => {
        return { success: true, data: [] }; // 在 getPosts 时已连带返回
    },

    // 删除动态
    deletePost: async (postId: string) => {
        await getAdminSupabase().from('posts').delete().eq('id', postId);
        return { success: true };
    }
};

// ========== 好友相关 API (直连改造) ==========

export const friendAPI = {
    // 获取好友列表
    getFriends: async () => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false, data: [] };
        const user = JSON.parse(userStr);

        const db = getAdminSupabase();

        const { data: friends1, error: e1 } = await db.from('friends')
            .select('friend_id')
            .eq('user_id', user.id);

        const { data: friends2, error: e2 } = await db.from('friends')
            .select('user_id')
            .eq('friend_id', user.id);

        const friendIds = [
            ...(friends1 || []).map((f: any) => f.friend_id),
            ...(friends2 || []).map((f: any) => f.user_id)
        ].filter(Boolean);

        const uniqueIds = [...new Set(friendIds)];
        if (uniqueIds.length === 0) return { success: true, data: [] };

        const { data: users } = await db.from('users')
            .select('id, name, avatar, motto, phone, last_active')
            .in('id', uniqueIds);

        return { success: true, data: users || [] };
    },

    // 发送好友请求 - friend_requests表字段: from_user_id, to_phone, status
    sendFriendRequest: async (toPhone: string) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) { alert('未登录'); return { success: false, error: '未登录' }; }
        const user = JSON.parse(userStr);

        const db = getAdminSupabase();

        // 查找目标用户
        const { data: targets } = await db.from('users').select('id, name').eq('phone', toPhone).limit(1);
        if (!targets || targets.length === 0) return { success: false, error: '用户不存在' };
        const targetUser = targets[0];
        if (targetUser.id === user.id) return { success: false, error: '不能添加自己' };

        // 检查是否已是好友
        const { data: existingFriend } = await db.from('friends')
            .select('id')
            .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${user.id})`)
            .limit(1);
        if (existingFriend && existingFriend.length > 0) return { success: false, error: '已是好友' };

        // 检查是否已有请求  - friend_requests字段: from_user_id, to_phone
        const { data: existingReq } = await db.from('friend_requests')
            .select('id')
            .eq('from_user_id', user.id)
            .eq('to_phone', toPhone)
            .eq('status', 'pending')
            .limit(1);
        if (existingReq && existingReq.length > 0) return { success: false, error: '已发送请求，等待对方确认' };

        const { error } = await db.from('friend_requests').insert({
            from_user_id: user.id,
            to_phone: toPhone,
            status: 'pending'
        });
        if (error) return { success: false, error: error.message };
        return { success: true, message: '好友请求已发送' };
    },

    // 获取好友请求列表
    getFriendRequests: async () => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false, data: [] };
        const user = JSON.parse(userStr);

        // friend_requests表: from_user_id, to_phone - 按当前用户手机号查询振入的请求
        const { data, error } = await getAdminSupabase()
            .from('friend_requests')
            .select('id, from_user_id, status, created_at')
            .eq('to_phone', user.phone)
            .eq('status', 'pending');

        if (error || !data) return { success: false, data: [] };

        // 获取请求人的详细信息
        const fromUserIds = data.map((r: any) => r.from_user_id);
        const { data: fromUsers } = await getAdminSupabase().from('users')
            .select('id, name, avatar, phone')
            .in('id', fromUserIds);

        const fromUserMap = Object.fromEntries((fromUsers || []).map((u: any) => [u.id, u]));

        return {
            success: true, data: data.map((req: any) => ({
                id: req.id,
                fromUserId: req.from_user_id,
                fromUser: fromUserMap[req.from_user_id],
                status: req.status,
                createdAt: req.created_at
            }))
        };
    },

    // 接受好友请求
    acceptFriendRequest: async (requestId: string) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false };
        const user = JSON.parse(userStr);

        const db = getAdminSupabase();

        const { data: req } = await db.from('friend_requests').select('*').eq('id', requestId).single();
        if (!req) return { success: false };

        // 更新请求状态
        await db.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);

        // 建立好友关系（双向）
        await db.from('friends').insert({ user_id: req.from_user_id, friend_id: user.id });

        return { success: true };
    },

    // 删除好友
    deleteFriend: async (friendId: string) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false };
        const user = JSON.parse(userStr);

        const db = getAdminSupabase();

        await db.from('friends').delete().match({ user_id: user.id, friend_id: friendId });
        await db.from('friends').delete().match({ user_id: friendId, friend_id: user.id });
        return { success: true };
    },
};

// ========== 消息相关 API (直连改造) ==========

export const messageAPI = {
    // 获取与某好友的聊天记录
    getMessages: async (friendId: string) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false, data: [] };
        const user = JSON.parse(userStr);

        const db = getAdminSupabase();

        // DB 真实字段: from_user_id, to_user_id, role, content
        const { data, error } = await db.from('messages')
            .select('*')
            .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (error) { console.error('getMessages error:', error.message); return { success: false, data: [] }; }

        return {
            success: true, data: (data || []).map((m: any) => ({
                id: m.id,
                fromUserId: m.from_user_id,
                toUserId: m.to_user_id,
                content: m.content,
                role: m.from_user_id === user.id ? 'user' : 'friend',
                isRead: m.is_read,
                createdAt: m.created_at
            }))
        };
    },

    // 发送消息
    sendMessage: async (data: { toUserId: string; content: string; role?: 'user' | 'friend' }) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false, error: '未登录' };
        const user = JSON.parse(userStr);

        const db = getAdminSupabase();

        // DB 真实字段: from_user_id, to_user_id
        const { data: inserted, error } = await db.from('messages').insert({
            from_user_id: user.id,
            to_user_id: data.toUserId,
            content: data.content,
            role: 'user',
            is_read: false
        }).select().single();

        if (error) { console.error('sendMessage error:', error.message); return { success: false, error: error.message }; }

        return {
            success: true, data: {
                id: inserted.id,
                fromUserId: inserted.from_user_id,
                toUserId: inserted.to_user_id,
                content: inserted.content,
                role: 'user',
                isRead: false,
                createdAt: inserted.created_at
            }
        };
    },

    // 标记消息已读
    markAsRead: async (messageId: string) => {
        await getAdminSupabase().from('messages').update({ is_read: true }).eq('id', messageId);
        return { success: true };
    },
};

// ========== 管理员相关 API (直连改造) ==========

export const adminAPI = {
    // 获取所有用户列表
    getAllUsers: async () => {

        const { data, error } = await getAdminSupabase().from('users').select('*').order('created_at', { ascending: false });
        if (error) return { success: false, data: [] };
        return { success: true, data: data };
    },

    // 获取统计数据
    getStats: async () => {

        const db = getAdminSupabase();

        const { count: userCount } = await db.from('users').select('*', { count: 'exact', head: true });
        const { count: postCount } = await db.from('posts').select('*', { count: 'exact', head: true });
        const { count: exerciseCount } = await db.from('exercises').select('*', { count: 'exact', head: true });
        const { count: likeCount } = await db.from('post_likes').select('*', { count: 'exact', head: true });

        return {
            success: true, data: {
                totalUsers: userCount || 0,
                totalPosts: postCount || 0,
                totalExercises: exerciseCount || 0,
                totalLikes: likeCount || 0
            }
        };
    },

    // 文件上传 (占位，原本由 App.tsx 内部直传)
    upload: async (file: File, onUploadProgress?: (progressEvent: any) => void) => {
        return { success: true, url: '' }; // 已在前端通过 supabase.storage 直接处理
    },

    // 管理员消息相关 - 使用存在的 messages 表
    messages: {
        // 发送管理员消息 (发给用户系统消息)
        send: async (toUserId: string, content: string) => {
            // admin_messages 表不存在, 用 messages 表代替，发布一条现有约定的管理员系统消息
            const adminId = 'system'; // 管理员使用特殊标识
            const { error } = await getAdminSupabase().from('messages').insert({
                from_user_id: '00000000-0000-0000-0000-000000000000', // 系统消息用全0 UUID
                to_user_id: toUserId,
                content: content,
                role: 'admin',
                is_read: false
            });
            return { success: !error, error: error?.message };
        },
        // 获取管理员消息历史
        getHistory: async (userId: string) => {
            const { data } = await getAdminSupabase().from('messages')
                .select('*')
                .eq('to_user_id', userId)
                .eq('role', 'admin')
                .order('created_at', { ascending: true });
            return { success: true, data: data || [] };
        },
    },

    // 管理员公告相关
    announcements: {
        // 发布公告
        publish: async (title: string, content: string) => {

            const { error } = await getAdminSupabase().from('announcements').insert({ title, content });
            return { success: !error };
        },
        // 删除公告
        delete: async (id: string) => {

            const { error } = await getAdminSupabase().from('announcements').delete().eq('id', id);
            return { success: !error };
        },
    },

    // 删除评论
    deleteComment: async (commentId: string) => {

        const { error } = await getAdminSupabase().from('comments').delete().eq('id', commentId);
        return { success: !error };
    },

    // 封禁/解封用户
    toggleUserBan: async (userId: string, isBanned: boolean) => {
        const { error } = await getAdminSupabase().from('users').update({ is_banned: isBanned }).eq('id', userId);
        return { success: !error, message: `操作${!error ? '成功' : '失败'}` };
    },

    // 彻底删除账号 (基于 Supabase ON DELETE CASCADE 会自动清理关联的所有发帖/评论/点赞/好友数据)
    deleteUser: async (userId: string) => {
        const { error } = await getAdminSupabase().from('users').delete().eq('id', userId);
        return { success: !error, error: error?.message };
    }
};

// ========== 公告 API (用户侧) (直连改造) ==========
export const announcementAPI = {
    // 获取所有公告
    getAll: async () => {

        const { data, error } = await getAdminSupabase().from('announcements').select('*').order('created_at', { ascending: false });
        if (error) return { success: false, data: [] };
        return { success: true, data: data };
    }
};

// ========== 功法相关 API (部分直连改造) ==========
export const exerciseAPI = {
    // 获取功法列表
    getExercises: async () => {

        const db = getAdminSupabase();
        const { data, error } = await db.from('exercises').select('*').order('created_at', { ascending: false });
        if (error) return { success: false, data: [] };

        // 格式化数据，兼容原对象结构 (根据数据库实际存在的列进行映射)
        const formatted = (data || []).map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            difficulty: '入门', // DB 无此字段，给个默认值
            duration: '15分钟', // DB 无此字段，默认值
            type: e.category, // 匹配 category 字段
            videoUrl: e.video_url,
            thumbnailUrl: e.thumbnail || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?fit=crop&q=80',
            calories: 0,
            views: e.views || 0,
            likes: Number(localStorage.getItem(`ex_likes_${e.id}`)) || 0,
            hasLiked: localStorage.getItem(`ex_liked_${e.id}`) === 'true',
            articleBody: e.article_body,
            chapters: e.chapters
        }));

        return { success: true, data: formatted };
    },

    // 增加浏览量
    incrementViews: async (id: string) => {

        const db = getAdminSupabase();
        const { data: ex } = await db.from('exercises').select('views').eq('id', id).single();
        if (ex) {
            await db.from('exercises').update({ views: ex.views + 1, updated_at: new Date().toISOString() }).eq('id', id);
        }
        return { success: true };
    },

    // (管理员) 新增功法
    createExercise: async (data: any) => {
        const db = getAdminSupabase();
        // 仅插入数据库中真实存在的列，否则 Supabase 会报 42703 Column does not exist
        const { error } = await db.from('exercises').insert({
            title: data.title,
            description: data.description,
            category: data.type, // 前端传的是 type，DB 叫 category
            video_url: data.videoUrl,
            thumbnail: data.thumbnailUrl, // DB 叫 thumbnail
        });
        return { success: !error, error: error?.message };
    },

    // (管理员) 编辑功法
    updateExercise: async (id: string, data: any) => {
        const db = getAdminSupabase();
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.type !== undefined) updateData.category = data.type;
        if (data.videoUrl !== undefined) updateData.video_url = data.videoUrl;
        if (data.thumbnailUrl !== undefined) updateData.thumbnail = data.thumbnailUrl;

        updateData.updated_at = new Date().toISOString();

        const { error } = await db.from('exercises').update(updateData).eq('id', id);
        return { success: !error, error: error?.message };
    },

    // (管理员) 删除功法
    deleteExercise: async (id: string) => {
        const db = getAdminSupabase();
        const { error } = await db.from('exercises').delete().eq('id', id);
        return { success: !error };
    },

    // 点赞 (因目前 Supabase 表内无 likes 字段，在此临时采用 localStorage 模拟以防点赞闪退丢失)
    toggleLike: async (id: string) => {
        const isLiked = localStorage.getItem(`ex_liked_${id}`) === 'true';
        const currentLikes = Number(localStorage.getItem(`ex_likes_${id}`)) || 0;

        if (isLiked) {
            localStorage.removeItem(`ex_liked_${id}`);
            localStorage.setItem(`ex_likes_${id}`, String(Math.max(0, currentLikes - 1)));
        } else {
            localStorage.setItem(`ex_liked_${id}`, 'true');
            localStorage.setItem(`ex_likes_${id}`, String(currentLikes + 1));
        }

        return { success: true, likes: Number(localStorage.getItem(`ex_likes_${id}`)) };
    }
};

// ========== 游戏排行榜 API (直连改造) ==========
export const gameAPI = {
    // 获取某个游戏的排行榜
    getLeaderboard: async (gameType: string) => {

        const { data, error } = await getAdminSupabase().from('game_scores')
            .select('score, created_at, users(name, avatar)')
            .eq('game_type', gameType)
            .order('score', { ascending: false })
            .limit(50);

        if (error) return { success: false, data: [] };
        return {
            success: true, data: data.map((s: any) => ({
                user: s.users,
                score: s.score,
                createdAt: s.created_at
            }))
        };
    },

    // 提交游戏分数
    submitScore: async (data: { game_type: string; score: number }) => {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return { success: false };
        const user = JSON.parse(userStr);

        await getAdminSupabase().from('game_scores').insert({ user_id: user.id, game_type: data.game_type, score: data.score });
        return { success: true };
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
