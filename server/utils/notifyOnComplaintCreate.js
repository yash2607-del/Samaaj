import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { Citizen, Moderator as ModeratorUser } from '../models/User.js';

const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const areaMatches = (assignedAreaRaw, districtRaw, locationRaw) => {
  const assignedArea = String(assignedAreaRaw || '').trim();
  if (!assignedArea) return true;

  const district = String(districtRaw || '').trim();
  const location = String(locationRaw || '').trim();

  const needle = assignedArea.toLowerCase();
  if (district && district.toLowerCase() === needle) return true;
  if (location && location.toLowerCase().includes(needle)) return true;
  return false;
};

export default async function notifyOnComplaintCreate({ complaint } = {}) {
  try {
    if (!complaint?._id) return;

    const complaintId = complaint._id;
    const title = String(complaint.title || 'New Complaint').trim();
    const district = String(complaint.district || '').trim();
    const location = String(complaint.location || '').trim();
    const departmentId = complaint.department;

    const ownerId = complaint.userId;
    const bulk = [];

    // 1) Notify complaint owner
    if (ownerId && mongoose.Types.ObjectId.isValid(String(ownerId))) {
      bulk.push({
        userId: ownerId,
        type: 'new_complaint',
        title: 'Issue Submitted',
        message: `Your complaint "${title}" was submitted successfully.`,
        complaintId,
        metadata: { area: district || location }
      });
    }

    // 2) Notify moderators for this department (+ area when configured)
    if (departmentId && mongoose.Types.ObjectId.isValid(String(departmentId))) {
      const moderators = await ModeratorUser.find({ department: departmentId })
        .select('userId name assignedArea')
        .lean();

      for (const mod of moderators || []) {
        const modUserId = mod?.userId;
        if (!modUserId || !mongoose.Types.ObjectId.isValid(String(modUserId))) continue;
        if (!areaMatches(mod?.assignedArea, district, location)) continue;

        bulk.push({
          userId: modUserId,
          type: 'new_complaint',
          title: 'New Issue in Your Area',
          message: `New complaint reported: "${title}"${district ? ` (${district})` : ''}.`,
          complaintId,
          metadata: { area: district || location }
        });
      }
    }

    // 3) Notify citizens in the same district ("area")
    if (district) {
      const districtRegex = new RegExp('^' + escapeRegExp(district) + '$', 'i');
      const citizens = await Citizen.find({ location: districtRegex }).select('userId').lean();

      for (const c of citizens || []) {
        const userId = c?.userId;
        if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) continue;
        if (ownerId && String(userId) === String(ownerId)) continue;

        bulk.push({
          userId,
          type: 'new_complaint',
          title: 'New Issue Reported Nearby',
          message: `A new complaint was reported in ${district}: "${title}".`,
          complaintId,
          metadata: { area: district }
        });
      }
    }

    if (bulk.length) {
      // Insert best-effort; failures should not block complaint creation
      await Notification.insertMany(bulk, { ordered: false });
    }
  } catch (err) {
    console.error('notifyOnComplaintCreate error:', err);
  }
}
