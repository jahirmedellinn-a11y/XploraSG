import { Router } from 'express';
import { listEventos, listPromociones } from '../controllers/agendaController';

const router = Router();

router.get('/eventos', listEventos);
router.get('/promociones', listPromociones);

export default router;
