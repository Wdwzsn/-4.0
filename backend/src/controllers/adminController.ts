import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest } from '../types/index.js';

/**
 * 获取所有用户列表（管理员）
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        // 先获取所有基础字段
        const { data: users, error } = await supabase
            .from('users')
            .select('id, phone, name, avatar, motto, bio, age, gender, province, birthday, routine, joined_date, streak, last_active, is_real_user, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 尝试获取 is_banned (独立尝试，避免阻塞主查询)
        const { data: banFlags } = await supabase
            .from('users')
            .select('id, is_banned');

        const banMap = new Map();
        if (banFlags) {
            banFlags.forEach(b => banMap.set(b.id, b.is_banned));
        }

        // 为每个用户获取兴趣
        const usersWithDetails = await Promise.all((users || []).map(async (user) => {
            const { data: interests } = await supabase
                .from('user_interests')
                .select('interest')
                .eq('user_id', user.id);

            return {
                ...user,
                is_banned: banMap.get(user.id) || false, // 如果 DB 没这个字段，这里就是 false
                interests: interests?.map(i => i.interest) || []
            };
        }));

        res.json({
            success: true,
            data: usersWithDetails
        });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            error: '获取用户列表失败'
        });
    }
};

/**
 * 获取统计数据（管理员）
 */
export const getStats = async (req: AuthRequest, res: Response) => {
    try {
        // 获取总用户数
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // 获取在线用户数（10分钟内活跃）
        const tenMinutesAgo = new Date(Date.now() - 600000).toISOString();
        const { count: onlineUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('last_active', tenMinutesAgo);

        // 获取今日新增用户数
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: todayUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        // 获取总动态数
        const { count: totalPosts } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true });

        res.json({
            success: true,
            data: {
                totalUsers: totalUsers || 0,
                onlineUsers: onlineUsers || 0,
                todayUsers: todayUsers || 0,
                totalPosts: totalPosts || 0
            }
        });
    } catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({
            success: false,
            error: '获取统计数据失败'
        });
    }
};

/**
 * 新增功法
 */
export const createExercise = async (req: AuthRequest, res: Response) => {
    try {
        const { title, category, thumbnail, description, articleBody, chapters, videoUrl } = req.body;
        if (!title || !category || !thumbnail) {
            return res.status(400).json({ success: false, error: '标题,分类和封面图为必填' });
        }
        const { data, error } = await supabase
            .from('exercises')
            .insert({
                title,
                category,
                thumbnail,
                description,
                article_body: articleBody,
                chapters,
                video_url: videoUrl
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data, message: '添加成功' });
    } catch (error) {
        console.error('新增功法失败:', error);
        res.status(500).json({ success: false, error: '新增失败' });
    }
};

/**
 * 更新功法
 */
export const updateExercise = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // 支持转换命名
        if (updates.articleBody !== undefined) {
            updates.article_body = updates.articleBody;
            delete updates.articleBody;
        }
        if (updates.videoUrl !== undefined) {
            updates.video_url = updates.videoUrl;
            delete updates.videoUrl;
        }

        const { data, error } = await supabase
            .from('exercises')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data, message: '更新成功' });
    } catch (error) {
        console.error('更新功法失败:', error);
        res.status(500).json({ success: false, error: '更新失败' });
    }
};

/**
 * 删除功法
 */
export const deleteExercise = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('exercises')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('删除功法失败:', error);
        res.status(500).json({ success: false, error: '删除失败' });
    }
};

/**
 * 管理员发送消息给用户 (以“管理员”虚拟身份)
 */
export const sendAdminMessage = async (req: AuthRequest, res: Response) => {
    try {
        const adminVirtualId = 'a8b8f3ff-c973-46d9-b068-e87131e9b65e'; // initAdminUser.ts 中生成的 ID
        const { toUserId, content } = req.body;

        if (!toUserId || !content) {
            return res.status(400).json({ success: false, error: '用户ID和内容不能为空' });
        }

        const { data, error } = await supabase
            .from('messages')
            .insert({
                from_user_id: adminVirtualId,
                to_user_id: toUserId,
                content,
                role: 'friend', // 在用户侧显示为“邻居/好友”
                is_read: false
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data, message: '消息已由管理员发出' });
    } catch (error: any) {
        console.error('管理员发消息失败:', error);
        res.status(500).json({ success: false, error: '发送失败' });
    }
};

/**
 * 管理员查阅与某用户的对话记录
 */
export const getAdminMessages = async (req: AuthRequest, res: Response) => {
    try {
        const adminVirtualId = 'a8b8f3ff-c973-46d9-b068-e87131e9b65e';
        const { userId } = req.params;

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(from_user_id.eq.${adminVirtualId},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${adminVirtualId})`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: messages
        });
    } catch (error: any) {
        console.error('管理员获取消息失败:', error);
        res.status(500).json({ success: false, error: '获取失败' });
    }
};
/**
 * 删除评论 (管理员)
 */
export const deleteComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: '评论已成功删除' });
    } catch (error) {
        console.error('管理员删除评论错误:', error);
        res.status(500).json({ success: false, error: '删除评论失败' });
    }
};

/**
 * 封禁/解封用户 (管理员)
 */
export const toggleUserBan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { isBanned } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({ is_banned: isBanned })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({
            success: true,
            data,
            message: isBanned ? '用户已封禁' : '用户已解禁'
        });
    } catch (error) {
        console.error('管理员切换封禁状态错误:', error);
        res.status(500).json({ success: false, error: '操作失败' });
    }
};
