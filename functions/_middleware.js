/**
 * Cloudflare Pages Middleware
 * 捕获所有 /api/* 请求，直接在边缘处理认证，其余转发 Vercel
 */

const SUPABASE_URL = 'https://oairdwbupxhjdypbcdzl.supabase.co';

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

async function createJWT(payload, secret) {
    const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const now = Math.floor(Date.now() / 1000);
    const header = encode({ alg: 'HS256', typ: 'JWT' });
    const body = encode({ ...payload, iat: now, exp: now + 604800 });
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
    const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${header}.${body}.${sigStr}`;
}

async function sb(path, opts, key) {
    return fetch(`${SUPABASE_URL}${path}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, ...(opts?.headers || {}) },
    });
}

export async function onRequest({ request, env, next }) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 非 API 请求直接传递
    if (!path.startsWith('/api/')) return next();

    // 预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    const key = env.SUPABASE_SERVICE_KEY;
    const jwt = env.JWT_SECRET || 'long_qing_yuan_secure_key_2024';

    if (!key) return jsonResponse({ success: false, error: 'SUPABASE_SERVICE_KEY 未配置，请在 Cloudflare 环境变量中添加' }, 500);

    try {
        let body = {};
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            body = await request.json().catch(() => ({}));
        }

        // --- 登录 ---
        if (path === '/api/auth/login' && request.method === 'POST') {
            const { phone, password } = body;
            if (!phone || !password) return jsonResponse({ success: false, error: '手机号和密码不能为空' }, 400);

            const r = await sb(`/rest/v1/users?phone=eq.${encodeURIComponent(phone)}&select=*&limit=1`, { method: 'GET' }, key);
            const users = await r.json();
            if (!users?.length) return jsonResponse({ success: false, error: '此手机号未注册过此软件' }, 401);
            const user = users[0];
            if (user.is_banned) return jsonResponse({ success: false, isBanned: true, error: '账号已被管理员封禁' }, 403);

            // 用 Supabase RPC 验证 bcrypt 密码
            const vr = await sb('/rest/v1/rpc/verify_password', { method: 'POST', body: JSON.stringify({ p_password: password, p_hash: user.password_hash }) }, key);
            const valid = await vr.json();
            if (!valid) return jsonResponse({ success: false, error: '密码不正确，请重新输入' }, 401);

            const intR = await sb(`/rest/v1/user_interests?user_id=eq.${user.id}&select=interest`, { method: 'GET' }, key);
            const interests = await intR.json();
            await sb(`/rest/v1/users?id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ last_active: new Date().toISOString() }) }, key);

            const token = await createJWT({ id: user.id, phone: user.phone }, jwt);
            const { password_hash, ...u } = user;
            return jsonResponse({ success: true, data: { user: { ...u, interests: (interests || []).map(i => i.interest) }, token }, message: '登录成功' });
        }

        // --- 注册 ---
        if (path === '/api/auth/register' && request.method === 'POST') {
            const { phone, password, confirmPassword, name, motto, bio, age, gender, province, interests } = body;
            if (!phone || !password || !name) return jsonResponse({ success: false, error: '手机号、密码和昵称为必填项' }, 400);
            if (phone.length !== 11) return jsonResponse({ success: false, error: '手机号必须为11位' }, 400);
            if (password !== confirmPassword) return jsonResponse({ success: false, error: '两次输入的密码不一致' }, 400);

            const ex = await (await sb(`/rest/v1/users?phone=eq.${encodeURIComponent(phone)}&select=id&limit=1`, { method: 'GET' }, key)).json();
            if (ex?.length) return jsonResponse({ success: false, error: '该手机号已注册' }, 400);

            const hr = await sb('/rest/v1/rpc/hash_password', { method: 'POST', body: JSON.stringify({ p_password: password }) }, key);
            const passwordHash = await hr.json();

            const newUser = { phone, password_hash: passwordHash, name, avatar: `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`, motto: motto || '健康生活，长青不老', bio: bio || '暂无介绍', age: age || '未知', gender: gender || '未设置', province: province || '未设置', birthday: '未设置', routine: '每日功法练习', joined_date: new Date().getFullYear().toString(), streak: 1, last_active: new Date().toISOString(), is_real_user: true };
            const cr = await sb('/rest/v1/users', { method: 'POST', body: JSON.stringify(newUser), headers: { Prefer: 'return=representation' } }, key);
            const created = await cr.json();
            if (!Array.isArray(created) || !created.length) return jsonResponse({ success: false, error: '注册失败，请稍后重试' }, 500);
            const user = created[0];

            if (interests?.length) await sb('/rest/v1/user_interests', { method: 'POST', body: JSON.stringify(interests.map(i => ({ user_id: user.id, interest: i }))) }, key);
            const token = await createJWT({ id: user.id, phone: user.phone }, jwt);
            const { password_hash, ...u } = user;
            return jsonResponse({ success: true, data: { user: u, token }, message: '注册成功' }, 201);
        }

        // --- 管理员登录 ---
        if (path === '/api/auth/admin-login' && request.method === 'POST') {
            const { username, password } = body;
            if (!username || !password) return jsonResponse({ success: false, error: '用户名和密码不能为空' }, 400);
            const ar = await (await sb(`/rest/v1/admin_accounts?username=eq.${encodeURIComponent(username)}&select=*&limit=1`, { method: 'GET' }, key)).json();
            if (!ar?.length) return jsonResponse({ success: false, error: '管理员账号或密码不正确' }, 401);
            const admin = ar[0];
            const vr = await sb('/rest/v1/rpc/verify_password', { method: 'POST', body: JSON.stringify({ p_password: password, p_hash: admin.password_hash }) }, key);
            if (!(await vr.json())) return jsonResponse({ success: false, error: '管理员账号或密码不正确' }, 401);
            const token = await createJWT({ id: admin.id, phone: '', isAdmin: true }, jwt);
            return jsonResponse({ success: true, data: { admin: { username: admin.username, role: admin.role }, token }, message: '管理员登录成功' });
        }

        // --- 其他 API 转发 Vercel ---
        const VERCEL = 'https://chang-qing-yuan-e1hpeboxq-wdwzsns-projects.vercel.app';
        const h = new Headers(request.headers);
        h.delete('host');
        const pr = await fetch(VERCEL + path + url.search, { method: request.method, headers: h, body: ['GET', 'HEAD'].includes(request.method) ? undefined : JSON.stringify(body) });
        const nh = new Headers(pr.headers);
        nh.set('Access-Control-Allow-Origin', '*');
        return new Response(pr.body, { status: pr.status, headers: nh });

    } catch (e) {
        return jsonResponse({ success: false, error: '边缘函数错误: ' + e.message }, 500);
    }
}
