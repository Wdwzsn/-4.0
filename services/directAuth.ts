import { adminSupabase } from './supabaseClient';
const JWT_SECRET = 'tyovommaxx070826';

// 简单的一层 Hash 替代 bcryptjs (纯前端兼容)
async function hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 检查是否旧密码
async function verifyPassword(password: string, hash: string): Promise<boolean> {
    if (hash.startsWith('$2')) {
        // 使用 CDN 版 bcrypt
        const dcodeIO = (window as any).dcodeIO;
        if (dcodeIO && dcodeIO.bcrypt) {
            return dcodeIO.bcrypt.compareSync(password, hash);
        }
        throw new Error('密码验证组件未就绪，请刷新重试');
    }
    const newHash = await hashPassword(password);
    return newHash === hash || password === hash;
}

// 生成简单 JWT（浏览器端）
async function generateToken(payload: object): Promise<string> {
    const encode = (obj: object) =>
        btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const now = Math.floor(Date.now() / 1000);
    const header = encode({ alg: 'HS256', typ: 'JWT' });
    const body = encode({ ...payload, iat: now, exp: now + 604800 });
    const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(JWT_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
    const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${header}.${body}.${sigStr}`;
}

// ===== 直接认证服务 =====

export interface LoginData {
    phone: string;
    password: string;
}

export interface RegisterData {
    phone: string;
    password: string;
    confirmPassword: string;
    name: string;
    avatar?: string;
    motto?: string;
    bio?: string;
    age?: string;
    gender?: string;
    province?: string;
    interests?: string[];
}

export interface AdminLoginData {
    username: string;
    password: string;
}

export const directAuthAPI = {
    login: async (data: LoginData) => {
        const { phone, password } = data;
        if (!phone || !password) throw new Error('手机号和密码不能为空');

        // 1. 查询用户
        const { data: users, error } = await adminSupabase
            .from('users').select('*').eq('phone', phone).limit(1);
        if (error) throw new Error('数据库查询失败: ' + error.message);
        if (!users || users.length === 0) throw new Error('此手机号未注册过此软件');
        const user = users[0];
        if (user.is_banned) {
            const err: any = new Error('账号已被管理员封禁');
            err.isBanned = true;
            throw err;
        }

        // 2. 验证密码 (兼容两种格式)
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) throw new Error('密码不正确，请重新输入');

        // 3. 获取兴趣爱好
        const { data: interests } = await adminSupabase
            .from('user_interests').select('interest').eq('user_id', user.id);

        // 4. 更新最后活跃时间
        await adminSupabase.from('users')
            .update({ last_active: new Date().toISOString() }).eq('id', user.id);

        // 5. 生成 token
        const token = await generateToken({ id: user.id, phone: user.phone });
        const { password_hash, ...userWithoutPassword } = user;
        return {
            success: true,
            data: {
                user: { ...userWithoutPassword, interests: (interests || []).map((i: any) => i.interest) },
                token,
            },
            message: '登录成功',
        };
    },

    register: async (data: RegisterData) => {
        const { phone, password, confirmPassword, name, motto, bio, age, gender, province, interests } = data;
        if (!phone || !password || !name) throw new Error('手机号、密码和昵称为必填项');
        if (phone.length !== 11) throw new Error('手机号必须为11位');
        if (password !== confirmPassword) throw new Error('两次输入的密码不一致');

        const { data: existing } = await adminSupabase
            .from('users').select('id').eq('phone', phone).limit(1);
        if (existing && existing.length > 0) throw new Error('该手机号已注册');

        const passwordHash = await hashPassword(password);
        const newUser = {
            phone, password_hash: passwordHash, name,
            avatar: `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`,
            motto: motto || '健康生活，长青不老',
            bio: bio || '暂无介绍', age: age || '未知',
            gender: gender || '未设置', province: province || '未设置',
            birthday: '未设置', routine: '每日功法练习',
            joined_date: new Date().getFullYear().toString(),
            streak: 1, last_active: new Date().toISOString(), is_real_user: true,
        };

        const { data: created, error } = await adminSupabase
            .from('users').insert(newUser).select().single();
        if (error) throw new Error('注册失败: ' + error.message);

        if (interests && interests.length > 0) {
            await adminSupabase.from('user_interests')
                .insert(interests.map(i => ({ user_id: created.id, interest: i })));
        }

        const token = await generateToken({ id: created.id, phone: created.phone });
        const { password_hash, ...userWithoutPassword } = created;
        return {
            success: true,
            data: { user: userWithoutPassword, token },
            message: '注册成功',
        };
    },

    adminLogin: async (data: AdminLoginData) => {
        const { username, password } = data;
        if (!username || !password) throw new Error('用户名和密码不能为空');

        const { data: admins, error } = await adminSupabase
            .from('admin_accounts').select('*').eq('username', username).limit(1);
        if (error || !admins || admins.length === 0) throw new Error('管理员账号或密码不正确');
        const admin = admins[0];

        const isValid = await verifyPassword(password, admin.password_hash);
        if (!isValid) throw new Error('管理员账号或密码不正确');

        const token = await generateToken({ id: admin.id, phone: '', isAdmin: true });
        return {
            success: true,
            data: { admin: { username: admin.username, role: admin.role }, token },
            message: '管理员登录成功',
        };
    },

    logout: async () => ({ success: true, message: '登出成功' }),
};
