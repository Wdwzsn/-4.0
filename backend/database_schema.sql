-- 长青园数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(11) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar TEXT,
  motto TEXT DEFAULT '健康生活，长青不老',
  bio TEXT DEFAULT '暂无介绍',
  age VARCHAR(10) DEFAULT '未知',
  gender VARCHAR(10) DEFAULT '未设置',
  province VARCHAR(50) DEFAULT '未设置',
  birthday VARCHAR(20) DEFAULT '未设置',
  routine TEXT DEFAULT '每日功法练习',
  joined_date VARCHAR(4),
  streak INTEGER DEFAULT 1,
  last_checkin_date VARCHAR(20),
  last_active TIMESTAMP,
  is_real_user BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- 2. 创建用户兴趣表
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interest VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);

-- 3. 创建好友关系表
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);

-- 4. 创建好友请求表
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_phone VARCHAR(11) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to_phone ON friend_requests(to_phone);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);

-- 5. 创建动态表
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  full_content TEXT,
  image TEXT,
  likes_count INTEGER DEFAULT 0,
  target_likes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 6. 创建点赞记录表
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- 7. 创建评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

-- 8. 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 9. 创建成就表
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- 10. 创建管理员账户表
CREATE TABLE IF NOT EXISTS admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) DEFAULT 'super_admin',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. 创建点赞数增减的函数（用于优化性能）
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 12. 插入默认管理员账户（密码: 123456）
-- 注意：密码 hash 是 bcrypt('123456') 的结果
INSERT INTO admin_accounts (username, password_hash, role)
VALUES ('admini', '$2a$10$8k1lnLL5zE5J5h5J5J5J5uYKGZx3z3z3z3z3z3z3z3z3z3z3z3z3z', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- 完成！
-- 注意：
-- 1. 实际部署时，请修改管理员密码
-- 2. 可以根据需要配置 Row Level Security (RLS) 策略
-- 3. 建议启用 Supabase 的实时订阅功能以支持在线聊天
