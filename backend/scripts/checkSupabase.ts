import { supabase } from '../src/config/supabase.js';

async function testSupabase() {
    console.log('开始测试 Supabase 连通性...');

    // 1. 测试数据库
    console.log('\n[1/2] 正在测试数据库连接 (users 表)...');
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

    if (userError) {
        console.error('❌ 数据库连接失败:', userError.message);
    } else {
        console.log('✅ 数据库连接成功！读取到用户数据。');
    }

    // 2. 测试存储 (Storage)
    console.log('\n[2/2] 正在测试存储桶 (uploads)...');
    const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();

    if (bucketError) {
        console.error('❌ 获取存储桶列表失败:', bucketError.message);
    } else {
        const uploadBucket = buckets?.find(b => b.name === 'uploads');
        if (uploadBucket) {
            console.log('✅ 存储服务连通成功！已找到 "uploads" 存储桶。');
            if (uploadBucket.public) {
                console.log('   ℹ️ 存储桶状态: Public (公开) - 配置正确');
            } else {
                console.warn('   ⚠️ 存储桶状态: Private (私有) - 请在 Supabase 后台将其设置为 Public，否则视频可能无法播放');
            }
        } else {
            console.warn('   ⚠️ 未找到 "uploads" 存储桶。请在 Supabase Storage 中手动创建一个名为 "uploads" 的存储桶。');
        }
    }

    console.log('\n测试完成。');
}

testSupabase();
