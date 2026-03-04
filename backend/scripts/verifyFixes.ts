import { supabase } from '../src/config/supabase.js';

async function verify() {
    console.log('--- 正在验证修复状态 ---');

    // 1. 验证数据库连接及 exercises 表
    console.log('1. 正在检查 exercises 表及 video_url 字段...');
    try {
        const { data, error } = await supabase
            .from('exercises')
            .select('video_url')
            .limit(1);

        if (error) {
            if (error.code === 'PGRST116') {
                console.log('✅ exercises 表存在且 video_url 字段可访问 (无数据)');
            } else if (error.message.includes('column "video_url" does not exist')) {
                console.error('❌ 字段缺失：video_url 字段未在 exercises 表中找到。请在 SQL Editor 中运行 ALTER TABLE 脚本。');
            } else if (error.message.includes('relation "exercises" does not exist')) {
                console.error('❌ 表缺失：exercises 表未找到。请在 SQL Editor 中运行建表脚本。');
            } else {
                console.error('❌ 数据库查询错误:', error.message);
            }
        } else {
            console.log('✅ exercises 表及 video_url 字段验证通过。');
        }
    } catch (err) {
        console.error('❌ 验证过程中发生异常:', err);
    }

    // 2. 验证 Storage Bucket
    console.log('\n2. 正在检查 uploads 存储桶...');
    try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

        if (bucketError) {
            console.error('❌ 获取存储桶列表失败:', bucketError.message);
        } else {
            const uploadsBucket = buckets.find(b => b.name === 'uploads');
            if (uploadsBucket) {
                console.log(`✅ 已找到 uploads 存储桶。公开属性: ${uploadsBucket.public ? '是' : '否'}`);
                if (!uploadsBucket.public) {
                    console.warn('⚠️ 警告：uploads 存储桶未设置为 Public。视频可能无法在浏览器中直接播放。');
                }
            } else {
                console.error('❌ 未找到 uploads 存储桶。请在 Supabase Storage 中创建名为 "uploads" 的存储桶。');
            }
        }
    } catch (err) {
        console.error('❌ 验证存储桶发生异常:', err);
    }

    console.log('\n--- 验证结束 ---');
    process.exit(0);
}

verify();
