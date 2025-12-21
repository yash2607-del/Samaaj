import express from 'express';
import authController from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.get('/profile', auth, authController.getProfile);
router.put('/api/users/:userId', auth, authController.updateProfile);
router.put('/api/users/:userId/password', auth, authController.updatePassword);

export default router;
