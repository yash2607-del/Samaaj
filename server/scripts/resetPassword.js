import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Citizen, Moderator } from '../models/User.js';

dotenv.config();

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const [rawEmail, newPassword] = process.argv.slice(2);
if (!rawEmail || !newPassword) {
  console.error('Usage: node scripts/resetPassword.js <email> <newPassword>');
  process.exit(1);
}

const normalizedEmail = String(rawEmail).trim().toLowerCase();
const emailRegex = new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i');

try {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in environment/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const userRes = await User.updateOne(
    { email: emailRegex },
    { $set: { email: normalizedEmail, password: hashedPassword } }
  );

  const citizenRes = await Citizen.updateMany(
    { email: emailRegex },
    { $set: { email: normalizedEmail, password: hashedPassword } }
  );

  const moderatorRes = await Moderator.updateMany(
    { email: emailRegex },
    { $set: { email: normalizedEmail, password: hashedPassword } }
  );

  const totalMatched =
    (userRes.matchedCount || 0) +
    (citizenRes.matchedCount || 0) +
    (moderatorRes.matchedCount || 0);

  if (totalMatched === 0) {
    console.error(`No account found for email: ${normalizedEmail}`);
    process.exit(1);
  }

  console.log('Password reset successful');
  console.log(`Email: ${normalizedEmail}`);
  console.log(`Updated users: ${userRes.modifiedCount || 0}`);
  console.log(`Updated citizen records: ${citizenRes.modifiedCount || 0}`);
  console.log(`Updated moderator records: ${moderatorRes.modifiedCount || 0}`);
} catch (error) {
  console.error('Password reset failed:', error?.message || error);
  process.exit(1);
} finally {
  await mongoose.disconnect();
}
