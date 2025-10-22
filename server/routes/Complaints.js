import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Complaint from '../models/Complaint.js';

const router = express.Router();

// ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// multer storage -> uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Create complaint (multipart/form-data with field 'photo')
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { title, category, description = '', location } = req.body;
    if (!title || !category || !location) return res.status(400).json({ error: 'title, category and location are required' });

    const photoPath = req.file ? `/uploads/${req.file.filename}` : '';
    const complaint = await Complaint.create({ title, category, description, location, photo: photoPath });
    return res.status(201).json({ message: 'Complaint created', complaint });
  } catch (err) {
    console.error('Create complaint error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// List complaints (optional query: category, status)
router.get('/', async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(complaints);
  } catch (err) {
    console.error('List complaints error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get single complaint
router.get('/:id', async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ error: 'Complaint not found' });
    return res.json(c);
  } catch (err) {
    console.error('Get complaint error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;