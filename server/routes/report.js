import express from "express";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Complaint from "../models/complaint.js";
import Department from "../models/Department.js";
import auth from "../middleware/auth.js";
import notifyOnComplaintCreate from "../utils/notifyOnComplaintCreate.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, "..");
const uploadsDir = path.join(serverRoot, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

const issueToCategoryMap = {
  potholes: "Road",
  road_cracks: "Road",
  road_blockage: "Road",
  trash_pile: "Sanitization",
  overflowing_bin: "Sanitization",
  construction_waste: "Sanitization",
  drain_overflow: "Sanitization",
  waterlogging: "Water",
  water_leakage: "Water",
  broken_electric_pole: "Electricity",
  fallen_pole: "Electricity",
  exposed_wires: "Electricity",
  streetlight_issue: "Electricity"
};

const categoryFallbackOrder = ["Road", "Sanitization", "Water", "Electricity", "Public Safety", "Other"];

async function resolveDepartmentFromPrediction(predictedIssue) {
  const mappedCategory = issueToCategoryMap[predictedIssue] || "Other";

  let department = await Department.findOne({ category: mappedCategory, isActive: true }).sort({ name: 1 }).lean();
  if (department) {
    return { departmentId: department._id, category: mappedCategory };
  }

  for (const fallbackCategory of categoryFallbackOrder) {
    department = await Department.findOne({ category: fallbackCategory, isActive: true }).sort({ name: 1 }).lean();
    if (department) {
      return { departmentId: department._id, category: fallbackCategory };
    }
  }

  return { departmentId: null, category: mappedCategory };
}

router.post("/", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Photo upload is required" });
    }

    const imagePath = path.join(uploadsDir, req.file.filename);
    const formData = new FormData();
    formData.append("file", fs.createReadStream(imagePath), req.file.originalname || req.file.filename);

    let predictionResponse;
    try {
      predictionResponse = await axios.post(`${ML_SERVICE_URL}/predict`, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        timeout: 15000
      });
    } catch (serviceError) {
      const detail = serviceError?.response?.data || serviceError.message;
      return res.status(502).json({ message: "ML service unavailable", detail });
    }

    const { prediction, confidence } = predictionResponse.data || {};
    if (!prediction || typeof confidence !== "number") {
      return res.status(502).json({ message: "Invalid response from ML service" });
    }

    const { title, description, location, addressLine, landmark, city, district, state, pincode } = req.body || {};

    if (!title || !location) {
      return res.status(400).json({ message: "title and location are required" });
    }

    const { departmentId, category } = await resolveDepartmentFromPrediction(prediction);
    if (!departmentId) {
      return res.status(400).json({ message: "No department found to assign predicted issue" });
    }

    const complaint = await Complaint.create({
      title,
      description: description || "",
      location,
      addressLine: addressLine || "",
      landmark: landmark || "",
      city: city || "",
      district: district || "",
      state: state || "",
      pincode: pincode || "",
      category,
      department: departmentId,
      userId: req.user?.id || null,
      photo: `/uploads/${req.file.filename}`,
      mlPrediction: prediction,
      mlConfidence: confidence
    });

    await notifyOnComplaintCreate({ complaint });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("department", "name category")
      .lean();

    return res.status(201).json({
      message: "Complaint created with ML prediction",
      prediction,
      confidence,
      complaint: populatedComplaint
    });
  } catch (error) {
    console.error("Error in /api/report:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
