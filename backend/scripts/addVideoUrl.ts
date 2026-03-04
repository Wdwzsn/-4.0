import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("环境变量缺失");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function main() {
    console.log('开始添加 video_url 字段...');
    // 利用 execute_sql 尝试添加
    const sql = `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url TEXT;`;
    const { data, error } = await supabase.rpc('execute_sql', { sql_string: sql });
    if (error) {
        console.error('添加字段失败，可能没有 execute_sql 函数:', error);
    } else {
        console.log('添加字段成功');
    }
}

main();
