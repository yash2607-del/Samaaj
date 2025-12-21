import express from 'express';
import trackController from '../controllers/trackController.js';

const router = express.Router();

router.get('/', trackController.list);
router.get('/recent', trackController.recent);
router.get('/:id', trackController.getById);

export default router;