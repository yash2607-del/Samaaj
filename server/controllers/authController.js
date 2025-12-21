import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Citizen, Moderator } from '../Models/User.js';
import LegacyModerator from '../Models/Moderator.js';
import Department from '../Models/Department.js';
import resolveModeratorDept from '../utils/resolveModeratorDept.js';

const signup = async (req, res) => {
  try {
    const { role, name, email, password, location, department, assignedArea } = req.body;
    if (!role || !name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    let deptIdForToken = null;
    if (role === 'Citizen') {
      await Citizen.create({ userId: user._id, name, email, password: hashedPassword, role, location });
    } else if (role === 'Moderator') {
      let deptId = null;
      if (department) {
        const deptStr = String(department).trim();
        if (mongoose.Types.ObjectId.isValid(deptStr)) {
          const d = await Department.findById(deptStr);
          if (d) deptId = d._id;
        }
        if (!deptId) {
          const d = await Department.findOne({ name: new RegExp('^' + deptStr.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '$', 'i') });
          if (d) deptId = d._id;
        }
      }

      await Moderator.create({ userId: user._id, name, email, password: hashedPassword, role, department: deptId, assignedArea });
      // fetch created moderator and populate department so we can return it and set session
      try {
        const createdMod = await Moderator.findOne({ userId: user._id }).select('-password').populate('department');
        if (createdMod && createdMod.department) {
          deptIdForToken = String(createdMod.department._id || createdMod.department);
        }
        if (!req.session) req.session = {};
        req.session.user = { id: String(user._id), role: user.role, email: user.email };
        if (deptIdForToken) req.session.user.department = deptIdForToken;
        req.session.userId = String(user._id);
        // include populated department in response
        if (createdMod) {
          userRes.department = createdMod.department || null;
        }
      } catch (e) {
        // ignore
      }
    }

    const tokenPayload = { id: user._id, role: user.role, email: user.email };
    if (deptIdForToken) tokenPayload.department = deptIdForToken;
    console.log('authController.signup: signing token payload', tokenPayload);
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

    const userRes = { id: user._id, role: user.role, name: user.name, email: user.email };
    if (deptIdForToken) userRes.department = deptIdForToken;

    return res.status(201).json({ message: 'User created successfully', token, user: userRes });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    let deptForToken = null;
    if (user.role === 'Moderator') {
      let mod = await Moderator.findOne({ userId: user._id }).select('department').populate('department', 'name');
      if (!mod) {
        try {
          mod = await LegacyModerator.findOne({ email: user.email }).select('department').lean();
        } catch (e) {
          console.error('Error checking legacy moderator for department fallback:', e);
        }
      }
      if (mod && mod.department) deptForToken = String(mod.department._id || mod.department);
    }

    const tokenPayload = { id: user._id, role: user.role, email: user.email };
    // Ensure session user is set for session-based auth
    if (!req.session) req.session = {};
    req.session.user = { id: String(user._id), role: user.role, email: user.email };
    req.session.userId = String(user._id);
    if (deptForToken) {
      tokenPayload.department = deptForToken;
      req.session.user.department = deptForToken;
    }

    const userRes = { id: user._id, role: user.role, name: user.name, email: user.email };
    if (deptForToken) userRes.department = deptForToken;

    console.log('authController.login: signing token payload', tokenPayload);
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({ message: 'Login successful', user: userRes, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const logout = (req, res) => {
  if (!req.session) return res.status(200).json({ message: 'No active session' });
  req.session.destroy(err => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out' });
  });
};

const getProfile = async (req, res) => {
  try {
    const { id, role } = req.user;
    let userData;
    const roleLower = String(role || '').toLowerCase();
      if (roleLower === 'citizen') {
        userData = await Citizen.findOne({ userId: id }).select('-password');
      } else if (roleLower === 'moderator') {
          // populate full department document so client gets all details
          userData = await Moderator.findOne({ userId: id }).select('-password').populate('department');
          // if moderator doc exists but department is missing, try to resolve from legacy/new collections
          if (userData && !userData.department) {
            try {
              const resolvedDeptId = await resolveModeratorDept({ userId: id, email: req.user?.email || userData.email });
              if (resolvedDeptId) {
                const deptDoc = await Department.findById(String(resolvedDeptId)).lean();
                if (deptDoc) userData.department = deptDoc;
              }
            } catch (e) {
              console.error('Error resolving moderator department for profile:', e && e.message);
            }
          }
    }
    // If role-specific document missing, fall back to basic User record
    if (!userData) {
      try {
        const basic = await User.findById(id).select('-password').lean();
        if (!basic) return res.status(404).json({ error: 'User not found' });
        // Regardless of the `User.role` field, prefer returning a moderator document if one exists
        try {
          const mod = await Moderator.findOne({ userId: id }).select('-password').populate('department').lean();
          if (mod) return res.json({ user: mod });
        } catch (e) {
          console.error('Error fetching moderator doc for profile fallback:', e && e.message);
        }
        return res.json({ user: basic });
      } catch (err) {
        console.error('Error fetching basic user as fallback:', err);
        return res.status(404).json({ error: 'User not found' });
      }
    }

    res.json({ user: userData });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, location } = req.body;
    if (req.user.id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const user = await User.findByIdAndUpdate(userId, { name, email }, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const roleLower = String(user.role || '').toLowerCase();
    let roleSpecificUser;
      if (roleLower === 'citizen') {
        roleSpecificUser = await Citizen.findOneAndUpdate({ userId }, { name, email, location }, { new: true, runValidators: true }).select('-password');
      } else if (roleLower === 'moderator') {
        // return updated moderator record with populated department
        roleSpecificUser = await Moderator.findOneAndUpdate({ userId }, { name, email }, { new: true, runValidators: true }).select('-password').populate('department');
    }

    res.json({ message: 'Profile updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role, location: roleSpecificUser?.location } });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: err.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    if (req.user.id !== userId) return res.status(403).json({ error: 'Unauthorized' });
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing required fields' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    const roleLower = String(user.role || '').toLowerCase();
    if (roleLower === 'citizen') {
      await Citizen.findOneAndUpdate({ userId }, { password: hashedPassword });
    } else if (roleLower === 'moderator') {
      await Moderator.findOneAndUpdate({ userId }, { password: hashedPassword });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: err.message });
  }
};

export default { signup, login, logout, getProfile, updateProfile, updatePassword };
