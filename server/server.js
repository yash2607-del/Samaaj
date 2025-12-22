import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
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

if (!FRONTEND_URL) {
  throw new Error('FRONTEND_URL is missing in environment variables');
}


app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// ✅ PRE-FLIGHT (THIS WAS MISSING)
app.options('*', cors({
  origin: FRONTEND_URL,
  credentials: true
}));

/* ===============================
   🧠 BODY PARSING
================================ */
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

/* ===============================
   🗄️ DATABASE
================================ */
const MONGO_URI = process.env.MONGO_URI;

mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

/* ===============================
   🍪 SESSION CONFIG (CORRECT)
================================
   Cross-site cookies REQUIRE:
   - secure: true
   - sameSite: 'none'
================================ */
app.use(session({
  name: 'samaaj_session',
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

/* ===============================
   🚏 ROUTES
================================ */
app.use('/', authRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/track', trackRouter);
app.use('/api/moderators', moderatorRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/chatbot', chatbotRouter);

/* ===============================
   🚀 START SERVER
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
