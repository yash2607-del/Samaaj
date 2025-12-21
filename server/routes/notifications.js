import express from 'express';
import auth from '../middleware/auth.js';
import notificationsController from '../controllers/notificationsController.js';

const router = express.Router();

router.get('/', auth, notificationsController.getNotifications);
router.put('/:notificationId/read', auth, notificationsController.markRead);
router.put('/mark-all-read', auth, notificationsController.markAllRead);

export default router;
