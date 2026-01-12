import { Router } from 'express';
import { googleAuth, register, getMe, logout } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { generalRateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/google', generalRateLimit, googleAuth);
router.post('/register', generalRateLimit, register);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
