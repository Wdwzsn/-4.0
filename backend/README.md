# 长青园后端 API 服务

这是长青园智慧养老平台的后端服务，使用 Node.js + Express + Supabase 构建。

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填写以下配置：

```env
PORT=3001
SUPABASE_URL=你的_supabase_项目_url
SUPABASE_ANON_KEY=你的_supabase_anon_key
SUPABASE_SERVICE_KEY=你的_supabase_service_role_key
JWT_SECRET=你的_jwt_密钥
NODE_ENV=development
```

### 3. 初始化数据库

在 Supabase Dashboard 的 SQL Editor 中执行 `database_schema.sql` 文件中的 SQL 语句。

### 4. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

## API 文档

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/admin-login` - 管理员登录
- `POST /api/auth/logout` - 登出

### 用户相关

- `GET /api/users/profile` - 获取当前用户信息（需认证）
- `PUT /api/users/profile` - 更新用户资料（需认证）
- `GET /api/users/:id` - 获取指定用户信息（需认证）
- `PUT /api/users/activity` - 更新用户活跃时间（需认证）

### 社交动态

- `GET /api/posts` - 获取动态列表
- `POST /api/posts` - 发布新动态（需认证）
- `POST /api/posts/:id/like` - 点赞动态（需认证）
- `DELETE /api/posts/:id/like` - 取消点赞（需认证）
- `POST /api/posts/:id/comments` - 添加评论（需认证）
- `GET /api/posts/:id/comments` - 获取评论列表

### 好友相关

- `GET /api/friends` - 获取好友列表（需认证）
- `POST /api/friends/request` - 发送好友请求（需认证）
- `GET /api/friends/requests` - 获取好友请求列表（需认证）
- `PUT /api/friends/requests/:id/accept` - 接受好友请求（需认证）
- `DELETE /api/friends/:id` - 删除好友（需认证）

### 消息相关

- `GET /api/messages/:friendId` - 获取与某好友的聊天记录（需认证）
- `POST /api/messages` - 发送消息（需认证）
- `PUT /api/messages/:id/read` - 标记消息已读（需认证）

### 管理员相关

- `GET /api/admin/users` - 获取所有用户列表（需管理员权限）
- `GET /api/admin/stats` - 获取统计数据（需管理员权限）

## 技术栈

- **运行时**：Node.js
- **框架**：Express.js
- **数据库**：Supabase (PostgreSQL)
- **认证**：JWT
- **语言**：TypeScript

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由
│   ├── types/           # 类型定义
│   ├── utils/           # 工具函数
│   └── server.ts        # 服务器入口
├── .env                 # 环境变量
├── package.json
└── tsconfig.json
```

## 开发注意事项

1. 所有需要认证的接口都需要在请求头中携带 `Authorization: Bearer <token>`
2. 密码使用 bcrypt 加密存储
3. JWT token 有效期为 7 天
4. 管理员账号需要在数据库中手动创建
