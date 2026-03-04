
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixData() {
    console.log('Starting data fix...');

    // 1. Reset Admin Password
    console.log('Resetting admin password...');
    const adminPassword = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const { error: adminError } = await supabase
        .from('admin_accounts')
        .upsert({
            username: 'admini',
            password_hash: hashedPassword,
            role: 'super_admin'
        }, { onConflict: 'username' });

    if (adminError) {
        console.error('Error resetting admin password:', adminError);
    } else {
        console.log('Admin password reset successfully.');
    }

    // 2. Ensure AI Users Exist
    console.log('Ensuring AI users exist...');
    const aiUsers = [
        {
            phone: '13800000001',
            name: '静水流深',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            motto: '上善若水',
            bio: '退休书法老师，喜欢太极和茶道。',
            age: '68',
            gender: '男',
            province: '北京',
            is_real_user: false
        },
        {
            phone: '13800000002',
            name: '平步青云',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
            motto: '笑口常开',
            bio: '热心肠的社区大妈，喜欢广场舞和烹饪。',
            age: '65',
            gender: '女',
            province: '上海',
            is_real_user: false
        }
    ];

    for (const ai of aiUsers) {
        // Check if exists
        const { data: existing } = await supabase.from('users').select('id').eq('phone', ai.phone).single();

        let userId = existing?.id;

        if (!existing) {
            // Create if not exists
            const aiPassword = await bcrypt.hash('123456', 10);
            const { data: newUser, error: createError } = await supabase.from('users').insert({
                ...ai,
                password_hash: aiPassword
            }).select('id').single();

            if (createError) console.error(`Error creating AI ${ai.name}:`, createError);
            else {
                userId = newUser.id;
                console.log(`Created AI user: ${ai.name}`);
            }
        } else {
            // Update to ensure is_real_user is false
            await supabase.from('users').update({ is_real_user: false }).eq('id', userId);
            console.log(`Updated AI user: ${ai.name}`);
        }
    }

    console.log('Data fix completed.');
}

fixData().catch(console.error);
