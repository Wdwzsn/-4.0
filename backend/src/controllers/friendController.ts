import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest, SendFriendRequestRequest } from '../types/index.js';

/**
 * 获取好友列表
 */
export const getFriends = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // 获取好友关系
        const { data: friendships, error } = await supabase
            .from('friends')
            .select(`
        *,
        friend:users!friends_friend_id_fkey(*)
      `)
            .eq('user_id', userId);

        if (error) throw error;

        // 获取每个好友的兴趣和在线状态
        const friends = await Promise.all((friendships || []).map(async (friendship) => {
            const friend = friendship.friend;

            // 获取兴趣
            const { data: interests } = await supabase
                .from('user_interests')
                .select('interest')
                .eq('user_id', friend.id);

            // 获取最后一条消息
            const { data: lastMessage } = await supabase
                .from('messages')
                .select('content, created_at')
                .or(`and(from_user_id.eq.${userId},to_user_id.eq.${friend.id}),and(from_user_id.eq.${friend.id},to_user_id.eq.${userId})`)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // 判断在线状态（10分钟内活跃算在线）
            const isOnline = friend.last_active ?
                (new Date().getTime() - new Date(friend.last_active).getTime()) < 600000 : false;

            return {
                id: friend.id,
                phone: friend.phone,
                name: friend.name,
                avatar: friend.avatar,
                bio: friend.bio,
                motto: friend.motto,
                age: friend.age,
                gender: friend.gender,
                province: friend.province,
                birthday: friend.birthday,
                routine: friend.routine,
                joinedDate: friend.joined_date,
                streak: friend.streak,
                interests: interests?.map(i => i.interest) || [],
                status: isOnline ? 'online' : 'offline',
                lastMessage: lastMessage?.content,
                isPinned: friendship.is_pinned,
                isRealUser: friend.is_real_user
            };
        }));

        res.json({
            success: true,
            data: friends
        });
    } catch (error) {
        console.error('获取好友列表错误:', error);
        res.status(500).json({
            success: false,
            error: '获取好友列表失败'
        });
    }
};

/**
 * 发送好友请求
 */
export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { toPhone }: SendFriendRequestRequest = req.body;

        if (!toPhone) {
            return res.status(400).json({
                success: false,
                error: '请提供对方手机号'
            });
        }

        // 查找目标用户
        const { data: targetUser, error: userError } = await supabase
            .from('users')
            .select('id, phone')
            .eq('phone', toPhone)
            .single();

        if (userError || !targetUser) {
            return res.status(404).json({
                success: false,
                error: '该手机号未注册'
            });
        }

        // 不能添加自己为好友
        if (targetUser.id === userId) {
            return res.status(400).json({
                success: false,
                error: '不能添加自己为好友'
            });
        }

        // 检查是否已经是好友
        const { data: existingFriend } = await supabase
            .from('friends')
            .select('id')
            .eq('user_id', userId)
            .eq('friend_id', targetUser.id)
            .single();

        if (existingFriend) {
            return res.status(400).json({
                success: false,
                error: '已经是好友了'
            });
        }

        // 检查是否已发送过请求
        const { data: existingRequest } = await supabase
            .from('friend_requests')
            .select('id, status')
            .eq('from_user_id', userId)
            .eq('to_phone', toPhone)
            .single();

        if (existingRequest && existingRequest.status === 'pending') {
            return res.status(400).json({
                success: false,
                error: '已发送过好友请求，请等待对方回应'
            });
        }

        // 创建好友请求
        const { data: request, error } = await supabase
            .from('friend_requests')
            .insert({
                from_user_id: userId,
                to_phone: toPhone,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: request,
            message: '好友请求已发送'
        });
    } catch (error) {
        console.error('发送好友请求错误:', error);
        res.status(500).json({
            success: false,
            error: '发送好友请求失败'
        });
    }
};

/**
 * 获取好友请求列表
 */
export const getFriendRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // 获取当前用户的手机号
        const { data: currentUser } = await supabase
            .from('users')
            .select('phone')
            .eq('id', userId)
            .single();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }

        // 获取发给我的好友请求
        const { data: requests, error } = await supabase
            .from('friend_requests')
            .select(`
        *,
        from_user:users!friend_requests_from_user_id_fkey(id, name, phone, avatar)
      `)
            .eq('to_phone', currentUser.phone)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedRequests = (requests || []).map(req => ({
            id: req.id,
            fromId: req.from_user.id,
            fromName: req.from_user.name,
            fromPhone: req.from_user.phone,
            fromAvatar: req.from_user.avatar,
            toPhone: req.to_phone,
            status: req.status
        }));

        res.json({
            success: true,
            data: formattedRequests
        });
    } catch (error) {
        console.error('获取好友请求错误:', error);
        res.status(500).json({
            success: false,
            error: '获取好友请求失败'
        });
    }
};

/**
 * 接受好友请求
 */
export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        // 获取好友请求详情
        const { data: request, error: requestError } = await supabase
            .from('friend_requests')
            .select('*, from_user:users!friend_requests_from_user_id_fkey(id)')
            .eq('id', id)
            .single();

        if (requestError || !request) {
            return res.status(404).json({
                success: false,
                error: '好友请求不存在'
            });
        }

        // 更新请求状态
        await supabase
            .from('friend_requests')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', id);

        // 双向添加好友关系
        await supabase.from('friends').insert([
            { user_id: userId, friend_id: request.from_user.id },
            { user_id: request.from_user.id, friend_id: userId }
        ]);

        res.json({
            success: true,
            message: '已成为好友'
        });
    } catch (error) {
        console.error('接受好友请求错误:', error);
        res.status(500).json({
            success: false,
            error: '接受好友请求失败'
        });
    }
};

/**
 * 删除好友
 */
export const deleteFriend = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        // 删除双向好友关系
        await supabase
            .from('friends')
            .delete()
            .or(`and(user_id.eq.${userId},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${userId})`);

        res.json({
            success: true,
            message: '已删除好友'
        });
    } catch (error) {
        console.error('删除好友错误:', error);
        res.status(500).json({
            success: false,
            error: '删除好友失败'
        });
    }
};
