import mongoose from 'mongoose';
import { Moderator as ModeratorUser } from '../Models/User.js';
import ModeratorLegacy from '../Models/Moderator.js';
import Department from '../Models/Department.js';
import { User } from '../Models/User.js';

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Resolve a moderator's department to a Department _id string.
 * Will search new moderator collection, legacy moderator collection and resolve
 * department names to ids when necessary. Returns a string _id or null.
 * Accepts either userId (ObjectId) and/or email.
 */
export async function resolveModeratorDept({ userId, email } = {}) {
  try {
    // Try new moderator collection by userId then email
    let mod = null;
    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      mod = await ModeratorUser.findOne({ userId }).select('department').lean();
    }
    if (!mod && email) {
      mod = await ModeratorUser.findOne({ email }).select('department').lean();
    }

    // Legacy moderator collection fallbacks
    if (!mod && userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      mod = await ModeratorLegacy.findOne({ userId }).select('department').lean();
    }
    if (!mod && email) {
      mod = await ModeratorLegacy.findOne({ email }).select('department').lean();
    }

    // If still nothing, try to fetch email from User by userId
    if (!mod && !email && userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      try {
        const u = await User.findById(userId).select('email').lean();
        if (u?.email) email = u.email;
        if (email) mod = await ModeratorUser.findOne({ email }).select('department').lean() || await ModeratorLegacy.findOne({ email }).select('department').lean();
      } catch (e) {
        // ignore
      }
    }

    const rawDept = mod?.department;
    if (!rawDept) return null;

    // If department is an ObjectId or looks like one, return its string form if it exists
    if (mongoose.Types.ObjectId.isValid(String(rawDept))) {
      // verify department exists
      const d = await Department.findById(String(rawDept)).select('_id').lean();
      if (d) return String(d._id);
    }

    // Otherwise treat rawDept as a name and try to resolve to id
    try {
      const deptName = String(rawDept).trim();
      const conds = [ { name: deptName }, { name: new RegExp('^' + escapeRegExp(deptName) + '$', 'i') }, { name: new RegExp('\\b' + escapeRegExp(deptName) + '\\b', 'i') }, { name: new RegExp(escapeRegExp(deptName), 'i') } ];
      const deptDoc = await Department.findOne({ $or: conds }).select('_id').lean();
      if (deptDoc) return String(deptDoc._id);
    } catch (e) {
      // ignore resolution errors
    }

    return null;
  } catch (err) {
    console.error('resolveModeratorDept error:', err);
    return null;
  }
}

export default resolveModeratorDept;
