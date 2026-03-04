import { Router } from 'express';
import { getMessages, sendMessage, markAsRead } from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

router.get('/:friendId', getMessages);
router.post('/', sendMessage);
router.put('/:id/read', markAsRead);

export default router;
