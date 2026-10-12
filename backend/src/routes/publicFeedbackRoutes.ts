import { Router } from 'express';
import { trackUsage } from '../controllers/analyticsController';
import { submitSurvey } from '../controllers/surveyController';
import { optionalAuth } from '../middlewares/optionalAuth';
import { rateLimit } from '../middlewares/rateLimit';

const router = Router();

router.post(
  '/encuesta',
  rateLimit({ windowMs: 60 * 60_000, max: 5, message: 'Ya registramos varias respuestas desde este dispositivo. ¡Gracias!' }),
  optionalAuth,
  submitSurvey,
);
router.post(
  '/analitica',
  rateLimit({ windowMs: 60_000, max: 90, message: 'Demasiados eventos.' }),
  trackUsage,
);

export default router;
