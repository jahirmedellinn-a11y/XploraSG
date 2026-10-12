import { Router } from 'express';
import {
  createEvent,
  deleteEvent,
  getStatistics,
  getSurveyResults,
  getUsageAnalytics,
  listEventsAdmin,
  updateEvent,
  linkProviderAccount,
  listPromotionsForReview,
  listProviders,
  reviewPromotion,
} from '../controllers/adminController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(requireAuth, requireRole(['administrador']));

router.get('/estadisticas', getStatistics);
router.get('/promociones', listPromotionsForReview);
router.patch('/promociones/:id', reviewPromotion);
router.get('/prestadores', listProviders);
router.post('/prestadores/:id/vincular', linkProviderAccount);
router.get('/encuestas', getSurveyResults);
router.get('/analitica', getUsageAnalytics);
router.get('/eventos', listEventsAdmin);
router.post('/eventos', createEvent);
router.patch('/eventos/:id', updateEvent);
router.delete('/eventos/:id', deleteEvent);

export default router;
