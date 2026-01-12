import { Router } from 'express';
import {
  uploadDistressImage,
  uploadProductImage,
  getSignedUploadUrl,
} from '../controllers/upload.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { uploadSingle, handleMulterError } from '../middlewares/upload.middleware';

const router = Router();

router.post(
  '/distress-image',
  authenticate,
  uploadSingle,
  handleMulterError,
  uploadDistressImage
);

router.post(
  '/product-image',
  authenticate,
  requireRole('vet'),
  uploadSingle,
  handleMulterError,
  uploadProductImage
);

router.post('/signed-url', authenticate, getSignedUploadUrl);

export default router;
