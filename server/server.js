import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import complaintsRouter from './routes/Complaints.js';
import trackRouter from './routes/track.js';
import moderatorRouter from './routes/moderator.js';
import notificationsRouter from './routes/notifications.js';
import authRouter from './routes/auth.js';
import chatbotRouter from './routes/chatbot.js';
dotenv.config();
const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ADDITIONAL_ALLOWED = (process.env.ADDITIONAL_ALLOWED || '').split(',').map(s => s.trim()).filter(Boolean);
const normalizeOrigin = (value) => {
  if (!value) return value;
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return String(value).trim().replace(/\/+$/, '');
  }
};

const allowedOrigins = new Set([
  normalizeOrigin(FRONTEND_URL),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
].map(normalizeOrigin));

// Include any additional origins provided via env var
ADDITIONAL_ALLOWED.forEach(origin => allowedOrigins.add(normalizeOrigin(origin)));

console.log('Allowed CORS origins:', Array.from(allowedOrigins));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.has(normalized)) return callback(null, true);
    console.warn('Blocked CORS request from origin:', origin, 'normalized:', normalized);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use((req, res, next) => {
  try {
    if (req.originalUrl && req.originalUrl.toLowerCase().includes('/api/complaints/update-status')) {
      console.log('[Server] incoming request:', req.method, req.originalUrl, 'headers:', { authorization: req.header('authorization'), 'content-type': req.header('content-type') });
      res.on('finish', () => {
        console.log('[Server] response finished:', req.method, req.originalUrl, 'status:', res.statusCode);
      });
    }
  } catch (e) {
    console.error('Error in update-status logging middleware:', e);
  }
  next();
});
// Determine uploads directory relative to this file to avoid issues when
// the process CWD differs (e.g., deployed environments).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

mongoose.set('strictQuery', false);
const MONGO_URI = process.env.MONGO_URI 

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI, collectionName: 'sessions', ttl: 60 * 60 * 24 * 21 }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 21, 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use('/', authRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/track', trackRouter);
app.use('/api/moderators', moderatorRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/chatbot', chatbotRouter);
const PORT = process.env.PORT ;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));