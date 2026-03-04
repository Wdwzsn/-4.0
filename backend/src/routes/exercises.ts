import { Router } from 'express';
import { getAllExercises, incrementViews, createExercise, updateExercise, deleteExercise, toggleLikeExercise } from '../controllers/exerciseController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 公开接口
router.get('/', getAllExercises);
router.post('/:id/views', incrementViews);

// 管理接口 (需要认证，这里可以考虑 isAdmin，但此处先用 authenticate 确保至少登录)
router.post('/', authenticate, createExercise);
router.put('/:id', authenticate, updateExercise);
router.delete('/:id', authenticate, deleteExercise);
router.post('/:id/like', toggleLikeExercise); // 点赞无需强制登录，体验更好

export default router;
