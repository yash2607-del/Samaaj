import express from 'express';
import auth from '../middleware/auth.js';
import moderatorController from '../controllers/moderatorController.js';

const router = express.Router();

router.get('/moderator-view', auth, moderatorController.moderatorView);
router.post('/register', moderatorController.register);
router.post('/login', moderatorController.login);

export { router as default };
