import express from "express";
import multer from 'multer';
import path from 'path';
import complaintsController from '../controllers/complaintsController.js';
import auth from "../middleware/auth.js";

const router = express.Router();

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
router.get('/', auth, complaintsController.listComplaints);
router.get('/by-department', auth, complaintsController.groupByDepartment);
router.get('/moderator-view', auth, complaintsController.moderatorView);
router.patch('/update-status/:complaintId', upload.single('actionPhoto'), complaintsController.updateStatus);
router.post('/assign/:complaintId', complaintsController.assignComplaint);
router.post('/', auth, upload.single('photo'), complaintsController.createComplaint);
router.post('/:complaintId/community-validate', auth, complaintsController.communityValidate);
router.delete('/:complaintId/community-validate', auth, complaintsController.removeCommunityValidate);
router.post('/:complaintId/like', complaintsController.likeComplaint);
router.post('/:complaintId/dislike', complaintsController.dislikeComplaint);

export default router;
