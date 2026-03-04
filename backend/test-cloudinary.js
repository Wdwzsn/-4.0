import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

console.log('正在测试 Cloudinary 连通性...');

cloudinary.api.ping()
    .then(res => {
        console.log('✅ 测试成功! Cloudinary 连接正常。');
        console.log('响应结果:', res);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ 测试失败! 连接异常或配置错误:');
        console.error(err);
        process.exit(1);
    });
