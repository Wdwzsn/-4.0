/**
 * Cloudflare Pages Function: /functions/api/[[route]].js
 * 
 * 这是真正的 API 代理。Cloudflare _redirects 的 200 状态
 * 是 Netlify 独有的功能，不适用于 Cloudflare Pages。
 * 必须使用 Pages Functions 才能实现真正的代理转发。
 */

const VERCEL_BACKEND = 'https://chang-qing-yuan-e1hpeboxq-wdwzsns-projects.vercel.app';

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // 构建目标 URL：将请求转发到 Vercel 后端
    const targetUrl = VERCEL_BACKEND + url.pathname + url.search;

    // 复制原始请求的 headers，并添加 CORS 头
    const headers = new Headers(request.headers);
    headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
    headers.set('X-Forwarded-Host', url.host);
    headers.delete('host');

    try {
        // 转发请求到 Vercel
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: headers,
            body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        });

        // 复制响应并添加 CORS 头
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // 处理 OPTIONS 预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: newHeaders });
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: '代理转发失败: ' + error.message
        }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
