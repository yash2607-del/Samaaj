import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
await client.connect();
const admin = client.db().admin();
const dbs = await admin.listDatabases();
for (const d of dbs.databases) {
  const db = client.db(d.name);
  let usersCount = 0;
  let advikCount = 0;
  try {
    usersCount = await db.collection('users').countDocuments();
    advikCount = await db.collection('users').countDocuments({ email: { $regex: '^advik@gmail.com$', $options: 'i' } });
  } catch {
    continue;
  }
  console.log(`DB=${d.name} USERS=${usersCount} ADVIK=${advikCount}`);
}
await client.close();
