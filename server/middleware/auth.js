import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Support both the newer moderator collection (from models/User.js)
// and the legacy Moderator model/collection.
import { Moderator as ModeratorUser } from '../models/User.js';
import ModeratorLegacy from '../models/Moderator.js';

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If moderator token doesn't carry department (old token / signup token), backfill it from DB.
    const roleLower = String(decoded?.role || '').toLowerCase();
    const deptFromToken = decoded?.department;
    const deptIsValid = deptFromToken && mongoose.Types.ObjectId.isValid(String(deptFromToken));

    if (roleLower === 'moderator' && !deptIsValid) {
      const userId = decoded?.id;
      if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
        // New collection first
        let mod = await ModeratorUser.findOne({ userId }).select('department').lean();
        if (!mod) {
          // Legacy collection fallback
          mod = await ModeratorLegacy.findOne({ _id: userId }).select('department').lean();
          if (!mod) mod = await ModeratorLegacy.findOne({ email: decoded?.email }).select('department').lean();
        }

        if (mod?.department && mongoose.Types.ObjectId.isValid(String(mod.department))) {
          decoded.department = String(mod.department);
        }
      }
    }

    req.user = decoded; // { id, role, department? }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default auth;
