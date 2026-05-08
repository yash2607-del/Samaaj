import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Complaint from '../models/complaint.js';
import Moderator from '../models/Moderator.js';
import Department from '../models/Department.js';
import { User, Citizen, Moderator as ModeratorUser } from '../models/User.js';
import resolveModeratorDept from '../utils/resolveModeratorDept.js';
import Notification from '../models/Notification.js';
import notifyOnComplaintCreate from '../utils/notifyOnComplaintCreate.js';
import { assertComplaintImageContext, isMeaninglessText } from '../services/ml/mlImageValidation.js';
import crypto from 'crypto';

const generateImageHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ACCEPTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);


const toMlReviewStatus = (decision, reportTag, trustScore = 1.0) => {
  const d = String(decision || '').trim().toLowerCase();
  const t = String(reportTag || '').trim().toLowerCase();
  
  if (t === 'duplicate') return 'Duplicate';
  
  if (d === 'verified') return 'Verified by AI';
  if (d === 'quarantined') return 'Flagged for Manual Check';
  
  return 'Submitted for Review';
};

const safelyDeleteUploadedFile = async (filePath) => {
  try {
    if (!filePath) return;
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.warn('Failed to remove uploaded file:', filePath, error?.message || error);
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Removed sanitizePhotoFields to prevent data loss on ephemeral storage (Vercel)


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

    let complaints = await Complaint.find(filter)
      .populate('department', 'name')
      .sort({ trustScore: 1, createdAt: -1 })
      .lean();

    // sanitizePhotoFields removed to preserve DB paths

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
          complaints = await Complaint.find({ 
            department: { $in: deptIds },
            reportTag: { $ne: 'quarantined' }
          }).populate('department').sort({ trustScore: 1, createdAt: -1 });
        }
      }

      // Fallback to single-department behavior if above did not return results
      if (!complaints || complaints.length === 0) {
        complaints = await Complaint.find({ 
          department: resolvedDeptId,
          reportTag: { $ne: 'quarantined' }
        }).populate('department').sort({ trustScore: 1, createdAt: -1 });
      }

      // Debug: log photo paths returned to moderators to diagnose missing images
      try {
        console.debug('moderatorView: returning complaints count=', (complaints || []).length);
        console.debug('moderatorView: photo paths sample=', (complaints || []).slice(0,20).map(c => c.photo));
      } catch (e) {
        /* ignore logging errors */
      }

      // sanitize photos before sending
      // sanitizePhotos removed to preserve DB paths

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
    const actionPhoto = req.file ? `data:${req.file.mimetype};base64,${fs.readFileSync(req.file.path).toString('base64')}` : null;
    if (req.file) await safelyDeleteUploadedFile(req.file.path);


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

    const populated = await Complaint.findById(complaint._id).populate('assignedTo', 'name email').populate('department', 'name').lean();
    // sanitizePhotoFields removed

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

    // Create notifications: notify the assigned moderator (if linked to a user account)
    try {
      // Try to find the new-style Moderator user doc to get a `userId` ref
      const modUser = await ModeratorUser.findOne({ email: moderatorEmail });
      if (modUser && modUser.userId) {
        try {
          await Notification.create({
            userId: modUser.userId,
            type: 'assignment',
            title: 'New Assignment',
            message: `You have been assigned the complaint "${complaint.title}"`,
            complaintId: complaint._id,
            metadata: { moderatorName: modUser.name }
          });
        } catch (notifErr) {
          console.error('Error creating assignment notification for moderator:', notifErr);
        }
      }

      // Notify the complaint owner that their complaint was assigned
      if (complaint.userId) {
        const moderatorDisplayName = (modUser && modUser.name) || moderatorEmail || 'a moderator';
        try {
          await Notification.create({
            userId: complaint.userId,
            type: 'assignment',
            title: 'Your Issue Was Assigned',
            message: `Your complaint "${complaint.title}" was assigned to ${moderatorDisplayName}`,
            complaintId: complaint._id,
            metadata: { moderatorName: moderatorDisplayName }
          });
        } catch (notifErr) {
          console.error('Error creating assignment notification for complaint owner:', notifErr);
        }
      }
    } catch (err) {
      console.error('Error while creating assignment notifications:', err);
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
    const effectiveUserId = userId || req.user?.id;

    // Abuse Control: Check if user is temporarily blocked
    if (effectiveUserId) {
      const user = await User.findById(effectiveUserId);
      if (user && user.blockedUntil && user.blockedUntil > new Date()) {
        return res.status(403).json({ 
          error: "Too many invalid reports. Please try again later.",
          blockedUntil: user.blockedUntil
        });
      }
    }

    let departmentUsed = null;
    if (deptBody && mongoose.Types.ObjectId.isValid(String(deptBody))) {
      departmentUsed = String(deptBody);
    } else if (category) {
      // Proactively resolve department by category to fix 400 errors for citizens
      const matchedDept = await Department.findOne({ category: new RegExp('^' + escapeRegExp(category) + '$', 'i') }).select('_id');
      if (matchedDept) departmentUsed = matchedDept._id;
    }

    if (!title || !category || !location || !departmentUsed) return res.status(400).json({ error: "All fields are required (ensure department is provided)" });
    if (!req.file) return res.status(400).json({ error: 'Photo is required' });

    const uploadMime = String(req.file.mimetype || '').toLowerCase();
    if (!ACCEPTED_IMAGE_MIME_TYPES.has(uploadMime)) {
      await safelyDeleteUploadedFile(req.file.path);
      return res.status(400).json({
        error: 'Only JPG, PNG, WEBP, HEIC, or HEIF images are allowed.'
      });
    }

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: "Invalid user" });

    const departmentExists = await Department.findById(departmentUsed);
    if (!departmentExists) return res.status(400).json({ error: "Invalid department" });

    let validationResult;
    try {
      validationResult = await assertComplaintImageContext({
        imagePath: req.file.path,
        originalName: req.file.originalname,
        category,
        title,
        description
      });
    } catch (mlError) {
      console.error('ML validation failed:', mlError);
      await safelyDeleteUploadedFile(req.file.path);
      const mlDetail = mlError?.response?.data?.detail || mlError?.response?.data?.error || mlError?.message;
      return res.status(503).json({
        error: `Image validation service unavailable. ${mlDetail ? `Details: ${mlDetail}` : 'Please try again in a moment.'}`,
        retryable: true
      });
    }

    // Allow even irrelevant/non-ideal results to proceed to the creation phase
    // where they will be marked as 'Rejected' internally but given a soft UX message.
    if (!validationResult.ok || validationResult.reportTag === 'irrelevant') {
      console.warn(`[ML Validation] Non-ideal result: ${validationResult.reason}. Proceeding with soft flagging.`);
    }

    // Convert image to Base64 for persistent storage on Vercel
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
    const photoPath = base64Image;
    
    const imageHash = await generateImageHash(req.file.path);
    const imageSource = String(body.imageSource || 'gallery').toLowerCase();
    
    // Clean up temporary file immediately
    await safelyDeleteUploadedFile(req.file.path);

    
    // 1. Spam Detection: Meaningless Text
    let reportTag = validationResult.reportTag || 'clean';
    if (isMeaninglessText(title) || isMeaninglessText(description)) {
      reportTag = 'spam';
    }

    // Abuse Control: Track Invalid (Quarantined) Reports within 24h
    if (effectiveUserId) {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const invalidReportsCount = await Complaint.countDocuments({
        userId: effectiveUserId,
        reportTag: 'quarantined',
        createdAt: { $gte: last24h }
      });

      if (reportTag === 'quarantined' || validationResult.reportTag === 'quarantined') {
        const totalInvalid = invalidReportsCount + 1;
        
        if (totalInvalid >= 10) {
          const blockDuration = 6 * 60 * 60 * 1000; // 6 hours
          await User.findByIdAndUpdate(effectiveUserId, { 
            blockedUntil: new Date(Date.now() + blockDuration) 
          });
          console.warn(`User ${effectiveUserId} blocked for 6h due to 10+ invalid reports.`);
        } else if (totalInvalid >= 5) {
          // Implicit stricter rate limit: mark as spam to trigger penalties
          reportTag = 'spam'; 
        }
        
        // Attachment of warning for frontend (if needed)
        res.setHeader('X-Abuse-Warning', totalInvalid >= 3 ? 'true' : 'false');
      }
    }

    // 2. Spam Detection: Rapid repeated submissions (last 5 mins)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCount = await Complaint.countDocuments({
      userId: userId || req.user?.id,
      createdAt: { $gte: fiveMinsAgo }
    });
    if (recentCount >= 3) reportTag = 'spam';

    // 3. Duplicate Detection Logic (Last 48 Hours)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentComplaints = await Complaint.find({
      createdAt: { $gte: fortyEightHoursAgo }
    }).select('imageHash _id');

    let isDuplicate = false;
    let duplicateOf = null;

    if (imageHash) {
      const hammingDistance = (h1, h2) => {
        if (!h1 || !h2 || h1.length !== h2.length) return 99;
        let dist = 0;
        let s1 = BigInt("0x" + h1).toString(2).padStart(64, '0');
        let s2 = BigInt("0x" + h2).toString(2).padStart(64, '0');
        for (let i = 0; i < 64; i++) {
          if (s1[i] !== s2[i]) dist++;
        }
        return dist;
      };

      for (const comp of recentComplaints) {
        if (comp.imageHash && hammingDistance(imageHash, comp.imageHash) <= 6) { // ~90% similarity
          isDuplicate = true;
          duplicateOf = comp._id;
          break;
        }
      }
    }

    // Trust Scoring Engine (Aligned with ML service + Duplicate penalty)
    let trustScore = Number(validationResult.trustScore) || 0.5;
    if (isDuplicate) {
      trustScore = Math.max(0, trustScore - 0.3);
    }
    trustScore = Math.max(0, Math.min(1, trustScore));

    const mlDecision = String(validationResult?.decision || '').trim().toLowerCase();
    const mlReviewStatus = toMlReviewStatus(mlDecision, isDuplicate ? 'duplicate' : reportTag, trustScore);
    
    let initialStatus = "Pending";
    if (isDuplicate) {
      reportTag = 'duplicate';
      initialStatus = "Duplicate";
    }

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
      photo: photoPath,
      imageHash,
      imageSource,
      reportTag,
      isDuplicate,
      duplicateOf,
      trustScore,
      
      // Observability
      cnnLabel: validationResult.cnnLabel,
      cnnConfidence: validationResult.cnnConfidence,
      pretrainedLabel: validationResult.pretrainedLabel,
      pretrainedConfidence: validationResult.pretrainedConfidence,
      contextLabel: validationResult.contextLabel,
      aiExplanation: validationResult.aiExplanation,

      aiDecision: mlDecision,
      aiConfidence: Number(validationResult.confidence) || 0,
      modelAgreement: validationResult.modelAgreement || false,
      mlPrediction: validationResult.prediction,
      mlConfidence: Number(validationResult.confidence) || 0,
      mlDecision,
      mlReviewStatus,
      status: initialStatus,
      mlModelOutputs: validationResult?.modelOutputs || null
    });

    await complaint.save();

    // 5. Behavioral Spam Layer & Smart Blocking
    if (effectiveUserId) {
      // Track user as flagged if they submit many quarantined/irrelevant reports
      if (reportTag === 'quarantined' || reportTag === 'irrelevant') {
        const user = await User.findById(effectiveUserId);
        const totalInvalid = (user.quarantinedReportsCount || 0) + 1;
        
        const updateFields = { $inc: { quarantinedReportsCount: 1 } };
        if (totalInvalid >= 10) {
          updateFields.isFlagged = true;
          // Temporary 24-hour restriction
          updateFields.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
          console.warn(`User ${effectiveUserId} auto-blocked for 24h due to 10+ quarantined reports.`);
        }
        await User.findByIdAndUpdate(effectiveUserId, updateFields);
      }
    }

    await notifyOnComplaintCreate({ complaint });
    
    const responseData = {
        ...complaint.toObject(),
        aiExplanation: validationResult.aiExplanation
    };

    // UX BEHAVIOR: Soft messages
    if (isDuplicate) {
      return res.status(201).json({
        ...responseData,
        message: "Report submitted successfully. Similar issue already reported; marked for review."
      });
    }

    if (reportTag === 'quarantined' || reportTag === 'irrelevant') {
       return res.status(201).json({
          ...responseData,
          message: "Report submitted successfully. Image may not clearly represent an issue. Our team will review it."
       });
    }

    if (mlDecision === 'needs_review' || trustScore < 0.4) {
      return res.status(201).json({
        ...responseData,
        message: "Report submitted successfully. Marked for manual review."
      });
    }
    
    res.status(201).json({
      ...responseData,
      message: "Report submitted successfully."
    });
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const validateComplaintImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Photo is required for validation' });

    const uploadMime = String(req.file.mimetype || '').toLowerCase();
    if (!ACCEPTED_IMAGE_MIME_TYPES.has(uploadMime)) {
      return res.status(400).json({
        error: 'Only JPG, PNG, WEBP, HEIC, or HEIF images are allowed.'
      });
    }

    const body = req.body || {};
    const { category, title, description } = body;

    if (!category) {
      return res.status(400).json({ error: 'Category is required for image validation' });
    }

    let validationResult;
    try {
      validationResult = await assertComplaintImageContext({
        imagePath: req.file.path,
        originalName: req.file.originalname,
        category,
        title,
        description
      });
    } catch (mlError) {
      console.error('ML pre-validation failed:', mlError);
      const mlDetail = mlError?.response?.data?.detail || mlError?.response?.data?.error || mlError?.message;
      return res.status(503).json({
        error: `Image validation service unavailable. ${mlDetail ? `Details: ${mlDetail}` : 'Please try again.'}`,
        retryable: true
      });
    }

    if (!validationResult.ok) {
      if (validationResult.reason === 'unclear') {
        return res.json({
          valid: false,
          reason: validationResult.reason,
          prediction: validationResult.prediction,
          message: 'Unable to verify this photo as a civic issue. Please upload a clearer, closer image of the issue.'
        });
      }

      if (validationResult.reason === 'low_confidence') {
        return res.json({
          valid: false,
          reason: validationResult.reason,
          prediction: validationResult.prediction,
          message: 'Unable to verify this photo reliably. Please upload a clearer, closer image of the issue.'
        });
      }

      if (validationResult.reason === 'ambiguous_prediction') {
        return res.json({
          valid: false,
          reason: validationResult.reason,
          prediction: validationResult.prediction,
          confidence: validationResult.confidence,
          message: 'Image appears unrelated or ambiguous for civic issues. Please upload a focused issue photo.'
        });
      }

      if (validationResult.reason === 'unstable_prediction') {
        return res.json({
          valid: false,
          reason: validationResult.reason,
          prediction: validationResult.prediction,
          confidence: validationResult.confidence,
          message: 'Image prediction is unstable across checks. Please upload a clearer, focused issue photo from a closer angle.'
        });
      }

      if (validationResult.reason === 'issue_mismatch') {
        const expected = Array.isArray(validationResult.expectedIssues) && validationResult.expectedIssues.length > 0
          ? validationResult.expectedIssues.join(', ')
          : category;
        return res.json({
          valid: false,
          reason: validationResult.reason,
          prediction: validationResult.prediction,
          message: `Image does not match complaint context. Expected: ${expected}; detected: ${validationResult.prediction}.`
        });
      }

      return res.json({
        valid: false,
        reason: validationResult.reason,
        prediction: validationResult.prediction,
        message: `Image does not match selected category \"${category}\" (detected \"${validationResult.prediction}\").`
      });
    }

    const decision = String(validationResult?.decision || '').trim().toLowerCase();
    const reviewStatus = toMlReviewStatus(decision);

    return res.json({
      valid: true,
      prediction: validationResult.prediction,
      decision,
      reviewStatus,
      message: decision && decision !== 'verified'
        ? 'Possible issue detected, marked for review'
        : 'Image matches complaint context'
    });
  } catch (error) {
    console.error('Error validating complaint image:', error);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    await safelyDeleteUploadedFile(req.file?.path);
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

const deleteComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const userId = req.user?.id || req.user?._id;

    console.log(`[DeleteComplaint] Request to delete ${complaintId} by user ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({ message: "Invalid complaint ID" });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      console.warn(`[DeleteComplaint] Complaint ${complaintId} not found`);
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Citizen side: Only owner can delete
    const ownerId = String(complaint.userId || '');
    const requesterId = String(userId || '');

    if (!requesterId || ownerId !== requesterId) {
      console.warn(`[DeleteComplaint] Unauthorized delete attempt. Owner: ${ownerId}, Requester: ${requesterId}`);
      return res.status(403).json({ message: "Unauthorized: You can only delete your own reports" });
    }

    // Delete photo from disk
    if (complaint.photo) {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const serverRoot = path.join(__dirname, '..'); // Up one level from server/controllers to server
      const photoPath = path.join(serverRoot, complaint.photo.startsWith('/') ? complaint.photo.slice(1) : complaint.photo);
      console.log(`[DeleteComplaint] Attempting to delete file: ${photoPath}`);
      await safelyDeleteUploadedFile(photoPath);
    }

    await Complaint.findByIdAndDelete(complaintId);
    console.log(`[DeleteComplaint] Success: Deleted ${complaintId}`);
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("[DeleteComplaint] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * AI Feedback Loop (recruiter-ready)
 * Allows moderators to correct labels and mark if the model was correct.
 */
const submitAiFeedback = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { isModelCorrect, correctedLabel } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({ message: "Invalid complaint ID" });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        isModelCorrect,
        correctedLabel,
        // If corrected, we might want to update the category/prediction internally too
        mlPrediction: isModelCorrect ? complaint.mlPrediction : correctedLabel
      },
      { new: true }
    );

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    res.json({ message: "Feedback submitted. AI improved.", complaint });
  } catch (err) {
    console.error("Error in submitAiFeedback:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Analytics & Heatmap Aggregation
 */
const getHeatmapStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: { reportTag: { $ne: 'quarantined' } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgTrust: { $avg: "$trustScore" },
          locations: { $push: "$location" }
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    console.error("Error in heatmap stats:", err);
    res.status(500).json({ message: "Server error" });
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
  validateComplaintImage,
  createComplaint,
  communityValidate,
  removeCommunityValidate,
  likeComplaint,
  dislikeComplaint,
  getComplaint,
  moderatorByCategory,
  deleteComplaint,
  submitAiFeedback,
  getHeatmapStats
};
