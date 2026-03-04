# 长青园 - 完整部署指南

## 📋 准备工作

### 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com) 并注册账号
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - Name: chanqingyuan (或你喜欢的名称)
   - Database Password: 设置一个强密码（请保存好）
   - Region: 选择 Northeast Asia (Tokyo) 或最近的区域
4. 等待项目创建完成（约 2 分钟）

### 2. 获取 Supabase 配置信息

项目创建完成后：

1. 进入项目 Dashboard
2. 点击左侧菜单的 "Settings" → "API"
3. 复制以下信息：
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_KEY) - 需要点击 "Reveal" 查看

### 3. 初始化数据库

1. 在 Supabase Dashboard 中，点击左侧的 "SQL Editor"
2. 点击 "New Query"
3. 打开本项目的 `backend/database_schema.sql` 文件
4. 复制整个文件内容
5. 粘贴到 Supabase 的 SQL 编辑器中
6. 点击 "Run" 执行SQL语句
7. 确认所有表都已成功创建

---

## 🚀 后端部署

### 步骤 1: 安装依赖

```bash
cd backend
npm install
```

### 步骤 2: 配置环境变量

复制 `.env.example` 为 `.env`:

```bash
copy .env.example .env  # Windows
# 或
cp .env.example .env    # Mac/Linux
```

编辑 `.env` 文件，填入你的配置：

```env
PORT=3001
SUPABASE_URL=https://你的项目ID.supabase.co
SUPABASE_ANON_KEY=你的_anon_public_key
SUPABASE_SERVICE_KEY=你的_service_role_key
JWT_SECRET=随机生成一个复杂的密钥（建议至少32个字符）
NODE_ENV=development
```

**生成 JWT_SECRET 的方法：**

```bash
# 在命令行中运行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 步骤 3: 创建管理员账户

由于数据库 schema 中默认的密码 hash 是示例，需要手动创建管理员账户：

1. 运行以下命令生成密码 hash：

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('123456', 10, (err, hash) => console.log(hash));"
```

2. 在 Supabase SQL Editor 中执行：

```sql
DELETE FROM admin_accounts WHERE username = 'admini';

INSERT INTO admin_accounts (username, password_hash, role)
VALUES ('admini', '你刚才生成的hash', 'super_admin');
```

### 步骤 4: 启动后端服务

开发模式：
```bash
npm run dev
```

你应该看到：
```
✅ Supabase 数据库连接成功
🌳 ==============================
   长青园后端服务已启动
   运行在: http://localhost:3001
   ==============================
```

---

## 🎨 前端部署

### 步骤 1: 安装依赖

回到项目根目录：

```bash
cd ..  # 返回项目根目录
npm install
```

### 步骤 2: 配置环境变量

编辑 `.env.local` 文件：

```env
VITE_API_URL=http://localhost:3001/api
API_KEY=your_gemini_api_key  # 保持原来的配置
```

### 步骤 3: 启动前端服务

```bash
npm run dev
```

前端应用会在 `http://localhost:5173` 启动

---

## ✅ 验证部署

### 1. 测试后端健康检查

在浏览器访问：
```
http://localhost:3001/health
```

应该返回：
```json
{
  "success": true,
  "message": "长青园后端服务运行正常",
  "timestamp": "2024-..."
}
```

### 2. 测试前后端联通

1. 打开前端：`http://localhost:5173`
2. 点击"点击注册"
3. 填写注册信息并提交
4. 如果成功注册并登录，说明前后端已成功联通！

### 3. 测试管理员登录

1. 在登录页面，点击右上角的管理员入口
2. 用户名：`admini`
3. 密码：`123456`（建议修改）
4. 成功登录应该能看到管理后台

---

## 🐛 常见问题

### 问题 1: 后端提示 "数据库连接失败"

**解决方案：**
- 检查 `.env` 文件中的 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY` 是否正确
- 确保 Supabase 项目状态为 "Active"
- 检查网络连接

### 问题 2: 前端提示 "服务器无响应"

**解决方案：**
- 确认后端服务正在运行（`localhost:3001`）
- 检查 `.env.local` 中的 `VITE_API_URL` 配置
- 查看浏览器控制台的错误信息

### 问题 3: 注册时提示 "手机号已注册"

**解决方案：**
- 在 Supabase Dashboard 的 "Table Editor" 中查看 `users` 表
- 删除测试用户或使用不同的手机号

### 问题 4: CORS 错误

**解决方案：**
- 检查 `backend/src/server.ts` 的 CORS 配置
- 确保前端地址 `http://localhost:5173` 在允许列表中

---

## 📦 生产环境部署

### 后端部署（推荐 Railway）

1. 在 [Railway.app](https://railway.app) 注册账号
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择并部署 backend 目录
4. 在 Railway 的环境变量中配置所有 `.env` 变量
5. Railway 会自动运行 `npm install` 和 `npm start`

### 前端部署（推荐 Vercel）

1. 在 [Vercel.com](https://vercel.com) 注册账号
2. 导入 GitHub 仓库
3. 在环境变量中设置：
   - `VITE_API_URL`: 你的后端 Railway 地址
   - `API_KEY`: Gemini API Key
4. 点击 Deploy

### 重要提示

生产环境部署后，记得：
1. 修改管理员密码
2. 更新 CORS 配置为生产域名
3. 将 `NODE_ENV` 改为 `production`
4. 使用强密码作为 `JWT_SECRET`

---

## 🎉 完成！

你的长青园应用现在已经完整部署！

- 前端：http://localhost:5173
- 后端：http://localhost:3001
- 数据库：Supabase Dashboard

如有问题，请查看日志或联系技术支持。
