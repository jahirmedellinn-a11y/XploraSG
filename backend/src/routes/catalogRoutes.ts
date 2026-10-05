import { Router } from 'express';
import {
  getContentStatus,
  getPlaceBySlug,
  getServiceBySlug,
  listCategories,
  listMunicipalities,
  listPlaces,
  listServices,
} from '../controllers/catalogController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { listReviewContent, updateReviewState } from '../controllers/contentReviewController';

const router = Router();

router.get('/municipios', listMunicipalities);
router.get('/categorias', listCategories);
router.get('/lugares', listPlaces);
router.get('/lugares/:slug', getPlaceBySlug);
router.get('/servicios', listServices);
router.get('/servicios/:slug', getServiceBySlug);
router.get('/admin/estado', requireAuth, requireRole(['administrador']), getContentStatus);
router.get('/admin/revision', requireAuth, requireRole(['administrador']), listReviewContent);
router.patch('/admin/revision/:tipo/:id', requireAuth, requireRole(['administrador']), updateReviewState);

export default router;
