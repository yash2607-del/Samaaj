import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..');
const uploadsDir = path.join(serverRoot, 'uploads');

async function main(){
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in env. Check server/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  } catch (e) {
    console.error('Failed to connect to MongoDB:', e.message || e);
    process.exit(1);
  }

  // Dynamically import the Complaint model
  const { default: Complaint } = await import('../models/complaint.js');

  const complaints = await Complaint.find({ photo: { $exists: true, $ne: '' } }).lean();
  console.log('Total complaints with photo field:', complaints.length);

  const missing = [];
  for (const c of complaints) {
    let p = c.photo || '';
    if (!p) continue;
    // Normalize: remove leading slash
    if (p.startsWith('/')) p = p.slice(1);
    const full = path.join(serverRoot, p);
    if (!fs.existsSync(full)) {
      missing.push({ id: c._id.toString(), photo: c.photo, expectedPath: full });
    }
  }

  if (missing.length === 0) {
    console.log('No missing files detected in', uploadsDir);
  } else {
    console.log('Missing files:');
    missing.forEach(m => console.log(`- complaint ${m.id} -> ${m.photo} (expected ${m.expectedPath})`));
    console.log(`Total missing: ${missing.length}`);
  }

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
