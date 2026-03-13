import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const uri = process.env.MONGO_URI;
console.log('MONGO_URI=' + uri);
await mongoose.connect(uri);
const db = mongoose.connection.db;
console.log('CONNECTED_DB=' + db.databaseName);
const total = await db.collection('users').countDocuments();
const sample = await db.collection('users').find({}, { projection: { email: 1, role: 1 } }).limit(5).toArray();
const advik = await db.collection('users').findOne({ email: { $regex: '^advik@gmail.com$', $options: 'i' } }, { projection: { email: 1, role: 1 } });
console.log('USERS_COUNT=' + total);
console.log('USERS_SAMPLE=' + JSON.stringify(sample));
console.log('ADDIK_EXISTS=' + (advik ? 'YES' : 'NO'));
if (advik) console.log('ADDIK_RECORD=' + JSON.stringify(advik));
await mongoose.disconnect();
