import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/reverse', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ message: 'lat and lon query params are required numbers' });
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ message: 'Invalid coordinate range' });
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        format: 'jsonv2',
        lat,
        lon
      },
      headers: {
        'User-Agent': process.env.NOMINATIM_USER_AGENT || 'Samaaj/1.0 (civic-issue-app)',
        'Accept-Language': 'en'
      },
      timeout: 15000
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Reverse geocode proxy failed:', error?.response?.status, error?.message);
    return res.status(502).json({ message: 'Failed to reverse geocode coordinates' });
  }
});

export default router;
