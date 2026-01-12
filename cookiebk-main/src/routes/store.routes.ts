import { Router } from 'express';
import {
  getAllProducts,
  searchProducts,
  getProductById,
  getVetProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
} from '../controllers/store.controller';
import { authenticate, requireRole, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', optionalAuth, getAllProducts);
router.get('/search', optionalAuth, searchProducts);
router.get('/my-products', authenticate, requireRole('vet'), getVetProducts);
router.get('/:id', optionalAuth, getProductById);
router.post('/', authenticate, requireRole('vet'), createProduct);
router.put('/:id', authenticate, requireRole('vet'), updateProduct);
router.delete('/:id', authenticate, requireRole('vet'), deleteProduct);
router.post('/:id/toggle-availability', authenticate, requireRole('vet'), toggleProductAvailability);

export default router;
