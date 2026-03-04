import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateToken } from '../utils/jwt.js';
import { RegisterRequest, LoginRequest, AdminLoginRequest, User } from '../types/index.js';

/**
 * 用户注册
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { phone, password, confirmPassword, name, motto, bio, age, gender, province, interests }: RegisterRequest = req.body;

        // 验证必填字段
        if (!phone || !password || !name) {
            return res.status(400).json({
                success: false,
                error: '手机号、密码和昵称为必填项'
            });
        }

        // 验证手机号格式
        if (phone.length !== 11) {
            return res.status(400).json({
                success: false,
                error: '手机号必须为11位'
            });
        }

        // 验证密码确认
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: '两次输入的密码不一致'
            });
        }

        // 检查手机号是否已注册
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('phone', phone)
            .single();

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: '该手机号已注册'
            });
        }

        // 加密密码
        const passwordHash = await hashPassword(password);

        // 创建用户
        const newUser = {
            phone,
            password_hash: passwordHash,
            name,
            avatar: `https://picsum.photos/seed/${name}/400/400`,
            motto: motto || '健康生活，长青不老',
            bio: bio || '暂无介绍',
            age: age || '未知',
            gender: gender || '未设置',
            province: province || '未设置',
            birthday: '未设置',
            routine: '每日功法练习',
            joined_date: new Date().getFullYear().toString(),
            streak: 1, // 默认打卡天数都为1
            last_active: new Date().toISOString(),
            is_real_user: true
        };

        const { data: user, error } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

        if (error) throw error;

        // 如果有兴趣爱好，插入到 user_interests 表
        if (interests && interests.length > 0) {
            const interestRecords = interests.map(interest => ({
                user_id: user.id,
                interest
            }));
            await supabase.from('user_interests').insert(interestRecords);
        }

        // 自动添加 AI 好友 (静水流深, 平步青云)
        const aiPhones = ['13800000001', '13800000002'];
        const { data: aiUsers } = await supabase
            .from('users')
            .select('id')
            .in('phone', aiPhones);

        if (aiUsers && aiUsers.length > 0) {
            const friendRecords = aiUsers.flatMap(aiUser => [
                { user_id: user.id, friend_id: aiUser.id, is_pinned: true }, // 用户添加 AI (默认置顶)
                { user_id: aiUser.id, friend_id: user.id, is_pinned: false }  // AI 添加用户
            ]);
            await supabase.from('friends').insert(friendRecords);
        }

        // 生成 JWT token
        const token = generateToken({ id: user.id, phone: user.phone });

        // 返回用户信息（不包含密码）
        const { password_hash, ...userWithoutPassword } = user;

        res.status(201).json({
            success: true,
            data: {
                user: userWithoutPassword,
                token
            },
            message: '注册成功'
        });
    } catch (error: any) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            error: '注册失败，请稍后重试'
        });
    }
};

/**
 * 用户登录
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { phone, password }: LoginRequest = req.body;

        // 验证必填字段
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                error: '手机号和密码不能为空'
            });
        }

        // 查找用户
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: '此手机号未注册过此软件'
            });
        }

        // 检查用户是否被封禁
        if (user.is_banned) {
            return res.status(403).json({
                success: false,
                isBanned: true,
                error: '账号已经被管理员封禁，请联系管理员或者重新注册新的账号'
            });
        }

        // 验证密码
        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: '密码不正确，请重新输入'
            });
        }

        // 更新最后活跃时间
        await supabase
            .from('users')
            .update({ last_active: new Date().toISOString() })
            .eq('id', user.id);

        // 获取用户兴趣
        const { data: interests } = await supabase
            .from('user_interests')
            .select('interest')
            .eq('user_id', user.id);

        // 生成 JWT token
        const token = generateToken({ id: user.id, phone: user.phone });

        // 返回用户信息（不包含密码）
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: {
                    ...userWithoutPassword,
                    interests: interests?.map(i => i.interest) || []
                },
                token
            },
            message: '登录成功'
        });
    } catch (error: any) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            error: '登录失败，请稍后重试'
        });
    }
};

/**
 * 管理员登录
 */
export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { username, password }: AdminLoginRequest = req.body;

        // 验证必填字段
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: '用户名和密码不能为空'
            });
        }

        // 查找管理员账户
        const { data: admin, error } = await supabase
            .from('admin_accounts')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !admin) {
            return res.status(401).json({
                success: false,
                error: '管理员账号或密码不正确'
            });
        }

        // 验证密码
        const isPasswordValid = await comparePassword(password, admin.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: '管理员账号或密码不正确'
            });
        }

        // 生成 JWT token（包含管理员标识）
        const token = generateToken({
            id: admin.id,
            phone: '',
            isAdmin: true
        });

        res.json({
            success: true,
            data: {
                admin: {
                    username: admin.username,
                    role: admin.role
                },
                token
            },
            message: '管理员登录成功'
        });
    } catch (error: any) {
        console.error('管理员登录错误:', error);
        res.status(500).json({
            success: false,
            error: '登录失败，请稍后重试'
        });
    }
};

/**
 * 登出
 */
export const logout = async (req: Request, res: Response) => {
    // JWT 是无状态的，登出主要由前端处理（删除 token）
    // 这里可以更新用户的 last_active 为 0 表示离线
    res.json({
        success: true,
        message: '登出成功'
    });
};
