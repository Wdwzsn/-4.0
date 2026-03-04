import { Router } from 'express';
import { getProfile, updateProfile, getUserById, updateActivity, searchUserByPhone } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 所有用户路由都需要认证
router.use(authenticate);

// 获取当前用户信息
router.get('/profile', getProfile);

// 更新用户资料
router.put('/profile', updateProfile);

// 搜索用户
router.get('/search', searchUserByPhone);

// 获取指定用户信息
router.get('/:id', getUserById);

// 更新用户活跃时间
router.put('/activity', updateActivity);

// 用户打卡
router.post('/checkin', async (req, res, next) => {
    try {
        const { checkIn } = await import('../controllers/userController.js');
        await checkIn(req, res);
    } catch (e) {
        next(e);
    }
});

export default router;
