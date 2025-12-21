import express from 'express';
import chatbotController from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/respond', chatbotController.respond);

export default router;
