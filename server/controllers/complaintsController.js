import mongoose from 'mongoose';
import path from 'path';
import Complaint from '../models/Complaint.js';
import Moderator from '../models/Moderator.js';
import Department from '../models/Department.js';
import { Citizen, Moderator as ModeratorUser } from '../models/User.js';
import resolveModeratorDept from '../utils/resolveModeratorDept.js';
import Notification from '../models/Notification.js';

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: "Department not found" });
    res.json(department);
  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const listComplaints = async (req, res) => {
  try {
    const { status, department: deptQuery } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (deptQuery && mongoose.Types.ObjectId.isValid(deptQuery)) filter.department = deptQuery;

    const { id: userId, role } = req.user || {};
    const roleLower = String(role || '').toLowerCase();

    const scope = String(req.query.scope || '').toLowerCase();
    const nearby = String(req.query.nearby || '').toLowerCase();
    const wantsDistrictScope = scope === 'district' || scope === 'nearby' || nearby === '1' || nearby === 'true' || nearby === 'yes';

    if (roleLower === 'moderator') {
      // Resolve moderator department using centralized resolver (handles new & legacy collections)
      let resolvedDeptId = null;
      try {
        resolvedDeptId = await resolveModeratorDept({ userId, email: req.user?.email });
      } catch (e) {
        console.error('complaintsController.listComplaints: error resolving moderator department', e);
      }

      if (!resolvedDeptId) {
        console.warn("complaintsController.listComplaints: moderator department not found after resolution attempts");
        if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
          console.warn('Non-production mode: allowing moderator to fetch all complaints without department filter');
        } else {
          return res.status(403).json({ message: "Moderator's department not found in token or DB" });
        }
      } else {
        filter.department = resolvedDeptId;
      }

      try {
        const mod = await ModeratorUser.findOne({ userId }).select('assignedArea').lean();
        const assignedArea = (mod?.assignedArea || '').trim();
        if (assignedArea) {
          const districtRegex = new RegExp('^' + escapeRegExp(assignedArea) + '$', 'i');
          const locationRegex = new RegExp(escapeRegExp(assignedArea), 'i');
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: [{ district: districtRegex }, { location: locationRegex }] });
        }
      } catch (e) {
        console.error('Error applying moderator district filter:', e);
      }
    } else if (roleLower === 'citizen') {
      if (wantsDistrictScope) {
        const citizen = await Citizen.findOne({ userId }).select('location').lean();
        const citizenDistrict = (citizen?.location || '').trim();

        if (!citizenDistrict) {
          return res.status(400).json({ error: 'Citizen district not set. Please update your profile/location.' });
        }

        const districtRegex = new RegExp('^' + escapeRegExp(citizenDistrict) + '$', 'i');
        const locationRegex = new RegExp(escapeRegExp(citizenDistrict), 'i');
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: [{ district: districtRegex }, { location: locationRegex }] });
      } else {
        filter.userId = userId;
      }
    } else if (roleLower === 'admin' || roleLower === 'administrator') {
      // no extra filter
    } else {
      return res.status(403).json({ message: 'Unauthorized role' });
    }

    const complaints = await Complaint.find(filter)
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: complaints });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const groupByDepartment = async (req, res) => {
  try {
    const { id: userId, role } = req.user || {};
    const roleLower = String(role || '').toLowerCase();

    const match = {};
    if (roleLower === 'moderator') {
      // Attempt to resolve moderator department using centralized resolver
      let resolvedDept = null;
      try {
        const deptId = await resolveModeratorDept({ userId: req.user?.id, email: req.user?.email });
        if (deptId && mongoose.Types.ObjectId.isValid(String(deptId))) resolvedDept = mongoose.Types.ObjectId(String(deptId));
      } catch (e) {
        console.error('Error resolving department in groupByDepartment:', e);
      }
      if (!resolvedDept) {
        return res.status(403).json({ message: "Moderator's department not found in token" });
      }
      match.department = mongoose.Types.ObjectId(resolvedDept);
    } else if (roleLower === 'citizen') {
      match.userId = mongoose.Types.ObjectId(userId);
    } else if (roleLower === 'admin' || roleLower === 'administrator') {
      // no extra filter
    } else {
      return res.status(403).json({ message: 'Unauthorized role' });
    }

    const pipeline = [
      { $match: match },
      { $lookup: { from: 'department', localField: 'department', foreignField: '_id', as: 'department' } },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$department._id', department: { $first: '$department' }, complaints: { $push: '$$ROOT' }, count: { $sum: 1 } } },
      { $sort: { 'department.name': 1 } }
    ];

    let results = await Complaint.aggregate(pipeline).allowDiskUse(true);
    if ((!results || results.length === 0) && match) {
      const pipelineAlt = [
        { $match: match },
        { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'department' } },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$department._id', department: { $first: '$department' }, complaints: { $push: '$$ROOT' }, count: { $sum: 1 } } },
        { $sort: { 'department.name': 1 } }
      ];
      results = await Complaint.aggregate(pipelineAlt).allowDiskUse(true);
    }

    res.json({ data: results });
  } catch (err) {
    console.error('Error grouping complaints by department:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const moderatorView = async (req, res) => {
  try {
    const { role } = req.user || {};
    if (String(role || '').toLowerCase() !== 'moderator') return res.status(403).json({ message: 'Unauthorized' });

    // Resolve department via centralized helper (covers new & legacy moderator docs)
    let resolvedDeptId = null;
    try {
      resolvedDeptId = await resolveModeratorDept({ userId: req.user?.id, email: req.user?.email });
    } catch (e) {
      console.error('Error resolving department in moderatorView:', e);
    }

    if (!resolvedDeptId) return res.status(400).json({ message: "Moderator's department missing" });

      // If the resolved department has a category (e.g., 'Water'), show complaints
      // for all departments that share the same category so moderators for
      // related authorities (e.g., DJB and NDMC water) both see them.
      let deptDoc = null;
      try {
        if (mongoose.Types.ObjectId.isValid(String(resolvedDeptId))) {
          deptDoc = await Department.findById(resolvedDeptId).lean();
        }
      } catch (e) {
        console.error('Error fetching department doc in moderatorView:', e);
      }

      let complaints = [];
      if (deptDoc && deptDoc.category) {
        const relatedDepts = await Department.find({ category: deptDoc.category }).select('_id').lean();
        const deptIds = relatedDepts.map(d => d._id).filter(Boolean);
        if (deptIds.length) {
          complaints = await Complaint.find({ department: { $in: deptIds } }).populate('department').sort({ createdAt: -1 });
        }
      }

      // Fallback to single-department behavior if above did not return results
      if (!complaints || complaints.length === 0) {
        complaints = await Complaint.find({ department: resolvedDeptId }).populate('department').sort({ createdAt: -1 });
      }

      res.json(complaints);
  } catch (error) {
    console.error('Error fetching moderator complaints:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    console.log('[complaintsController.updateStatus] called', { method: req.method, path: req.originalUrl || req.url, params: req.params, bodyKeys: Object.keys(req.body || {}), hasFile: !!req.file });
    const { complaintId } = req.params;
    const { status, moderatorEmail, actionDescription } = req.body;
    const actionPhoto = req.file ? `/uploads/${req.file.filename}` : null;

    const validStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status", providedStatus: status });
    }

    // Resolve moderator: prefer moderatorEmail from form, otherwise use authenticated user info
    let moderator = null;
    const lookupEmail = (moderatorEmail || req.user?.email || '').trim();
    try {
      // Try new moderator collection first
      if (lookupEmail) {
        moderator = await ModeratorUser.findOne({ email: lookupEmail });
      }
      if (!moderator && req.user?.id) {
        moderator = await ModeratorUser.findOne({ userId: req.user.id });
      }
      // Fallback to legacy moderator collection
      if (!moderator && lookupEmail) {
        moderator = await Moderator.findOne({ email: lookupEmail });
      }
      if (!moderator && req.user?.id) {
        moderator = await Moderator.findOne({ userId: req.user.id });
      }
      if (!moderator) {
        console.warn('updateStatus: moderator not found for email/user', { lookupEmail, userId: req.user?.id });
        return res.status(404).json({ message: "Moderator not found" });
      }
    } catch (e) {
      console.error('Error resolving moderator in updateStatus:', e);
      return res.status(500).json({ message: 'Server error resolving moderator' });
    }

    let department = null;
    try {
      const rawField = moderator.department;
      if (!rawField) {
        department = null;
      } else if (typeof rawField === 'object' && rawField._id) {
        department = await Department.findById(rawField._id) || rawField;
      } else {
        const deptField = String(rawField).trim();
        if (mongoose.Types.ObjectId.isValid(deptField)) {
          department = await Department.findById(deptField);
        }
        if (!department && deptField) {
          department = await Department.findOne({ name: deptField });
          if (!department) department = await Department.findOne({ name: new RegExp('^' + escapeRegExp(deptField) + '$', 'i') });
          if (!department) department = await Department.findOne({ name: new RegExp('\\b' + escapeRegExp(deptField) + '\\b', 'i') });
          if (!department) department = await Department.findOne({ name: new RegExp(escapeRegExp(deptField), 'i') });
        }
      }
    } catch (err) {
      console.error('Error resolving moderator department:', err);
    }

    if (!department) {
      return res.status(400).json({ message: "Moderator's department not found", moderator: { id: moderator._id, email: moderator.email, department: moderator.department } });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: "Complaint not found", complaintId });

    if (!complaint.department) {
      complaint.department = department._id;
      await complaint.save();
    }

    if (complaint.department && complaint.department.toString() !== department._id.toString()) {
      // Allow if the complaint's department shares the same category as the moderator's department
      try {
        let compDeptDoc = null;
        if (mongoose.Types.ObjectId.isValid(String(complaint.department))) {
          compDeptDoc = await Department.findById(complaint.department).lean();
        } else if (complaint.department) {
          compDeptDoc = await Department.findOne({ name: String(complaint.department) }).lean();
        }

        const modDeptDoc = department && department._id ? await Department.findById(department._id).lean() : department;

        const compCategory = compDeptDoc?.category && String(compDeptDoc.category).trim();
        const modCategory = modDeptDoc?.category && String(modDeptDoc.category).trim();

        if (!compCategory || !modCategory || compCategory.toLowerCase() !== modCategory.toLowerCase()) {
          return res.status(403).json({ message: "Not authorized to update this complaint (department mismatch)" });
        }
      } catch (err) {
        console.error('Error comparing department categories:', err);
        return res.status(403).json({ message: "Not authorized to update this complaint" });
      }
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    complaint.history = complaint.history || [];
    complaint.history.push({
      status,
      changedBy: moderator._id,
      changedByEmail: moderator.email,
      changedAt: new Date(),
      actionDescription: actionDescription || null,
      actionPhoto: actionPhoto || null
    });

    await complaint.save();

    if (complaint.userId && oldStatus !== status) {
      try {
        const statusMessages = {
          'pending': 'Your complaint is pending review',
          'assigned': 'Your complaint has been assigned to a moderator',
          'in-progress': 'Work has started on your complaint',
          'resolved': 'Your complaint has been resolved',
          'rejected': 'Your complaint has been rejected'
        };
        await Notification.create({
          userId: complaint.userId,
          type: 'status_change',
          title: 'Issue Status Updated',
          message: statusMessages[status] || `Your complaint status changed to ${status}`,
          complaintId: complaint._id,
          metadata: { oldStatus: oldStatus, newStatus: status, moderatorEmail: moderator.email }
        });
      } catch (notifErr) {
        console.error('Error creating notification:', notifErr);
      }
    }

    const populated = await Complaint.findById(complaint._id).populate('assignedTo', 'name email').populate('department', 'name');
    res.json({ message: "Status updated successfully", complaint: populated });
  } catch (error) {
    console.error("Error updating complaint status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const assignComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { moderatorEmail } = req.body;
    if (!moderatorEmail) return res.status(400).json({ message: 'moderatorEmail is required' });

    const moderator = await Moderator.findOne({ email: moderatorEmail });
    if (!moderator) return res.status(404).json({ message: 'Moderator not found' });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const modDept = moderator.department ? moderator.department.toString() : null;
    const compDept = complaint.department ? complaint.department.toString() : null;
    if (modDept && compDept && modDept !== compDept) return res.status(403).json({ message: 'Moderator does not belong to complaint department' });

    complaint.assignedTo = moderator._id;
    await complaint.save();

    moderator.assignedComplaints = moderator.assignedComplaints || [];
    const cid = complaint._id.toString();
    if (!moderator.assignedComplaints.map(String).includes(cid)) {
      moderator.assignedComplaints.push(complaint._id);
      await moderator.save();
    }

    const populated = await Complaint.findById(complaint._id).populate('assignedTo', 'name email').populate('department', 'name');
    res.json({ message: 'Complaint assigned', complaint: populated });
  } catch (err) {
    console.error('Error assigning complaint:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createComplaint = async (req, res) => {
  try {
    const roleLower = String(req.user?.role || '').toLowerCase();
    if (roleLower === 'moderator') return res.status(403).json({ error: 'Moderators are not allowed to file complaints' });

    if (!req.is('multipart/form-data')) return res.status(400).json({ error: "Request must be multipart/form-data" });

    const body = req.body || {};
    const { title, category, description, location, addressLine, landmark, city, district, state, pincode, department: deptBody, userId } = body;

    let departmentUsed = null;
    if (deptBody && mongoose.Types.ObjectId.isValid(String(deptBody))) {
      departmentUsed = String(deptBody);
    } else if (req.user && String(req.user.role || '').toLowerCase() === 'moderator' && req.user.department && mongoose.Types.ObjectId.isValid(String(req.user.department))) {
      departmentUsed = String(req.user.department);
    }

    if (!title || !category || !description || !location || !departmentUsed) return res.status(400).json({ error: "All fields are required (ensure department is provided or moderator creating complaint)" });

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: "Invalid user" });

    const departmentExists = await Department.findById(departmentUsed);
    if (!departmentExists) return res.status(400).json({ error: "Invalid department" });

    const photoPath = req.file ? ("/" + path.relative(process.cwd(), req.file.path).replace(/\\\\/g, '/').replace(/^\/+/, '')) : "";

    const complaint = new Complaint({
      title,
      category,
      description,
      location,
      addressLine,
      landmark,
      city,
      district,
      state,
      pincode,
      department: departmentUsed,
      userId: userId || (req.user?.id ? req.user.id : null),
      photo: photoPath
    });

    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const communityValidate = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { id: userId } = req.user || {};
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!mongoose.Types.ObjectId.isValid(String(complaintId))) return res.status(400).json({ message: 'Invalid complaint id' });

    const noteRaw = typeof req.body?.note === 'string' ? req.body.note : '';
    const trimmedNote = noteRaw.trim().slice(0, 500);

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const validations = complaint.communityValidations || [];
    const existingIndex = validations.findIndex((entry) => entry?.userId && entry.userId.toString() === String(userId));

    if (existingIndex >= 0) {
      validations[existingIndex].note = trimmedNote;
      validations[existingIndex].createdAt = new Date();
    } else {
      validations.push({ userId: new mongoose.Types.ObjectId(String(userId)), note: trimmedNote, createdAt: new Date() });
      if (complaint.userId && complaint.userId.toString() !== String(userId)) {
        try {
          const validator = await Citizen.findOne({ userId }).select('name');
          const validatorName = validator?.name || 'Someone';
          await Notification.create({ userId: complaint.userId, type: 'community_validation', title: 'New Support for Your Issue', message: `${validatorName} supported your complaint "${complaint.title}"`, complaintId: complaint._id, metadata: { validatorName } });
        } catch (notifErr) { console.error('Error creating notification:', notifErr); }
      }
    }

    complaint.communityValidations = validations;
    await complaint.save();

    const refreshed = await Complaint.findById(complaintId).populate('department', 'name').lean();
    res.json({ message: existingIndex >= 0 ? 'Support updated' : 'Support added', data: refreshed });
  } catch (err) {
    console.error('Error recording community validation:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const removeCommunityValidate = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { id: userId } = req.user || {};
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!mongoose.Types.ObjectId.isValid(String(complaintId))) return res.status(400).json({ message: 'Invalid complaint id' });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const before = complaint.communityValidations?.length || 0;
    complaint.communityValidations = (complaint.communityValidations || []).filter((entry) => entry?.userId && entry.userId.toString() !== String(userId));
    if ((complaint.communityValidations?.length || 0) !== before) { await complaint.save(); }

    const refreshed = await Complaint.findById(complaintId).populate('department', 'name').lean();
    res.json({ message: 'Support removed', data: refreshed });
  } catch (err) {
    console.error('Error removing community validation:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const likeComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const userId = req.session?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (!complaint.likes) complaint.likes = [];
    if (!complaint.dislikes) complaint.dislikes = [];

    complaint.dislikes = complaint.dislikes.filter(id => id.toString() !== userId.toString());

    const likeIndex = complaint.likes.findIndex(id => id.toString() === userId.toString());
    if (likeIndex >= 0) {
      complaint.likes.splice(likeIndex, 1);
    } else {
      complaint.likes.push(userId);
      if (complaint.userId && complaint.userId.toString() !== userId.toString()) {
        try {
          const liker = await Citizen.findOne({ userId }).select('name');
          const likerName = liker?.name || 'Someone';
          await Notification.create({ userId: complaint.userId, type: 'community_validation', title: 'Someone Liked Your Issue', message: `${likerName} liked your complaint "${complaint.title}"`, complaintId: complaint._id, metadata: { likerName } });
        } catch (notifErr) { console.error('Error creating notification:', notifErr); }
      }
    }

    await complaint.save();
    const refreshed = await Complaint.findById(complaintId).populate('department', 'name').lean();
    res.json({ message: likeIndex >= 0 ? 'Like removed' : 'Liked successfully', data: refreshed });
  } catch (err) {
    console.error('Error liking complaint:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const dislikeComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const userId = req.session?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (!complaint.likes) complaint.likes = [];
    if (!complaint.dislikes) complaint.dislikes = [];

    complaint.likes = complaint.likes.filter(id => id.toString() !== userId.toString());

    const dislikeIndex = complaint.dislikes.findIndex(id => id.toString() === userId.toString());
    if (dislikeIndex >= 0) {
      complaint.dislikes.splice(dislikeIndex, 1);
    } else {
      complaint.dislikes.push(userId);
    }

    await complaint.save();
    const refreshed = await Complaint.findById(complaintId).populate('department', 'name').lean();
    res.json({ message: dislikeIndex >= 0 ? 'Dislike removed' : 'Disliked successfully', data: refreshed });
  } catch (err) {
    console.error('Error disliking complaint:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(complaintId))) return res.status(400).json({ message: 'Invalid complaint id' });

    const complaint = await Complaint.findById(complaintId).populate('department').lean();
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Find related complaints by category (exclude current)
    const related = await Complaint.find({ category: complaint.category, _id: { $ne: complaint._id } })
      .limit(10)
      .sort({ createdAt: -1 })
      .populate('department', 'name')
      .lean();

    res.json({ complaint, related });
  } catch (err) {
    console.error('Error fetching complaint:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const moderatorByCategory = async (req, res) => {
  try {
    const { role } = req.user || {};
    if (String(role || '').toLowerCase() !== 'moderator') return res.status(403).json({ message: 'Unauthorized' });

    const { complaintId } = req.params;
    let category = String(req.query.category || '').trim();

    if (complaintId) {
      if (!mongoose.Types.ObjectId.isValid(String(complaintId))) return res.status(400).json({ message: 'Invalid complaint id' });
      const base = await Complaint.findById(complaintId).lean();
      if (!base) return res.status(404).json({ message: 'Complaint not found' });
      category = base.category;
    }

    if (!category) return res.status(400).json({ message: 'category (or complaintId) is required' });

    // Find departments matching this category
    const departments = await Department.find({ category }).select('name').lean();
    const deptIds = departments.map(d => d._id).filter(Boolean);

    // If no departments found, respond with empty
    if (!deptIds.length) return res.json({ category, departments: [], complaints: [] });

    // Find complaints whose department is one of these departments
    const complaints = await Complaint.find({ department: { $in: deptIds } })
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ category, departments, complaints });
  } catch (err) {
    console.error('Error in moderatorByCategory:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  getDepartments,
  getDepartmentById,
  listComplaints,
  groupByDepartment,
  moderatorView,
  updateStatus,
  assignComplaint,
  createComplaint,
  communityValidate,
  removeCommunityValidate,
  likeComplaint,
  dislikeComplaint
  ,getComplaint,
  moderatorByCategory
};
