// routes/complaintRoutes.js
import express from "express";
import mongoose from 'mongoose';
import path from 'path';
import multer from 'multer';
import Complaint from "../Models/complaint.js";
import Moderator from "../Models/Moderator.js";
import Department from "../Models/Department.js";

const router = express.Router();

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

// Fetch complaints for citizens dashboard (optionally filter by user, status, department)
router.get("/", async (req, res) => {
  try {
    const { userId, status, department } = req.query;
    const filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.userId = userId;
    if (status) filter.status = status;
    if (department && mongoose.Types.ObjectId.isValid(department)) filter.department = department;

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

router.get("/moderator-view", async (req, res) => {
  try {
    const { email } = req.query; // moderator's email

    if (!email) {
      return res.status(400).json({ message: "Moderator email is required" });
    }

    // find moderator details and populate department
    const mod = await Moderator.findOne({ email }).populate('department');
    if (!mod) {
      return res.status(404).json({ message: "Moderator not found" });
    }

    // get all complaints related to the moderator's department
    const complaints = await Complaint.find({
      department: mod.department._id
    })
    .populate('department')
    .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    console.error("Error fetching moderator complaints:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update complaint status (for moderators)
router.patch("/update-status/:complaintId", async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, moderatorEmail } = req.body;

    console.log('Updating complaint:', { complaintId, status, moderatorEmail });

    // Validate status
    const validStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
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
      console.log('Department not found for moderator:', { moderatorDeptField: moderator.department });
      return res.status(400).json({ message: "Moderator's department not found" });
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
      return res.status(404).json({ message: "Complaint not found" });
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
    if (complaint.department.toString() !== department._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this complaint" });
    }

    // Update complaint status
    complaint.status = status;
    await complaint.save();

    res.json({ message: "Status updated successfully", complaint });
  } catch (error) {
    console.error("Error updating complaint status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new complaint (accept multipart/form-data with `photo` field)
router.post("/", upload.single('photo'), async (req, res) => {
  try {
    // helpful debug info when req.body is unexpectedly undefined
    console.log('Create complaint - Content-Type:', req.headers && req.headers['content-type']);
    if (!req.body) console.log('Create complaint - req.body is undefined or empty');

    if (!req.is('multipart/form-data')) {
      return res.status(400).json({ error: "Request must be multipart/form-data" });
    }

    const body = req.body || {};
    const { title, category, description, location, addressLine, landmark, city, district, state, pincode, department, userId } = body;

    // Validate required fields
    if (!title || !category || !description || !location || !department) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user" });
    }

    // Verify department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(400).json({ error: "Invalid department" });
    }

    // Create complaint
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
      department,
      userId: userId || null,
      photo: req.file ? path.relative(process.cwd(), req.file.path).replace(/\\\\/g,'/') : ""
    });

    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
