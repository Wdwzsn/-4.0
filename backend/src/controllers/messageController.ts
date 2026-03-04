import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest, SendMessageRequest } from '../types/index.js';

/**
 * 获取与某好友的聊天记录
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { friendId } = req.params;

        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
        *,
        from_user:users!messages_from_user_id_fkey(id, name),
        to_user:users!messages_to_user_id_fkey(id, name)
      `)
            .or(`and(from_user_id.eq.${userId},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${userId})`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const formattedMessages = (messages || []).map(msg => ({
            id: msg.id,
            role: msg.role,
            fromId: msg.from_user_id,
            toId: msg.to_user_id,
            content: msg.content,
            timestamp: new Date(msg.created_at).getTime(),
            senderName: msg.from_user.name,
            isRead: msg.is_read
        }));

        res.json({
            success: true,
            data: formattedMessages
        });
    } catch (error) {
        console.error('获取消息错误:', error);
        res.status(500).json({
            success: false,
            error: '获取消息失败'
        });
    }
};

/**
 * 发送消息
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { toUserId, content, role }: SendMessageRequest = req.body;

        if (!toUserId || !content) {
            return res.status(400).json({
                success: false,
                error: '接收者和消息内容不能为空'
            });
        }

        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                from_user_id: userId,
                to_user_id: toUserId,
                content,
                role: role || 'friend',
                is_read: false
            })
            .select(`
        *,
        from_user:users!messages_from_user_id_fkey(id, name)
      `)
            .single();

        if (error) throw error;

        // --- AI 自动回复逻辑 ---
        // 检查接收者是否为 AI 用户 (静水流深: 13800000001, 平步青云: 13800000002)
        // 为了性能，这里先简单的通过 ID 以外的方式判断，或者再次查询用户
        // 但最简单的是在前端控制或者后端查询 receiver 的 phone

        const { data: receiver } = await supabase
            .from('users')
            .select('phone, name')
            .eq('id', toUserId)
            .single();

        if (receiver && (receiver.phone === '13800000001' || receiver.phone === '13800000002')) {
            // 延迟回复模拟真人
            setTimeout(async () => {
                let replyContent = '';
                if (receiver.phone === '13800000001') { // 静水流深 (文雅大爷)
                    const replies = [
                        '也就是您能懂我这份闲情雅致。',
                        '最近身体可好？改天一起去公园走走。',
                        '这书里的智慧啊，真是越品越有味。',
                        '书法讲究心静，您也试试？',
                        '人生如茶，沉浮之间见真味。'
                    ];
                    replyContent = replies[Math.floor(Math.random() * replies.length)];
                } else { // 平步青云 (热情大妈)
                    const replies = [
                        '哎哟，那个超市今天鸡蛋打折，赶紧去！',
                        '今晚广场舞您来不来？新学的曲子可好听了。',
                        '我看您这气色不错，有什么养生秘诀？',
                        '我家那小孙子，昨天又调皮了，真是让人哭笑不得。',
                        '改天给您送点我自己腌的咸菜，下饭着呢！'
                    ];
                    replyContent = replies[Math.floor(Math.random() * replies.length)];
                }

                try {
                    await supabase.from('messages').insert({
                        from_user_id: toUserId, // AI 发送
                        to_user_id: userId,     // 给用户
                        content: replyContent,
                        role: 'friend',
                        is_read: false
                    });
                } catch (err) {
                    console.error('AI Auto-reply failed:', err);
                }
            }, 2000); // 2秒后回复
        }
        // -----------------------

        res.status(201).json({
            success: true,
            data: {
                id: message.id,
                role: message.role,
                fromId: message.from_user_id,
                toId: message.to_user_id,
                content: message.content,
                timestamp: new Date(message.created_at).getTime(),
                senderName: message.from_user.name,
                isRead: message.is_read
            },
            message: '消息已发送'
        });
    } catch (error) {
        console.error('发送消息错误:', error);
        res.status(500).json({
            success: false,
            error: '发送消息失败'
        });
    }
};

/**
 * 标记消息为已读
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', id);

        res.json({
            success: true,
            message: '已标记为已读'
        });
    } catch (error) {
        console.error('标记消息错误:', error);
        res.status(500).json({
            success: false,
            error: '标记失败'
        });
    }
};
