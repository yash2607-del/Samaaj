import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..');
const uploadsDir = path.join(serverRoot, 'uploads');

const REMOTE_BASE = process.env.REMOTE_BACKEND || process.env.VITE_API_BASE_URL || process.env.VITE_BACKEND_URL || 'https://samaaj-backend-kj3r.onrender.com';

async function main(){
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in env. Check server/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
  } catch (e) {
    console.error('Failed to connect to MongoDB:', e.message || e);
    process.exit(1);
  }

  const { default: Complaint } = await import('../Models/complaint.js');

  const complaints = await Complaint.find({ photo: { $exists: true, $ne: '' } }).lean();
  console.log('Total complaints with photo field:', complaints.length);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of complaints) {
    let p = (c.photo || '').trim();
    if (!p) { skipped++; continue; }
    p = p.replace(/\\/g, '/');
    if (p.startsWith('/')) p = p.slice(1);
    const localPath = path.join(serverRoot, p);
    if (fs.existsSync(localPath)) { skipped++; continue; }

    const url = `${REMOTE_BASE.replace(/\/$/, '')}/${p}`;
    try {
      console.log('Fetching', url);
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('Failed to fetch', url, 'status', res.status);
        failed++;
        continue;
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // ensure directory
      const dir = path.dirname(localPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(localPath, buffer);
      console.log('Saved', localPath);
      downloaded++;
    } catch (err) {
      console.error('Error downloading', url, err.message || err);
      failed++;
    }
  }

  console.log(`Done. downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
