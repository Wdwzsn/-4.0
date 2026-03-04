import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

// 获取游戏排行榜 (Top 10 + 个人最高分)
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const { gameType } = req.params;
        const userId = (req as any).user?.id;

        // 获取 Top 10
        const { data: topData, error: topError } = await supabase
            .from('game_scores')
            .select(`
                score,
                created_at,
                users ( name, avatar )
            `)
            .eq('game_type', gameType)
            .order('score', { ascending: false })
            .limit(10);

        if (topError) throw topError;

        // 获取个人最高分
        let userBest = null;
        if (userId) {
            const { data: bestData } = await supabase
                .from('game_scores')
                .select('score, created_at')
                .eq('game_type', gameType)
                .eq('user_id', userId)
                .order('score', { ascending: false })
                .limit(1);

            if (bestData && bestData.length > 0) {
                userBest = {
                    score: bestData[0].score,
                    date: bestData[0].created_at
                };
            }
        }

        const leaderboard = (topData || []).map((item: any) => ({
            name: item.users?.name || '未知用户',
            avatar: item.users?.avatar || 'https://picsum.photos/seed/default/100',
            score: item.score,
            date: item.created_at
        }));

        res.json({
            success: true,
            data: leaderboard,
            userBest
        });
    } catch (e: any) {
        res.status(500).json({ success: false, error: '获取失败' });
    }
};

// 提交新分数
export const submitScore = async (req: Request, res: Response) => {
    try {
        const { game_type, score } = req.body;
        const userId = (req as any).user?.id; // 注入的 user object

        if (!userId) {
            return res.status(401).json({ success: false, error: '请先登录' });
        }
        if (!game_type || typeof score !== 'number') {
            return res.status(400).json({ success: false, error: '参数不完整' });
        }

        const { data, error } = await supabase
            .from('game_scores')
            .insert([{ user_id: userId, game_type, score }]);

        if (error) {
            return res.status(500).json({ success: false, error: '上传分数失败' });
        }

        res.status(201).json({ success: true, message: '分数上传成功' });
    } catch (e: any) {
        res.status(500).json({ success: false, error: '上传分数错误' });
    }
};
