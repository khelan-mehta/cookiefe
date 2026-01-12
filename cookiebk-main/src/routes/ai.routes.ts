import { Router } from 'express';
import {
  analyzeDistress,
  getGuidance,
  chat,
  getSimilarQueries,
  getChatHistory,
  getStoreRecommendations,
} from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { aiRateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/analyze-distress', authenticate, aiRateLimit, analyzeDistress);
router.post('/guidance', authenticate, aiRateLimit, getGuidance);
router.post('/chat', authenticate, aiRateLimit, chat);
router.get('/similar-queries', authenticate, getSimilarQueries);
router.get('/chat-history', authenticate, getChatHistory);
router.post('/store-recommendations', authenticate, getStoreRecommendations);

export default router;
