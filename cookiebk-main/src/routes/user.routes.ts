import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updateVetProfile,
  getDistressHistory,
  toggleVetAvailability,
} from '../controllers/user.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/vet-profile', authenticate, requireRole('vet'), updateVetProfile);
router.get('/history', authenticate, getDistressHistory);
router.post('/toggle-availability', authenticate, requireRole('vet'), toggleVetAvailability);

export default router;
