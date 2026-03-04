import { Router } from 'express';
import { getAllUsers, getStats, createExercise, updateExercise, deleteExercise, sendAdminMessage, getAdminMessages, deleteComment, toggleUserBan } from '../controllers/adminController.js';
import { createAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { supabase } from '../config/supabase.js';
import { authenticateAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const router = Router();

// 所有路由都需要管理员权限
router.use(authenticateAdmin);

// ========== Multer 内存存储（上传前缓存到内存） ==========
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 } // 最大 500MB（Cloudinary 免费版限制）
});

router.get('/users', getAllUsers);
router.get('/stats', getStats);

// ========== 统一文件上传入口 ==========
// 图片 → Supabase Storage
// 视频 → Cloudinary（支持大文件，多人 App 可用）
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '未找到文件' });
        }

        const mime = req.file.mimetype;
        const isVideo = mime.startsWith('video/');
        const isImage = mime.startsWith('image/');

        // ===== 视频 → Cloudinary =====
        if (isVideo) {
            if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME') {
                return res.status(503).json({
                    success: false,
                    error: 'Cloudinary 未配置，请在 .env 中填写 CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET'
                });
            }

            // 动态配置 Cloudinary（确保此时 process.env 已被完全加载）
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
                secure: true
            });

            // 将 buffer 转为可读流上传到 Cloudinary
            const uploadResult = await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'video',
                        folder: 'changqingyuan/videos',
                        use_filename: false,
                        unique_filename: true,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                const readable = Readable.from(req.file!.buffer);
                readable.pipe(uploadStream);
            });

            const videoUrl = uploadResult.secure_url;
            console.log(`✅ 视频已上传到 Cloudinary: ${videoUrl}`);

            return res.json({
                success: true,
                data: { url: videoUrl },
                message: `视频上传成功（Cloudinary云端，大小: ${(req.file.size / 1024 / 1024).toFixed(2)}MB）`
            });
        }

        // ===== 图片 → Supabase Storage =====
        if (isImage) {
            const ext = path.extname(req.file.originalname);
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
            const bucketName = 'uploads';

            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (error) {
                console.error('Supabase 图片上传错误:', error);
                return res.status(500).json({
                    success: false,
                    error: '图片上传失败，请确认 Supabase 中已创建名为 "uploads" 的公开存储桶'
                });
            }

            const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
            console.log(`✅ 图片已上传到 Supabase: ${publicUrl}`);

            return res.json({
                success: true,
                data: { url: publicUrl },
                message: `图片上传成功（Supabase，大小: ${(req.file.size / 1024 / 1024).toFixed(2)}MB）`
            });
        }

        // 其他文件类型
        return res.status(400).json({ success: false, error: '不支持的文件类型，请上传图片或视频' });

    } catch (error: any) {
        console.error('文件上传严重错误:', error);
        res.status(500).json({
            success: false,
            error: error.message || '上传失败，请检查网络或配置'
        });
    }
});

router.delete('/exercises/:id', deleteExercise);

// ========== 公告管理路由 ==========
router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// ========== 管理员与用户 1对1 沟通 ==========
router.post('/messages', sendAdminMessage);
router.get('/messages/:userId', getAdminMessages);

// ========== 账户管理 ==========
router.put('/users/:id/ban', toggleUserBan);

export default router;
