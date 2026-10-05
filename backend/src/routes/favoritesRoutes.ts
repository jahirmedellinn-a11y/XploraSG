import { Router } from 'express';
import * as favoritesController from '../controllers/favoritesController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth); // All favorite routes are protected

router.get('/', favoritesController.getFavorites);
router.post('/sync', favoritesController.syncFavorites);
router.post('/:lugarId', favoritesController.addFavorite);
router.delete('/:lugarId', favoritesController.removeFavorite);

export default router;
