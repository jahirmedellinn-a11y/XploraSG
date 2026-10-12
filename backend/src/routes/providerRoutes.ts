import { Router } from 'express';
import { createMyPromotion, deleteMyPromotion, getMyBusiness, updateMyService } from '../controllers/providerController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(requireAuth, requireRole(['prestador']));

router.get('/mi-negocio', getMyBusiness);
router.patch('/servicios/:id', updateMyService);
router.post('/promociones', createMyPromotion);
router.delete('/promociones/:id', deleteMyPromotion);

export default router;
