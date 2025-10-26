import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Moderator from '../models/Moderator.js';
import Department from '../models/Department.js';

async function migrate(uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/samaaj') {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB for migration');

  const moderators = await Moderator.find({}).lean();
  console.log(`Found ${moderators.length} moderators`);

  for (const mod of moderators) {
    try {
      const deptField = mod.department;
      if (!deptField) {
        console.log(`Moderator ${mod._id} has no department, skipping`);
        continue;
      }

      // If already an ObjectId, skip
      if (mongoose.Types.ObjectId.isValid(String(deptField))) {
        // Ensure it points to an existing Department
        const d = await Department.findById(String(deptField));
        if (d) {
          console.log(`Moderator ${mod._id} already has valid ObjectId department ${d._id}`);
          continue;
        }
      }

      const fieldStr = String(deptField).trim();
      if (!fieldStr) {
        console.log(`Moderator ${mod._id} department empty after trim, skipping`);
        continue;
      }

      // Try exact, ci exact, word-boundary, substring
      let department = await Department.findOne({ name: fieldStr });
      if (!department) department = await Department.findOne({ name: new RegExp('^' + fieldStr.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&') + '$', 'i') });
      if (!department) department = await Department.findOne({ name: new RegExp('\\b' + fieldStr.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&') + '\\b', 'i') });
      if (!department) department = await Department.findOne({ name: new RegExp(fieldStr.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&'), 'i') });

      if (department) {
        await Moderator.updateOne({ _id: mod._id }, { $set: { department: department._id } });
        console.log(`Updated moderator ${mod._id} -> dept ${department.name} (${department._id})`);
      } else {
        console.log(`No department match for moderator ${mod._id} (value: "${deptField}")`);
      }
    } catch (err) {
      console.error(`Error migrating moderator ${mod._id}:`, err);
    }
  }

  await mongoose.disconnect();
  console.log('Migration finished and disconnected');
}

if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
