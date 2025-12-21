import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Department from '../Models/Department.js';
import Moderator from '../Models/Moderator.js';
import Complaint from '../Models/complaint.js';

const moderatorView = async (req, res) => {
  try {
    const roleLower = String(req.user?.role || '').toLowerCase();
    if (roleLower !== 'moderator') return res.status(403).json({ message: 'Forbidden' });

    const { department, assignedArea } = req.query;
    const filter = {};
    if (department) filter.category = department;
    if (assignedArea) filter.location = assignedArea;

    const deptFromToken = req.user?.department;
    if (deptFromToken) {
      filter.department = deptFromToken;
    }

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).lean();
    res.json(complaints);
  } catch (err) {
    console.error('moderatorView error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, departmentName } = req.body;

    const department = await Department.findOne({ name: departmentName });
    if (!department) {
      return res.status(400).json({ message: "Department not found" });
    }

    const existingModerator = await Moderator.findOne({ email });
    if (existingModerator) {
      return res.status(400).json({ message: "Moderator already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const moderator = new Moderator({
      name,
      email,
      password: hashedPassword,
      department: department._id
    });

    await moderator.save();

    res.status(201).json({ message: "Moderator registered successfully" });
  } catch (error) {
    console.error("Error registering moderator:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const moderator = await Moderator.findOne({ email }).populate('department');
    if (!moderator) return res.status(404).json({ message: "Moderator not found" });

    const isMatch = await bcrypt.compare(password, moderator.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

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
        department: moderator.department?.name || moderator.department,
        role: 'Moderator'
      }
    });
  } catch (error) {
    console.error("Error logging in moderator:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  moderatorView,
  register,
  login
};
