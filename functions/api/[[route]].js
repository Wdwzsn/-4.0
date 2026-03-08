/**
 * Cloudflare Pages Function: /functions/api/[[route]].js
 *
 * 这是完全独立的边缘函数服务。
 * 它直接与 Supabase REST API 通信，不依赖 Vercel 后端。
 * 使用的是 Supabase Service Role Key（从 Cloudflare 环境变量中读取）。
 */

const SUPABASE_URL = 'https://oairdwbupxhjdypbcdzl.supabase.co';

// ===== 工具函数 =====

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

// 简单的 JWT 创建（使用 Web Crypto API，Cloudflare Workers 原生支持）
async function createJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = { ...payload, iat: now, exp: now + 7 * 24 * 60 * 60 }; // 7天

    const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const headerStr = encode(header);
    const payloadStr = encode(fullPayload);
    const signingInput = `${headerStr}.${payloadStr}`;

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
    const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${headerStr}.${payloadStr}.${sigStr}`;
}

// 简单的 bcrypt 验证 — 由于 Workers 无法运行 bcryptjs，
// 我们直接通过 Supabase RPC 或者转发到 Supabase 来处理
// 实际使用 SHA-256 哈希进行比对（需要后端保证密码也是 SHA256）
// 注意：如果数据库里存的是 bcrypt，这里需要用不同的方案
// 临时方案：调用 Supabase RPC 函数来验证密码

async function supabaseFetch(path, options, serviceKey) {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            ...(options?.headers || {}),
        },
    });
    return res;
}

// ===== 路由处理 =====

async function handleLogin(body, env) {
    const { phone, password } = body;
    if (!phone || !password) {
        return jsonResponse({ success: false, error: '手机号和密码不能为空' }, 400);
    }

    const serviceKey = env.SUPABASE_SERVICE_KEY;
    if (!serviceKey) {
        return jsonResponse({ success: false, error: '服务器配置错误：缺少 SUPABASE_SERVICE_KEY' }, 500);
    }

    // 查询用户
    const userRes = await supabaseFetch(
        `/rest/v1/users?phone=eq.${encodeURIComponent(phone)}&select=*&limit=1`,
        { method: 'GET' },
        serviceKey
    );
    const users = await userRes.json();

    if (!users || users.length === 0) {
        return jsonResponse({ success: false, error: '此手机号未注册过此软件' }, 401);
    }

    const user = users[0];

    if (user.is_banned) {
        return jsonResponse({ success: false, isBanned: true, error: '账号已被管理员封禁' }, 403);
    }

    // 验证密码 —— 使用 Supabase RPC 调用 crypt 函数比对 bcrypt
    const verifyRes = await supabaseFetch(
        `/rest/v1/rpc/verify_password`,
        {
            method: 'POST',
            body: JSON.stringify({ p_password: password, p_hash: user.password_hash }),
        },
        serviceKey
    );
    const isValid = await verifyRes.json();

    if (!isValid) {
        return jsonResponse({ success: false, error: '密码不正确，请重新输入' }, 401);
    }

    // 获取用户兴趣
    const interestRes = await supabaseFetch(
        `/rest/v1/user_interests?user_id=eq.${user.id}&select=interest`,
        { method: 'GET' },
        serviceKey
    );
    const interests = await interestRes.json();

    // 更新最后活跃时间
    await supabaseFetch(
        `/rest/v1/users?id=eq.${user.id}`,
        { method: 'PATCH', body: JSON.stringify({ last_active: new Date().toISOString() }) },
        serviceKey
    );

    const jwtSecret = env.JWT_SECRET || 'long_qing_yuan_secure_key_2024';
    const token = await createJWT({ id: user.id, phone: user.phone }, jwtSecret);

    const { password_hash, ...userWithoutPassword } = user;
    return jsonResponse({
        success: true,
        data: {
            user: { ...userWithoutPassword, interests: (interests || []).map(i => i.interest) },
            token,
        },
        message: '登录成功',
    });
}

async function handleRegister(body, env) {
    const { phone, password, confirmPassword, name, motto, bio, age, gender, province, interests } = body;

    if (!phone || !password || !name) {
        return jsonResponse({ success: false, error: '手机号、密码和昵称为必填项' }, 400);
    }
    if (phone.length !== 11) {
        return jsonResponse({ success: false, error: '手机号必须为11位' }, 400);
    }
    if (password !== confirmPassword) {
        return jsonResponse({ success: false, error: '两次输入的密码不一致' }, 400);
    }

    const serviceKey = env.SUPABASE_SERVICE_KEY;

    // 检查手机号是否已注册
    const existRes = await supabaseFetch(
        `/rest/v1/users?phone=eq.${encodeURIComponent(phone)}&select=id&limit=1`,
        { method: 'GET' },
        serviceKey
    );
    const existing = await existRes.json();
    if (existing && existing.length > 0) {
        return jsonResponse({ success: false, error: '该手机号已注册' }, 400);
    }

    // 使用 Supabase crypt 函数哈希密码
    const hashRes = await supabaseFetch(
        `/rest/v1/rpc/hash_password`,
        { method: 'POST', body: JSON.stringify({ p_password: password }) },
        serviceKey
    );
    const passwordHash = await hashRes.json();

    const newUser = {
        phone,
        password_hash: passwordHash,
        name,
        avatar: `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`,
        motto: motto || '健康生活，长青不老',
        bio: bio || '暂无介绍',
        age: age || '未知',
        gender: gender || '未设置',
        province: province || '未设置',
        birthday: '未设置',
        routine: '每日功法练习',
        joined_date: new Date().getFullYear().toString(),
        streak: 1,
        last_active: new Date().toISOString(),
        is_real_user: true,
    };

    const createRes = await supabaseFetch(
        `/rest/v1/users`,
        { method: 'POST', body: JSON.stringify(newUser), headers: { 'Prefer': 'return=representation' } },
        serviceKey
    );
    const created = await createRes.json();
    if (!Array.isArray(created) || created.length === 0) {
        return jsonResponse({ success: false, error: '注册失败，请稍后重试' }, 500);
    }
    const user = created[0];

    if (interests && interests.length > 0) {
        const interestRecords = interests.map(i => ({ user_id: user.id, interest: i }));
        await supabaseFetch(`/rest/v1/user_interests`, { method: 'POST', body: JSON.stringify(interestRecords) }, serviceKey);
    }

    const jwtSecret = env.JWT_SECRET || 'long_qing_yuan_secure_key_2024';
    const token = await createJWT({ id: user.id, phone: user.phone }, jwtSecret);
    const { password_hash, ...userWithoutPassword } = user;
    return jsonResponse({ success: true, data: { user: userWithoutPassword, token }, message: '注册成功' }, 201);
}

async function handleAdminLogin(body, env) {
    const { username, password } = body;
    if (!username || !password) {
        return jsonResponse({ success: false, error: '用户名和密码不能为空' }, 400);
    }

    const serviceKey = env.SUPABASE_SERVICE_KEY;
    const adminRes = await supabaseFetch(
        `/rest/v1/admin_accounts?username=eq.${encodeURIComponent(username)}&select=*&limit=1`,
        { method: 'GET' },
        serviceKey
    );
    const admins = await adminRes.json();
    if (!admins || admins.length === 0) {
        return jsonResponse({ success: false, error: '管理员账号或密码不正确' }, 401);
    }
    const admin = admins[0];

    const verifyRes = await supabaseFetch(
        `/rest/v1/rpc/verify_password`,
        { method: 'POST', body: JSON.stringify({ p_password: password, p_hash: admin.password_hash }) },
        serviceKey
    );
    const isValid = await verifyRes.json();
    if (!isValid) {
        return jsonResponse({ success: false, error: '管理员账号或密码不正确' }, 401);
    }

    const jwtSecret = env.JWT_SECRET || 'long_qing_yuan_secure_key_2024';
    const token = await createJWT({ id: admin.id, phone: '', isAdmin: true }, jwtSecret);
    return jsonResponse({ success: true, data: { admin: { username: admin.username, role: admin.role }, token }, message: '管理员登录成功' });
}

// ===== 主入口 =====
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    // 仅处理 POST 的认证路由，其他路由转发到 Vercel
    const VERCEL_BACKEND = 'https://chang-qing-yuan-e1hpeboxq-wdwzsns-projects.vercel.app';

    try {
        // 认证路由直接在 Edge 处理
        if (request.method === 'POST') {
            const body = await request.json().catch(() => ({}));

            if (pathname === '/api/auth/login') return await handleLogin(body, env);
            if (pathname === '/api/auth/register') return await handleRegister(body, env);
            if (pathname === '/api/auth/admin-login') return await handleAdminLogin(body, env);
        }

        // 其他 API 请求转发到 Vercel
        const targetUrl = VERCEL_BACKEND + pathname + url.search;
        const headers = new Headers(request.headers);
        headers.delete('host');
        const proxyRes = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        });
        const newHeaders = new Headers(proxyRes.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        return new Response(proxyRes.body, { status: proxyRes.status, headers: newHeaders });

    } catch (error) {
        return jsonResponse({ success: false, error: '服务器错误: ' + error.message }, 500);
    }
}
