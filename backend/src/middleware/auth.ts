import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import { supabase } from '../config/supabase.js';

/**
 * 认证中间件 - 验证 JWT token
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: '未提供认证令牌'
            });
        }

        const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
        const payload = verifyToken(token);

        if (!payload) {
            return res.status(401).json({
                success: false,
                error: '无效或过期的令牌'
            });
        }

        // 检查用户是否被封禁 (实现强制实时登出)
        if (payload.id) {
            try {
                const { data: user, error } = await supabase
                    .from('users')
                    .select('is_banned')
                    .eq('id', payload.id)
                    .single();

                // 如果字段不存在，Supabase 会返回错误，我们忽略它以保证业务可用
                if (!error && user?.is_banned) {
                    return res.status(403).json({
                        success: false,
                        isBanned: true,
                        error: '账号已经被管理员封禁，请联系管理员或者重新注册新的账号'
                    });
                }
            } catch (e) {
                console.warn('检查封禁状态时出错（可能字段不存在）:', e);
            }
        }

        // 将用户信息附加到请求对象
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: '认证失败'
        });
    }
};

/**
 * 管理员认证中间件
 */
export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticate(req, res, () => {
        if (!req.user?.isAdmin) {
            return res.status(403).json({
                success: false,
                error: '需要管理员权限'
            });
        }
        next();
    });
};
