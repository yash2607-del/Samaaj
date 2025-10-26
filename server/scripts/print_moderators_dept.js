import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Moderator from '../models/Moderator.js';

async function printMods(uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/samaaj') {
  await mongoose.connect(uri);
  const mods = await Moderator.find({}).lean();
  console.log(`Found ${mods.length} moderators`);
  mods.forEach(m => {
    console.log(`- ${m._id} | email: ${m.email} | department (raw): ${JSON.stringify(m.department)}`);
  });
  await mongoose.disconnect();
}

if (require.main === module) {
  printMods().catch(err => { console.error(err); process.exit(1); });
}
