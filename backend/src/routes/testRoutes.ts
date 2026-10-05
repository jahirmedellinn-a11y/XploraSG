import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

// Ruta pública (sin middlewares)
router.get('/public', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Ruta pública accesible.' });
});

// Ruta protegida general (solo requiere estar autenticado, cualquier rol)
router.get('/protected', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({ message: 'Acceso concedido a ruta protegida.', user: req.user });
});

// Ruta protegida estricta (solo administrador)
router.get('/admin-only', requireAuth, requireRole(['administrador']), (req: Request, res: Response) => {
  res.status(200).json({ message: 'Acceso concedido a panel de administrador.', user: req.user });
});

export default router;
