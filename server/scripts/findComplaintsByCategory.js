#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Complaint from '../models/complaint.js';
import Department from '../models/Department.js';

const argv = process.argv.slice(2);
const opts = {};
for (const a of argv) {
  if (a.startsWith('--category=')) opts.category = a.split('=')[1];
  if (a.startsWith('--limit=')) opts.limit = parseInt(a.split('=')[1], 10) || 20;
}

if (!opts.category) {
  console.error('Usage: node findComplaintsByCategory.js --category=Water [--limit=20]');
  process.exit(2);
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    process.exit(2);
  }
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  console.log('Connected to MongoDB');

  const q = { category: new RegExp('^' + opts.category + '$', 'i') };
  const items = await Complaint.find(q).sort({ createdAt: -1 }).limit(opts.limit || 20).lean();
  console.log(`Found ${items.length} complaints for category='${opts.category}':\n`);
  for (const c of items) {
    let deptInfo = c.department || null;
    if (deptInfo && typeof deptInfo !== 'string' && deptInfo._id) deptInfo = deptInfo._id;
    let deptName = null;
    if (deptInfo) {
      try {
        const d = await Department.findById(String(deptInfo)).lean();
        if (d) deptName = d.name;
      } catch (e) {}
    }
    console.log(`- id: ${c._id}`);
    console.log(`  title: ${c.title || '[no title]'}`);
    console.log(`  category: ${c.category}`);
    console.log(`  departmentField: ${c.department || 'null'}`);
    console.log(`  resolvedDepartmentName: ${deptName || 'N/A'}`);
    console.log(`  userId: ${c.userId}`);
    console.log(`  createdAt: ${c.createdAt}`);
    console.log('');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
