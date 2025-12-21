import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Moderator as ModeratorUser, User } from '../Models/User.js';
import resolveModeratorDept from '../utils/resolveModeratorDept.js';

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const auth = async (req, res, next) => {
  // Prefer session-based auth
  try {
    if (req.session && req.session.user) {
      req.user = req.session.user;
      return next();
    }

    // Fallback to JWT (for API clients still using tokens)
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      console.warn('auth middleware: missing Authorization header or session');
      // include request path to help diagnose which route failed
      console.warn('auth middleware: request path', req.method, req.originalUrl || req.url);
      return res.status(401).json({ error: 'No token or session provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('auth middleware: decoded JWT payload:', { id: decoded?.id, role: decoded?.role, department: decoded?.department });
    } catch (verr) {
      console.warn('auth middleware: token verification failed', verr && verr.message);
      console.warn('auth middleware: request path', req.method, req.originalUrl || req.url);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // If moderator token doesn't carry department (old token / signup token), backfill it from DB.
    const roleLower = String(decoded?.role || '').toLowerCase();
    const deptFromToken = decoded?.department;
    const deptIsValid = deptFromToken && mongoose.Types.ObjectId.isValid(String(deptFromToken));

    if (roleLower === 'moderator' && !deptIsValid) {
      console.log('auth middleware: moderator token missing/invalid department, attempting DB lookup for user id/email', decoded?.id, decoded?.email);
      // Try to populate email when possible so resolver can use it
      if (!decoded?.email && decoded?.id) {
        try {
          const u = await User.findById(decoded.id).select('email').lean();
          if (u?.email) decoded.email = u.email;
        } catch (e) {
          /* ignore */
        }
      }

      try {
        const resolved = await resolveModeratorDept({ userId: decoded?.id, email: decoded?.email });
        if (resolved) decoded.department = resolved;
        console.log('auth middleware: resolved department from DB?', decoded?.department);
      } catch (dbErr) {
        console.error('auth middleware: error during moderator DB lookup:', dbErr);
      }
    }

    req.user = decoded; // { id, role, department? }
    console.debug('auth middleware: attached req.user', { id: req.user?.id, role: req.user?.role, department: req.user?.department });
    return next();
    } catch (err) {
    console.error('auth middleware error:', err && err.message);
    return res.status(401).json({ error: 'Invalid token or session' });
  }
};

export default auth;
