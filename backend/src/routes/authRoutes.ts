import { Router } from 'express';
import { devRegister, devLogin, getMe } from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';
import { getAuthMode } from '../auth/verifyAccessToken';

const router = Router();

// ==========================================
// MOCK ROUTES - TEMPORALES PARA DESARROLLO
// No almacenar contraseñas contradice a Supabase.
// ==========================================
if (getAuthMode() === 'dev') {
  router.post('/register', devRegister);
  router.post('/login', devLogin);
}

// ==========================================
// RUTAS DEFINITIVAS
// ==========================================
router.get('/me', requireAuth, getMe);

export default router;
