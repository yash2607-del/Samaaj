import express from "express";
import multer from 'multer';
import path from 'path';
import complaintsController from '../controllers/complaintsController.js';
import auth from "../middleware/auth.js";
import requireRole from '../middleware/roles.js';

const router = express.Router();

// Debug logger for complaint update routes
router.use((req, res, next) => {
  if (req.path && req.path.toLowerCase().includes('update-status')) {
    console.log('[ComplaintsRouter] incoming:', req.method, req.originalUrl || req.url, 'headers:', { authorization: req.header('authorization') });
  }
  next();
});

const uploadsDir = path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/departments', complaintsController.getDepartments);
router.get('/departments/:id', complaintsController.getDepartmentById);
// Listing complaints handled by controller which enforces role-specific filters
router.get('/', auth, complaintsController.listComplaints);
router.get('/by-department', auth, requireRole('Moderator'), complaintsController.groupByDepartment);
router.get('/moderator-view', auth, requireRole('Moderator'), complaintsController.moderatorView);
// Moderator: get complaints across all departments matching a complaint's category
router.get('/moderator-by-category/:complaintId', auth, requireRole('Moderator'), complaintsController.moderatorByCategory);
// Support both PATCH and POST for status updates (some clients/browsers use POST for multipart)
router.patch('/update-status/:complaintId', auth, requireRole('Moderator'), upload.single('actionPhoto'), complaintsController.updateStatus);
router.post('/update-status/:complaintId', auth, requireRole('Moderator'), upload.single('actionPhoto'), complaintsController.updateStatus);
router.post('/assign/:complaintId', auth, requireRole('Moderator'), complaintsController.assignComplaint);
router.post('/', auth, upload.single('photo'), complaintsController.createComplaint);
router.post('/:complaintId/community-validate', auth, complaintsController.communityValidate);
router.delete('/:complaintId/community-validate', auth, complaintsController.removeCommunityValidate);
router.post('/:complaintId/like', auth, complaintsController.likeComplaint);
router.post('/:complaintId/dislike', auth, complaintsController.dislikeComplaint);
// Get single complaint and related complaints by category
router.get('/:complaintId', auth, complaintsController.getComplaint);

export default router;
