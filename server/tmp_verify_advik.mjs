import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log('CONNECTED_DB=' + db.databaseName);
const advik018 = await db.collection('users').countDocuments({ email: 'advik018@gmail.com' });
const advik = await db.collection('users').countDocuments({ email: 'advik@gmail.com' });
console.log('ADVIK018=' + advik018);
console.log('ADVIK=' + advik);
await mongoose.disconnect();
