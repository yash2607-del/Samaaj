#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Complaint from '../models/complaint.js';
import Department from '../models/Department.js';

const id = process.argv[2];
const categoryArg = process.argv[3];
if (!id && !categoryArg) { console.error('Usage: node getRelatedByCategory.js <complaintId> [category]'); process.exit(2); }

async function main() {
  if (!process.env.MONGO_URI) { console.error('MONGO_URI not set'); process.exit(2); }
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });

  let category = categoryArg;
  if (id && !category) {
    const c = await Complaint.findById(id).lean();
    if (!c) { console.error('Complaint not found:', id); await mongoose.disconnect(); process.exit(2); }
    category = c.category;
    console.log('Complaint category:', category);
  }

  if (!category) { console.error('No category determined'); await mongoose.disconnect(); process.exit(2); }

  const departments = await Department.find({ category }).lean();
  console.log(`Found ${departments.length} departments for category '${category}':`);
  departments.forEach(d => console.log('-', d.name, d._id.toString()));

  const deptIds = departments.map(d => d._id).filter(Boolean);
  if (!deptIds.length) { console.log('No departments, exiting'); await mongoose.disconnect(); process.exit(0); }

  const complaints = await Complaint.find({ department: { $in: deptIds } }).populate('department', 'name').sort({ createdAt: -1 }).lean();
  console.log(`Found ${complaints.length} complaints in those departments.`);
  complaints.slice(0, 20).forEach(c => {
    console.log(`- ${c._id} | ${c.title} | dept: ${c.department?.name || 'N/A'} | category: ${c.category}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
