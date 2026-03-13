import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const users = await db.collection('users').find({}, { projection: { email: 1, password: 1 } }).toArray();
const bcryptPrefix = '$2';
const nonBcrypt = users.filter((u) => !(typeof u.password === 'string' && u.password.startsWith(bcryptPrefix)));
console.log('TOTAL_USERS=' + users.length);
console.log('NON_BCRYPT_COUNT=' + nonBcrypt.length);
console.log('NON_BCRYPT_EMAILS=' + JSON.stringify(nonBcrypt.map((u) => u.email)));
await mongoose.disconnect();
