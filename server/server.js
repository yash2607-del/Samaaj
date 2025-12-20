import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bcrypt from 'bcryptjs';

// models
import { User, Citizen, Moderator } from './models/User.js';
import Department from './models/Department.js';

// middleware
import auth from './middleware/auth.js';

// routers
import complaintsRouter from './routes/complaints.js';
import trackRouter from './routes/track.js';
import moderatorRouter from './routes/moderator.js';
import notificationsRouter from './routes/notifications.js';

const app = express();
// allow CORS with credentials so the client can send/receive session cookies
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ensure uploads dir exists and serve it
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// mongoose connection
mongoose.set('strictQuery', false);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/samaaj';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Session setup (stores sessions in MongoDB). Cookie maxAge set to 3 weeks.
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI, collectionName: 'sessions', ttl: 60 * 60 * 24 * 21 }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 21, // 3 weeks
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// ---------------- Signup ----------------
app.post('/signup', async (req, res) => {
  try {
    const { role, name, email, password, location, department, assignedArea } = req.body;
    if (!role || !name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword, role });

    let deptIdForToken = null;

    if (role === 'Citizen') {
      await Citizen.create({ userId: user._id, name, email, password: hashedPassword, role, location });
    } else if (role === 'Moderator') {
      // resolve department if provided (accepts ObjectId or name)
      let deptId = null;
      if (department) {
        const deptStr = String(department).trim();
        if (mongoose.Types.ObjectId.isValid(deptStr)) {
          const d = await Department.findById(deptStr);
          if (d) deptId = d._id;
        }
        if (!deptId) {
          const d = await Department.findOne({ name: new RegExp('^' + deptStr.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '$', 'i') });
          if (d) deptId = d._id;
        }
      }

      await Moderator.create({ userId: user._id, name, email, password: hashedPassword, role, department: deptId, assignedArea });
      if (deptId) deptIdForToken = String(deptId);
    }

    // Optionally return a token so the client can be logged in immediately
    const tokenPayload = { id: user._id, role: user.role };
    if (deptIdForToken) tokenPayload.department = deptIdForToken;
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

    const userRes = { id: user._id, role: user.role, name: user.name, email: user.email };
    if (deptIdForToken) userRes.department = deptIdForToken;

    return res.status(201).json({ message: 'User created successfully', token, user: userRes });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(400).json({ error: err.message });
  }
});

// ---------------- Login ----------------
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    // generate JWT and include moderator department when available
    let deptForToken = null;
    if (user.role === 'Moderator') {
      const mod = await Moderator.findOne({ userId: user._id }).select('department').populate('department', 'name');
      if (mod && mod.department) deptForToken = String(mod.department._id || mod.department);
    }

    const tokenPayload = { id: user._id, role: user.role };
    if (deptForToken) tokenPayload.department = deptForToken;

    // create session for the user (session cookie lives for 3 weeks)
    req.session.user = { id: String(user._id), role: user.role };
    if (deptForToken) req.session.user.department = deptForToken;

    // return user info and also a JWT for backward compatibility
    const userRes = { id: user._id, role: user.role, name: user.name, email: user.email };
    if (deptForToken) userRes.department = deptForToken;

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({ message: 'Login successful', user: userRes, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ---------------- Logout ----------------
app.post('/logout', (req, res) => {
  if (!req.session) return res.status(200).json({ message: 'No active session' });
  req.session.destroy(err => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out' });
  });
});

// ---------------- Get Profile ----------------
app.get('/profile', auth, async (req, res) => {
  try {
    const { id, role } = req.user;
    console.log('Profile request - User ID:', id, 'Role:', role);

    let userData;
    const roleLower = String(role || '').toLowerCase();
    
    if (roleLower === 'citizen') {
      userData = await Citizen.findOne({ userId: id }).select('-password');
    } else if (roleLower === 'moderator') {
      userData = await Moderator.findOne({ userId: id }).select('-password').populate('department', 'name areas');
    }

    console.log('Found user data:', userData ? 'Yes' : 'No');
    
    if (!userData) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userData });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Update User Profile ----------------
app.put('/api/users/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, location } = req.body;
    
    // Verify user is updating their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update base User model
    const user = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update role-specific model
    const roleLower = String(user.role || '').toLowerCase();
    let roleSpecificUser;
    
    if (roleLower === 'citizen') {
      roleSpecificUser = await Citizen.findOneAndUpdate(
        { userId },
        { name, email, location },
        { new: true, runValidators: true }
      ).select('-password');
    } else if (roleLower === 'moderator') {
      roleSpecificUser = await Moderator.findOneAndUpdate(
        { userId },
        { name, email },
        { new: true, runValidators: true }
      ).select('-password').populate('department', 'name areas');
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        location: roleSpecificUser?.location 
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Update Password ----------------
app.put('/api/users/:userId/password', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Verify user is updating their own password
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Also update in role-specific model
    const roleLower = String(user.role || '').toLowerCase();
    
    if (roleLower === 'citizen') {
      await Citizen.findOneAndUpdate({ userId }, { password: hashedPassword });
    } else if (roleLower === 'moderator') {
      await Moderator.findOneAndUpdate({ userId }, { password: hashedPassword });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mount routes and start server (after initial connection above)
app.use('/api/complaints', complaintsRouter);
app.use('/api/track', trackRouter);
app.use('/api/moderators', moderatorRouter);
app.use('/api/notifications', notificationsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
