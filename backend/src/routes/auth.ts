import { Router } from 'express';
import { register, login, adminLogin, logout } from '../controllers/authController.js';

const router = Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 管理员登录
router.post('/admin-login', adminLogin);

// 登出
router.post('/logout', logout);

export default router;
