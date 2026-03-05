import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/supabase.js';
import { errorHandler } from './middleware/errorHandler.js';

// 导入路由
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import friendRoutes from './routes/friends.js';
import messageRoutes from './routes/messages.js';
import adminRoutes from './routes/admin.js';
import exerciseRoutes from './routes/exercises.js';
import gameRoutes from './routes/games.js';
import announcementRoutes from './routes/announcements.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:3001'
    ], // 允许的前端地址
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import path from 'path';

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '长青园后端服务运行正常',
        timestamp: new Date().toISOString()
    });
});

// 静态文件服务 (本地存储的图片和视频，最大支持约 2GB)
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/announcements', announcementRoutes);

// 404 处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '请求的接口不存在'
    });
});

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
    try {
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠️ 数据库连接失败');
        }

        app.listen(PORT, () => {
            console.log(`🚀 后端运行在: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ 启动失败:', error);
    }
};

// 导出 app 供 Vercel 使用
export default app;

// 非 Vercel 生产环境时手动启动
if (process.env.VITE_VERCEL !== 'true' && process.env.NODE_ENV !== 'production') {
    startServer();
} else {
    // Vercel 环境下仅初始化数据库连接而不调用 listen
    testConnection();
}
