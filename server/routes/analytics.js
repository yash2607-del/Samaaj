import express from 'express';
import Complaint from '../models/complaint.js';
import mongoose from 'mongoose';
import auth from "../middleware/auth.js";
import requireRole from '../middleware/roles.js';

const router = express.Router();

const DELHI_DISTRICTS = {
  'Central Delhi': { lat: 28.64, lng: 77.22 },
  'North Delhi': { lat: 28.68, lng: 77.20 },
  'South Delhi': { lat: 28.52, lng: 77.20 },
  'East Delhi': { lat: 28.62, lng: 77.30 },
  'West Delhi': { lat: 28.65, lng: 77.08 },
  'New Delhi': { lat: 28.61, lng: 77.20 },
  'North East Delhi': { lat: 28.70, lng: 77.26 },
  'North West Delhi': { lat: 28.73, lng: 77.14 },
  'Shahdara': { lat: 28.68, lng: 77.29 },
  'South East Delhi': { lat: 28.54, lng: 77.26 },
  'South West Delhi': { lat: 28.58, lng: 77.05 },
};

// Simple pseudo-random number generator using string hash
const seededRandom = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};

router.get('/heatmap', async (req, res) => {
  try {
    // Optionally filter by category
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;

    // Limit to latest 500 issues for performance
    const complaints = await Complaint.find(filter)
      .select('_id district status')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const heatmapData = complaints.map(c => {
      // Find base coordinates
      let baseCoord = DELHI_DISTRICTS[c.district] || { lat: 28.6139, lng: 77.2090 };
      
      // Add deterministic jitter (max ~3km)
      const rand1 = seededRandom(c._id.toString() + 'lat');
      const rand2 = seededRandom(c._id.toString() + 'lng');
      
      const latJitter = (rand1 - 0.5) * 0.05; // ~5km
      const lngJitter = (rand2 - 0.5) * 0.05; // ~5km
      
      return {
        lat: baseCoord.lat + latJitter,
        lng: baseCoord.lng + lngJitter,
        weight: c.status === 'Resolved' ? 0.5 : 1, // Higher weight for active issues
        id: c._id,
        status: c.status,
        district: c.district
      };
    });

    res.json(heatmapData);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate, category, status } = req.query;
    const match = {};

    if (category) match.category = category;
    if (status) match.status = status;
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const totalIssues = await Complaint.countDocuments(match);

    const statusDistribution = await Complaint.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const categoryDistribution = await Complaint.aggregate([
      { $match: match },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const trends = await Complaint.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalIssues,
      statusDistribution: statusDistribution.map(d => ({ name: d._id || 'Unknown', value: d.count })),
      categoryDistribution: categoryDistribution.map(d => ({ name: d._id || 'Unknown', value: d.count })),
      trends: trends.map(d => ({ date: d._id, issues: d.count }))
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
