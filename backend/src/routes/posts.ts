import { Router } from 'express';
import { getPosts, createPost, likePost, unlikePost, addComment, getComments, deletePost } from '../controllers/postController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 获取动态列表（公开）
router.get('/', getPosts);

// 以下路由需要认证
router.post('/', authenticate, createPost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, likePost);
router.delete('/:id/like', authenticate, unlikePost);
router.post('/:id/comments', authenticate, addComment);
router.get('/:id/comments', getComments);

export default router;
