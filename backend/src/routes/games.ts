import { Router } from 'express';
import { getLeaderboard, submitScore } from '../controllers/gameController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 获取排行榜
router.get('/scores/:gameType', authenticate, getLeaderboard);

// 提交分数
router.post('/scores', authenticate, submitScore);

export default router;
