import { supabase } from './src/config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    console.log('正在验证数据库表...');

    const { error: annError } = await supabase.from('announcements').select('count', { count: 'exact', head: true });
    if (annError) console.error('❌ announcements 表访问失败:', annError.message);
    else console.log('✅ announcements 表连接正常');

    const { error: scoreError } = await supabase.from('game_scores').select('count', { count: 'exact', head: true });
    if (scoreError) console.error('❌ game_scores 表访问失败:', scoreError.message);
    else console.log('✅ game_scores 表连接正常');

    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) console.error('❌ 存储桶列表获取失败:', storageError.message);
    else {
        const hasVideos = buckets.some(b => b.name === 'videos');
        if (hasVideos) console.log('✅ videos 存储桶已存在');
        else console.error('❌ 未找到 videos 存储桶，请检查名称是否完全匹配');
    }
}

check();
