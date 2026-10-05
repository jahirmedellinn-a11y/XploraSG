import { Router } from 'express';
import { answerAssistantQuestion } from '../controllers/assistantController';

const router = Router();

router.post('/consulta', answerAssistantQuestion);

export default router;
