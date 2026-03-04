
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin rights

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    console.log('Current directory:', __dirname);
    console.log('Tried path:', path.resolve(__dirname, '../.env'));
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const AI_USERS = [
    {
        phone: '13800000001',
        password_hash: '$2a$10$8k1lnLL5zE5J5h5J5J5J5uYKGZx3z3z3z3z3z3z3z3z3z3z3z3z3z', // 123456
        name: '静水流深',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        motto: '宁静致远，淡泊明志',
        bio: '退休教师，喜欢读史书，偶尔写写毛笔字。',
        age: '68',
        gender: '男',
        province: '北京',
        is_real_user: false
    },
    {
        phone: '13800000002',
        password_hash: '$2a$10$8k1lnLL5zE5J5h5J5J5J5uYKGZx3z3z3z3z3z3z3z3z3z3z3z3z3z', // 123456
        name: '平步青云',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        motto: '笑口常开，好运自然来',
        bio: '热爱广场舞，还是社区合唱团的领唱呢！',
        age: '65',
        gender: '女',
        province: '上海',
        is_real_user: false
    }
];

const MOCK_POSTS = [
    {
        author_phone: '13800000001',
        content: '临摹了一篇兰亭集序，心境平和了不少。',
        image: 'https://picsum.photos/seed/calligraphy/800/600',
        likes_count: 23
    },
    {
        author_phone: '13800000002',
        content: '今天的晨练空气真好，大家都要动起来啊！',
        image: 'https://picsum.photos/seed/exercise/800/600',
        likes_count: 45
    },
    {
        author_phone: '13800000001',
        content: '现在的年轻人工作压力大，我们做长辈的要多体谅，少添乱，自己照顾好身体就是最大的支持。',
        likes_count: 156
    },
    {
        author_phone: '13800000002',
        content: '刚学会了做红烧肉，老伴说味道不错，改天给孩子们露一手。',
        image: 'https://picsum.photos/seed/cooking/800/600',
        likes_count: 88
    }
];

const seedData = async () => {
    try {
        console.log('Seeding AI users...');

        // 1. Create AI Users
        for (const user of AI_USERS) {
            const { data, error } = await supabase
                .from('users')
                .upsert(user, { onConflict: 'phone' })
                .select()
                .single();

            if (error) {
                console.error(`Failed to create user ${user.name}:`, error.message);
            } else {
                console.log(`User ${user.name} created/updated with ID: ${data.id}`);
            }
        }

        console.log('Seeding mock posts...');

        // 2. Create Posts
        for (const post of MOCK_POSTS) {
            // Find author ID
            const { data: author } = await supabase
                .from('users')
                .select('id')
                .eq('phone', post.author_phone)
                .single();

            if (author) {
                const { error } = await supabase
                    .from('posts')
                    .insert({
                        author_id: author.id,
                        content: post.content,
                        image: post.image,
                        likes_count: post.likes_count
                    });

                if (error) console.error('Failed to create post:', error.message);
                else console.log(`Post created by ${post.author_phone}`);
            }
        }

        console.log('Seeding completed!');
    } catch (error) {
        console.error('Seeding error:', error);
    }
};

seedData();
