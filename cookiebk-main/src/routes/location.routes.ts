import { Router } from 'express';
import {
  updateLocation,
  updateVetLocation,
  pollDistressUpdates,
  pollNearbyDistresses,
} from '../controllers/location.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Location update endpoints
router.post('/update', authenticate, updateLocation);
router.post('/vet-update', authenticate, requireRole('vet'), updateVetLocation);

// HTTP Polling endpoints (replacing WebSocket)
router.get('/poll/:distressId', authenticate, pollDistressUpdates);
router.get('/poll-nearby', authenticate, requireRole('vet'), pollNearbyDistresses);

export default router;
