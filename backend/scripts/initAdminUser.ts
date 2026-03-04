import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function initAdminUser() {
    console.log('正在初始化管理员虚拟用户...');

    const adminUser = {
        phone: 'admin-msg',
        name: '管理员',
        avatar: 'https://imgbed.link/admin-avatar-placeholder', // 之后替换为真实生成的 URL 或本地路径处理后的 URL
        motto: '为您提供贴心的园地服务',
        bio: '长青园官方管理员，负责解答疑问及处理反馈。',
        age: '99',
        gender: '未设置',
        province: '北京',
        birthday: '未设置',
        routine: '全天候',
        joined_date: '2024',
        streak: 9999,
        is_real_user: false,
        password_hash: 'ADMIN_VIRTUAL_USER' // 虚拟用户不需要真实登录
    };

    const { data: user, error } = await supabase
        .from('users')
        .upsert(adminUser, { onConflict: 'phone' })
        .select()
        .single();

    if (error) {
        console.error('初始化管理员用户失败:', error.message);
    } else {
        console.log('✅ 管理员虚拟用户初始化成功，ID:', user.id);
    }
}

initAdminUser();
