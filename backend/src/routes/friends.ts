import { Router } from 'express';
import { getFriends, sendFriendRequest, getFriendRequests, acceptFriendRequest, deleteFriend } from '../controllers/friendController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

router.get('/', getFriends);
router.post('/request', sendFriendRequest);
router.get('/requests', getFriendRequests);
router.put('/requests/:id/accept', acceptFriendRequest);
router.delete('/:id', deleteFriend);

export default router;
