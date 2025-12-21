import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
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
const FRONTEND_URL = process.env.FRONTEND_URL;
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
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
const uploadsDir = path.join(process.cwd(), 'uploads');
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