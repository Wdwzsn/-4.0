import { Router } from 'express';
import { getAnnouncements } from '../controllers/announcementController.js';

const router = Router();

// 获取所有公告
router.get('/', getAnnouncements);

export default router;
