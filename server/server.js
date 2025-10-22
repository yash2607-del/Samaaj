import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

// models (adjust if your User file exports differently)
import { User, Citizen, Moderator } from './models/User.js';

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

// mongoose connection (avoid deprecated options)
mongoose.set('strictQuery', false);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/samaaj';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

mongoose.connection.on('error', err => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.warn('Mongoose disconnected'));

// signup / login routes (keep as you had)
app.post('/signup', async (req, res) => {
  try {
    const { role, name, email, password, location, issueCategory, department, assignedArea } = req.body;
    if (!role || !name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

    const user = await User.create({ name, email, password, role });

    if (role === 'Citizen') {
      await Citizen.create({ userId: user._id, name, email, password, role, location, issueCategory });
    } else if (role === 'Moderator') {
      await Moderator.create({ userId: user._id, name, email, password, role, department, assignedArea });
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    return res.status(201).json({ message: 'User created', user });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(400).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.password !== password) return res.status(401).json({ error: 'Invalid email or password' });

    return res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// mount routers
app.use('/api/complaints', complaintsRouter);
app.use('/api/track', trackRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});