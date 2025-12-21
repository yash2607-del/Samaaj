import express from 'express';
import trackController from '../controllers/trackController.js';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/roles.js';

const router = express.Router();

// Only authenticated citizens should access track endpoints
router.get('/', auth, requireRole('Citizen'), trackController.list);
router.get('/recent', auth, requireRole('Citizen'), trackController.recent);
router.get('/:id', auth, requireRole('Citizen'), trackController.getById);

export default router;