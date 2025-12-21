#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Complaint from '../models/complaint.js';
import Department from '../models/Department.js';

const id = process.argv[2];
if (!id) { console.error('Usage: node viewComplaint.js <complaintId>'); process.exit(2); }

async function main() {
  if (!process.env.MONGO_URI) { console.error('MONGO_URI not set'); process.exit(2); }
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  const c = await Complaint.findById(id).populate('department').lean();
  console.log(JSON.stringify(c, null, 2));
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
