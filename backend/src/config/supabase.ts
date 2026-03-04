import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少 Supabase 配置！请检查 .env 文件中的 SUPABASE_URL 和 SUPABASE_SERVICE_KEY');
}

// 使用 service role key 创建客户端，可以绕过 RLS
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// 测试数据库连接
export const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('users').select('count').single();
        if (error) throw error;
        console.log('✅ Supabase 数据库连接成功');
        return true;
    } catch (error) {
        console.error('❌ Supabase 数据库连接失败:', error);
        return false;
    }
};
