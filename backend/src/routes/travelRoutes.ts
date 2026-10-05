import { Router } from 'express';
import { calculateRoute, currentWeather } from '../controllers/travelController';

const router = Router();

router.get('/clima', currentWeather);
router.post('/ruta', calculateRoute);

export default router;

