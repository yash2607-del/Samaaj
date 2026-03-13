import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const matches = await db.collection('users').find({ email: { $regex: 'advik', $options: 'i' } }, { projection: { email: 1, role: 1 } }).toArray();
console.log('ADVIK_MATCHES=' + JSON.stringify(matches));
await mongoose.disconnect();
