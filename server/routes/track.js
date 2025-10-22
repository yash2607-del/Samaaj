import express from 'express';
import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { userId, status, category } = req.query;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.userId = userId;
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [items, total] = await Promise.all([
      Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Complaint.countDocuments(filter),
    ]);

    return res.json({ data: items, meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 } });
  } catch (err) {
    console.error('GET /api/track error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit || '2', 10));
    const { userId } = req.query;
    const filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.userId = userId;
    const items = await Complaint.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json(items);
  } catch (err) {
    console.error('GET /api/track/recent error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const complaint = await Complaint.findById(id).lean();
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    return res.json(complaint);
  } catch (err) {
    console.error('GET /api/track/:id error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;