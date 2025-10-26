import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Department from '../models/Department.js';
import Moderator from '../models/Moderator.js';
import Complaint from '../models/complaint.js';

const router = express.Router();

router.get('/moderator-view', async (req, res) => {
  try {
    const { department, assignedArea } = req.query;

    const filter = {};
    if (department) filter.category = department; 
    if (assignedArea) filter.location = assignedArea;

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).lean();
    res.json(complaints);
  } catch (err) {
    console.error('GET /moderator-view error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register moderator
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, departmentName } = req.body;

    // Find department by name
    const department = await Department.findOne({ name: departmentName });
    if (!department) {
      return res.status(400).json({ message: "Department not found" });
    }

    // Check if moderator exists
    const existingModerator = await Moderator.findOne({ email });
    if (existingModerator) {
      return res.status(400).json({ message: "Moderator already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create moderator
    const moderator = new Moderator({
      name,
      email,
      password: hashedPassword,
      department: department._id // Store department as ObjectId reference
    });

    await moderator.save();

    res.status(201).json({ message: "Moderator registered successfully" });
  } catch (error) {
    console.error("Error registering moderator:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login moderator
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find moderator and populate department
    const moderator = await Moderator.findOne({ email }).populate('department');
    if (!moderator) {
      return res.status(404).json({ message: "Moderator not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, moderator.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { id: moderator._id, role: 'Moderator' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: moderator._id,
        name: moderator.name,
        email: moderator.email,
        department: moderator.department.name,
        role: 'Moderator'
      }
    });
  } catch (error) {
    console.error("Error logging in moderator:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export { router as default };
