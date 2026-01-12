import { Router } from 'express';
import {
  createDistress,
  getDistress,
  getActiveDistress,
  respondToDistress,
  selectVet,
  resolveDistress,
  cancelDistress,
  getNearbyDistresses,
  updateAIAnalysis,
} from '../controllers/distress.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { distressRateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/call', authenticate, distressRateLimit, createDistress);
router.get('/active', authenticate, getActiveDistress);
router.get('/nearby', authenticate, requireRole('vet'), getNearbyDistresses);
router.get('/:id', authenticate, getDistress);
router.post('/:id/respond', authenticate, requireRole('vet'), respondToDistress);
router.post('/:id/select', authenticate, selectVet);
router.post('/:id/resolve', authenticate, resolveDistress);
router.post('/:id/cancel', authenticate, cancelDistress);
router.put('/:id/ai-analysis', authenticate, updateAIAnalysis);

export default router;
