// routes/complaintRoutes.js
import express from "express";
import mongoose from 'mongoose';
import path from 'path';
import multer from 'multer';
import Complaint from "../models/complaint.js";
import Moderator from "../models/Moderator.js";
import Department from "../models/Department.js";
import { Citizen, Moderator as ModeratorUser } from "../models/User.js";
import Notification from "../Models/Notification.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Multer setup to handle `photo` uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files allowed'), false);
    cb(null, true);
  }
});

// Fetch complaints for the logged-in moderator
// Get all departments
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single department by ID
router.get("/departments/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.json(department);
  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch complaints for citizens dashboard (optionally filter by user, status, department)
router.get("/", auth, async (req, res) => {
  try {
    const { status, department: deptQuery } = req.query;
    const filter = {};

    // apply client-side filters if present
    if (status) filter.status = status;
    if (deptQuery && mongoose.Types.ObjectId.isValid(deptQuery)) filter.department = deptQuery;

    // role-based access control
    const { id: userId, role } = req.user || {};
    const roleLower = String(role || '').toLowerCase();

    const scope = String(req.query.scope || '').toLowerCase();
    const nearby = String(req.query.nearby || '').toLowerCase();
    const wantsDistrictScope = scope === 'district' || scope === 'nearby' || nearby === '1' || nearby === 'true' || nearby === 'yes';

    if (roleLower === 'moderator') {
      // prefer department from JWT (set at login)
      const deptFromToken = req.user.department;
      if (!deptFromToken || !mongoose.Types.ObjectId.isValid(String(deptFromToken))) {
        return res.status(403).json({ message: "Moderator's department not found in token" });
      }
      filter.department = String(deptFromToken);

      // Additionally scope moderators to their assigned area (treated as district/location)
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
        // Non-fatal: if assignedArea isn't configured, fall back to department-only
        console.error('Error applying moderator district filter:', e);
      }
    } else if (roleLower === 'citizen') {
      if (wantsDistrictScope) {
        // Citizens can view complaints in the same district (stored as Citizen.location)
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
        // default: citizens can only view their own complaints
        filter.userId = userId;
      }
    } else if (roleLower === 'admin' || roleLower === 'administrator') {
      // admins may see all complaints -- no extra filter
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
});

// Fetch complaints grouped by department (respects role-based access)
router.get('/by-department', auth, async (req, res) => {
  try {
    const { id: userId, role } = req.user || {};
    const roleLower = String(role || '').toLowerCase();

    const match = {};

    if (roleLower === 'moderator') {
      const deptFromToken = req.user.department;
      if (!deptFromToken || !mongoose.Types.ObjectId.isValid(String(deptFromToken))) {
        return res.status(403).json({ message: "Moderator's department not found in token" });
      }
      match.department = mongoose.Types.ObjectId(String(deptFromToken));
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

    // Note: depending on collection naming, lookup 'departments' might be required. Try both if results empty.
    let results = await Complaint.aggregate(pipeline).allowDiskUse(true);

    // If lookup collection name mismatch, try 'departments'
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
});

router.get("/moderator-view", auth, async (req, res) => {
  try {
    const { role } = req.user || {};
    if (String(role || '').toLowerCase() !== 'moderator') return res.status(403).json({ message: 'Unauthorized' });

    const deptFromToken = req.user.department;
    if (!deptFromToken || !mongoose.Types.ObjectId.isValid(String(deptFromToken))) return res.status(400).json({ message: "Moderator's department missing" });

    const complaints = await Complaint.find({ department: deptFromToken }).populate('department').sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching moderator complaints:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update complaint status (for moderators)
router.patch("/update-status/:complaintId", upload.single('actionPhoto'), async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, moderatorEmail, actionDescription } = req.body;
    const actionPhoto = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('Updating complaint:', { complaintId, status, moderatorEmail });

    // Validate status
    const validStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];
    if (!validStatuses.includes(status)) {
      console.warn('Invalid status provided', { status });
      return res.status(400).json({ message: "Invalid status", providedStatus: status });
    }

    // Find moderator
    const moderator = await Moderator.findOne({ email: moderatorEmail });
    if (!moderator) {
      return res.status(404).json({ message: "Moderator not found" });
    }

    // Helper to safely escape regex
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Resolve moderator's department robustly (ObjectId, exact name, case-insensitive, partial)
    let department = null;
    try {
      const rawField = moderator.department;
      if (!rawField) {
        department = null;
      } else if (typeof rawField === 'object' && rawField._id) {
        // populated object
        department = await Department.findById(rawField._id) || rawField;
      } else {
        const deptField = String(rawField).trim();
        // If it's an ObjectId string
        if (mongoose.Types.ObjectId.isValid(deptField)) {
          department = await Department.findById(deptField);
        }

        // If still not found and deptField is a non-empty string, try matching by name
        if (!department && deptField) {
          // try exact
          department = await Department.findOne({ name: deptField });
          // case-insensitive exact
          if (!department) department = await Department.findOne({ name: new RegExp('^' + escapeRegExp(deptField) + '$', 'i') });
          // word-boundary match (so 'Water' matches 'Water Supply')
          if (!department) department = await Department.findOne({ name: new RegExp('\\b' + escapeRegExp(deptField) + '\\b', 'i') });
          // fallback: substring match
          if (!department) department = await Department.findOne({ name: new RegExp(escapeRegExp(deptField), 'i') });
        }
      }
    } catch (err) {
      console.error('Error resolving moderator department:', err);
    }

    if (!department) {
      console.log('Department not found for moderator:', { moderatorId: moderator._id, moderatorDeptField: moderator.department });
      return res.status(400).json({ message: "Moderator's department not found", moderator: { id: moderator._id, email: moderator.email, department: moderator.department } });
    }

    console.log('Found moderator and department:', {
      moderatorId: moderator._id,
      email: moderator.email,
      department: department.name,
      departmentId: department._id
    });

    // Find complaint
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      console.warn('Complaint not found', { complaintId });
      return res.status(404).json({ message: "Complaint not found", complaintId });
    }

    // If complaint doesn't have a department, assign it to moderator's department
    if (!complaint.department) {
      complaint.department = department._id;
      await complaint.save();
    }

    // For comparison, ensure we're using the department's _id
    const complaintDeptId = complaint.department.toString();
    const moderatorDeptId = department._id.toString();

    console.log('Comparing departments:', {
      complaintDept: complaintDeptId,
      moderatorDept: moderatorDeptId
    });

    // Verify moderator has permission to update this complaint
    if (complaint.department && complaint.department.toString() !== department._id.toString()) {
      console.warn('Moderator department mismatch', { complaintDept: complaint.department?.toString(), moderatorDept: department._id.toString(), moderatorId: moderator._id });
      return res.status(403).json({ message: "Not authorized to update this complaint", complaintDept: complaint.department?.toString(), moderatorDept: department._id.toString() });
    }

    // Update complaint status and append history
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

    // Create notification for complaint owner about status change
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
          metadata: {
            oldStatus: oldStatus,
            newStatus: status,
            moderatorEmail: moderator.email
          }
        });
      } catch (notifErr) {
        console.error('Error creating notification:', notifErr);
      }
    }

    // populate assignedTo and department for response
    const populated = await Complaint.findById(complaint._id).populate('assignedTo', 'name email').populate('department', 'name');

    res.json({ message: "Status updated successfully", complaint: populated });
  } catch (error) {
    console.error("Error updating complaint status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Assign a complaint to a moderator
router.post('/assign/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { moderatorEmail } = req.body;

    if (!moderatorEmail) return res.status(400).json({ message: 'moderatorEmail is required' });

    const moderator = await Moderator.findOne({ email: moderatorEmail });
    if (!moderator) return res.status(404).json({ message: 'Moderator not found' });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Ensure moderator's department matches complaint.department
    const modDept = moderator.department ? moderator.department.toString() : null;
    const compDept = complaint.department ? complaint.department.toString() : null;
    if (modDept && compDept && modDept !== compDept) {
      return res.status(403).json({ message: 'Moderator does not belong to complaint department' });
    }

    // assign
    complaint.assignedTo = moderator._id;
    await complaint.save();

    // add to moderator.assignedComplaints if not present
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
});

// Create new complaint (accept multipart/form-data with `photo` field)
router.post("/", auth, upload.single('photo'), async (req, res) => {
  try {
    // Prevent moderators from filing complaints
    const roleLower = String(req.user?.role || '').toLowerCase();
    if (roleLower === 'moderator') {
      return res.status(403).json({ error: 'Moderators are not allowed to file complaints' });
    }
    // helpful debug info when req.body is unexpectedly undefined
    console.log('Create complaint - Content-Type:', req.headers && req.headers['content-type']);
    if (!req.body) console.log('Create complaint - req.body is undefined or empty');

    if (!req.is('multipart/form-data')) {
      return res.status(400).json({ error: "Request must be multipart/form-data" });
    }

    const body = req.body || {};
    const { title, category, description, location, addressLine, landmark, city, district, state, pincode, department: deptBody, userId } = body;

    // Determine department: prefer provided id, otherwise if moderator use their department from token
    let departmentUsed = null;
    if (deptBody && mongoose.Types.ObjectId.isValid(String(deptBody))) {
      departmentUsed = String(deptBody);
    } else if (req.user && String(req.user.role || '').toLowerCase() === 'moderator' && req.user.department && mongoose.Types.ObjectId.isValid(String(req.user.department))) {
      departmentUsed = String(req.user.department);
    }

    // Validate required fields
    if (!title || !category || !description || !location || !departmentUsed) {
      return res.status(400).json({ error: "All fields are required (ensure department is provided or moderator creating complaint)" });
    }

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user" });
    }

    // Verify department exists
    const departmentExists = await Department.findById(departmentUsed);
    if (!departmentExists) {
      return res.status(400).json({ error: "Invalid department" });
    }

    // Create complaint
    // Normalize stored photo path to begin with a leading slash so clients can
    // easily use it as `http://server${photo}` when rendering images.
    const photoPath = req.file
      ? ("/" + path.relative(process.cwd(), req.file.path).replace(/\\\\/g, '/').replace(/^\/+/, ''))
      : "";

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
});

// Citizens can support a complaint with an optional note
router.post('/:complaintId/community-validate', auth, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { id: userId } = req.user || {};
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!mongoose.Types.ObjectId.isValid(String(complaintId))) {
      return res.status(400).json({ message: 'Invalid complaint id' });
    }

    const noteRaw = typeof req.body?.note === 'string' ? req.body.note : '';
    const trimmedNote = noteRaw.trim().slice(0, 500);

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const validations = complaint.communityValidations || [];
    const existingIndex = validations.findIndex((entry) =>
      entry?.userId && entry.userId.toString() === String(userId)
    );

    if (existingIndex >= 0) {
      validations[existingIndex].note = trimmedNote;
      validations[existingIndex].createdAt = new Date();
    } else {
      validations.push({
        userId: new mongoose.Types.ObjectId(String(userId)),
        note: trimmedNote,
        createdAt: new Date()
      });
      
      // Create notification for complaint owner (only on new validation, not update)
      if (complaint.userId && complaint.userId.toString() !== String(userId)) {
        try {
          const validator = await Citizen.findOne({ userId }).select('name');
          const validatorName = validator?.name || 'Someone';
          
          await Notification.create({
            userId: complaint.userId,
            type: 'community_validation',
            title: 'New Support for Your Issue',
            message: `${validatorName} supported your complaint "${complaint.title}"`,
            complaintId: complaint._id,
            metadata: {
              validatorName: validatorName
            }
          });
        } catch (notifErr) {
          console.error('Error creating notification:', notifErr);
        }
      }
    }

    complaint.communityValidations = validations;
    await complaint.save();

    const refreshed = await Complaint.findById(complaintId)
      .populate('department', 'name')
      .lean();

    res.json({
      message: existingIndex >= 0 ? 'Support updated' : 'Support added',
      data: refreshed
    });
  } catch (err) {
    console.error('Error recording community validation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Allow citizens to withdraw their support
router.delete('/:complaintId/community-validate', auth, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { id: userId } = req.user || {};
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!mongoose.Types.ObjectId.isValid(String(complaintId))) {
      return res.status(400).json({ message: 'Invalid complaint id' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const before = complaint.communityValidations?.length || 0;
    complaint.communityValidations = (complaint.communityValidations || []).filter(
      (entry) => entry?.userId && entry.userId.toString() !== String(userId)
    );

    if ((complaint.communityValidations?.length || 0) !== before) {
      await complaint.save();
    }

    const refreshed = await Complaint.findById(complaintId)
      .populate('department', 'name')
      .lean();

    res.json({ message: 'Support removed', data: refreshed });
  } catch (err) {
    console.error('Error removing community validation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a complaint
router.post('/:complaintId/like', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Initialize arrays if they don't exist
    if (!complaint.likes) complaint.likes = [];
    if (!complaint.dislikes) complaint.dislikes = [];

    // Remove from dislikes if exists
    complaint.dislikes = complaint.dislikes.filter(id => id.toString() !== userId.toString());

    // Toggle like
    const likeIndex = complaint.likes.findIndex(id => id.toString() === userId.toString());
    if (likeIndex >= 0) {
      complaint.likes.splice(likeIndex, 1);
    } else {
      complaint.likes.push(userId);
      
      // Create notification for complaint owner
      if (complaint.userId && complaint.userId.toString() !== userId.toString()) {
        try {
          const liker = await Citizen.findOne({ userId }).select('name');
          const likerName = liker?.name || 'Someone';
          
          await Notification.create({
            userId: complaint.userId,
            type: 'community_validation',
            title: 'Someone Liked Your Issue',
            message: `${likerName} liked your complaint "${complaint.title}"`,
            complaintId: complaint._id,
            metadata: { likerName }
          });
        } catch (notifErr) {
          console.error('Error creating notification:', notifErr);
        }
      }
    }

    await complaint.save();

    const refreshed = await Complaint.findById(complaintId)
      .populate('department', 'name')
      .lean();

    res.json({ 
      message: likeIndex >= 0 ? 'Like removed' : 'Liked successfully', 
      data: refreshed 
    });
  } catch (err) {
    console.error('Error liking complaint:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dislike a complaint
router.post('/:complaintId/dislike', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Initialize arrays if they don't exist
    if (!complaint.likes) complaint.likes = [];
    if (!complaint.dislikes) complaint.dislikes = [];

    // Remove from likes if exists
    complaint.likes = complaint.likes.filter(id => id.toString() !== userId.toString());

    // Toggle dislike
    const dislikeIndex = complaint.dislikes.findIndex(id => id.toString() === userId.toString());
    if (dislikeIndex >= 0) {
      complaint.dislikes.splice(dislikeIndex, 1);
    } else {
      complaint.dislikes.push(userId);
    }

    await complaint.save();

    const refreshed = await Complaint.findById(complaintId)
      .populate('department', 'name')
      .lean();

    res.json({ 
      message: dislikeIndex >= 0 ? 'Dislike removed' : 'Disliked successfully', 
      data: refreshed 
    });
  } catch (err) {
    console.error('Error disliking complaint:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
