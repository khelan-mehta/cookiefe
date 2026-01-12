import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import distressRoutes from './distress.routes';
import aiRoutes from './ai.routes';
import storeRoutes from './store.routes';
import uploadRoutes from './upload.routes';
import locationRoutes from './location.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/distress', distressRoutes);
router.use('/ai', aiRoutes);
router.use('/store', storeRoutes);
router.use('/upload', uploadRoutes);
router.use('/location', locationRoutes);

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
