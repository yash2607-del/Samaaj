import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// models
import { User, Citizen, Moderator } from './models/User.js';

// middleware
import auth from './middleware/auth.js';

// routers
import complaintsRouter from './routes/complaints.js';
import trackRouter from './routes/track.js';

const app = express();
app.use(cors());
app.use(express.json());

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

// ---------------- Signup ----------------
app.post('/signup', async (req, res) => {
  try {
    const { role, name, email, password, location, issueCategory, department, assignedArea } = req.body;
    if (!role || !name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword, role });

    if (role === 'Citizen') {
      await Citizen.create({ userId: user._id, name, email, password: hashedPassword, role, location, issueCategory });
    } else if (role === 'Moderator') {
      await Moderator.create({ userId: user._id, name, email, password: hashedPassword, role, department, assignedArea });
    }

    return res.status(201).json({ message: 'User created successfully' });
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

    // generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ---------------- Get Profile ----------------
app.get('/profile', auth, async (req, res) => {
  try {
    const { id, role } = req.user;

    let userData;
    if (role === 'Citizen') {
      userData = await Citizen.findOne({ userId: id }).select('-password');
    } else if (role === 'Moderator') {
      userData = await Moderator.findOne({ userId: id }).select('-password');
    }

    if (!userData) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/complaints', complaintsRouter);
app.use('/api/track', trackRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
