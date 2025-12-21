import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { User } from '../models/User.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

async function main() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in environment');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DBNAME });

  const arg = process.argv[2];
  let userId = arg;

  if (!arg) {
    console.error('Usage: node dumpNotifications.js <userId|email>');
    process.exit(1);
  }

  // If arg looks like an email, resolve to userId
  if (arg.includes('@')) {
    const user = await User.findOne({ email: arg }).lean();
    if (!user) {
      console.error('User not found for email:', arg);
      process.exit(1);
    }
    userId = user._id;
  }

  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
  console.log(JSON.stringify({ count: notifications.length, notifications }, null, 2));

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
