import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { User, Citizen, Moderator } from './models/User.js';

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(
  "mongodb+srv://23103353:7IsNRgudMU2RHYI3@samaajcluster.povs5dk.mongodb.net/samaaj",
  { useNewUrlParser: true, useUnifiedTopology: true }
).then(() => console.log("MongoDB connected"))
 .catch(err => console.error("MongoDB connection error:", err));

app.post('/signup', async (req, res) => {
  try {
    const { role, name, email, password, location, issueCategory, department, assignedArea } = req.body;
    // Save common fields to User
    const user = await User.create({ name, email, password, role });

    // Save all fields (common + specific) to role-specific collection
    if (role === 'Citizen') {
      await Citizen.create({
        userId: user._id,
        name,
        email,
        password,
        role,
        location,
        issueCategory
      });
    } else if (role === 'Moderator') {
      await Moderator.create({
        userId: user._id,
        name,
        email,
        password,
        role,
        department,
        assignedArea
      });
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => {   
  console.log("Server is running on port 3000");
});


//login backend code
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // Check password (in production, use hashed passwords!)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // Success: send user info (never send password in real apps)
    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});