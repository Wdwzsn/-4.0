import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest, UpdateProfileRequest } from '../types/index.js';

/**
 * 获取当前用户信息
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }

        // 获取用户兴趣
        const { data: interests } = await supabase
            .from('user_interests')
            .select('interest')
            .eq('user_id', userId);

        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                ...userWithoutPassword,
                interests: interests?.map(i => i.interest) || []
            }
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            error: '获取用户信息失败'
        });
    }
};

/**
 * 更新用户资料
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { name, motto, bio, age, gender, province, interests }: UpdateProfileRequest = req.body;

        // 准备更新数据
        const updates: any = { updated_at: new Date().toISOString() };
        if (name !== undefined) updates.name = name;
        if (motto !== undefined) updates.motto = motto;
        if (bio !== undefined) updates.bio = bio;
        if (age !== undefined) updates.age = age;
        if (gender !== undefined) updates.gender = gender;
        if (province !== undefined) updates.province = province;

        // 更新用户基本信息
        const { data: user, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        // 如果更新了兴趣，先删除旧的，再插入新的
        if (interests !== undefined) {
            await supabase.from('user_interests').delete().eq('user_id', userId);

            if (interests.length > 0) {
                const interestRecords = interests.map(interest => ({
                    user_id: userId,
                    interest
                }));
                await supabase.from('user_interests').insert(interestRecords);
            }
        }

        // 获取更新后的兴趣
        const { data: updatedInterests } = await supabase
            .from('user_interests')
            .select('interest')
            .eq('user_id', userId);

        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                ...userWithoutPassword,
                interests: updatedInterests?.map(i => i.interest) || []
            },
            message: '资料更新成功'
        });
    } catch (error) {
        console.error('更新用户资料错误:', error);
        res.status(500).json({
            success: false,
            error: '更新资料失败'
        });
    }
};

/**
 * 获取指定用户信息
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, phone, name, avatar, motto, bio, age, gender, province, birthday, routine, joined_date, streak, last_active, is_real_user')
            .eq('id', id)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }

        // 获取用户兴趣
        const { data: interests } = await supabase
            .from('user_interests')
            .select('interest')
            .eq('user_id', id);

        res.json({
            success: true,
            data: {
                ...user,
                interests: interests?.map(i => i.interest) || []
            }
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            error: '获取用户信息失败'
        });
    }
};

/**
 * 根据手机号搜索用户
 */
export const searchUserByPhone = async (req: AuthRequest, res: Response) => {
    try {
        const { phone } = req.query;

        if (!phone || typeof phone !== 'string') {
            return res.status(400).json({
                success: false,
                error: '请提供手机号'
            });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('id, phone, name, avatar, motto, bio, age, gender, province, is_real_user')
            .eq('phone', phone)
            .single(); // Added .single() here to match the original code structure

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: '未找到该用户'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('搜索用户错误:', error);
        res.status(500).json({
            success: false,
            error: '搜索失败'
        });
    }
};

/**
 * 更新用户活跃时间
 */
export const updateActivity = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        await supabase
            .from('users')
            .update({ last_active: new Date().toISOString() })
            .eq('id', userId);

        res.json({
            success: true,
            message: '活跃时间已更新'
        });
    } catch (error) {
        console.error('更新活跃时间错误:', error);
        res.status(500).json({
            success: false,
            error: '更新失败'
        });
    }
};

/**
 * 用户每日打卡
 */
export const checkIn = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        console.log('--- 打卡调试日志 ---');
        console.log('当前登录用户ID (from Token):', userId);

        // 1. 获取当前用户打卡数据
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, phone, name, streak, last_checkin_date') // 增加字段以便确认
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            console.error('❌ 打卡失败：用户查询返回错误:', fetchError);
            console.log('🔍 调试信息：尝试查询的 ID:', userId);
            // 额外检查是否因为 UUID 格式或大小写问题（虽然 Supabase 通常不会）
            const { count: existsCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('id', userId);
            console.log('🔍 备选查询 (count) 结果:', existsCount);

            return res.status(404).json({
                success: false,
                error: '查无此账户，请退出重新登录以重新同步 ID 到服务器'
            });
        }
        console.log('数据库查得用户信息:', user);

        // 2. 检查今天是否已经打卡
        // 将当前时间转为 YYYY-MM-DD 的字符串进行比对 (本地或 UTC，依据具体业务而定，简单以 ISO 截取)
        const tzOffset = new Date().getTimezoneOffset() * 60000;
        const todayStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];

        if (user.last_checkin_date === todayStr) {
            return res.status(400).json({ success: false, error: '今天已经签到过啦', data: { streak: user.streak } });
        }

        // 3. 计算新连续打卡天数
        let newStreak = (user.streak || 0) + 1;
        // 如果需要可以增加如果断签重置为 1 的逻辑，这里为了鼓励老人，假定不重置或由其他定时任务处理

        // 4. 更新
        const { error: updateError } = await supabase
            .from('users')
            .update({
                streak: newStreak,
                last_checkin_date: todayStr
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: '打卡成功',
            data: { streak: newStreak, last_checkin_date: todayStr }
        });
    } catch (error) {
        console.error('打卡错误:', error);
        res.status(500).json({ success: false, error: '打卡失败' });
    }
};
