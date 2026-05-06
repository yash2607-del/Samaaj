import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Complaint from "../models/complaint.js";
import Department from "../models/Department.js";
import auth from "../middleware/auth.js";
import notifyOnComplaintCreate from "../utils/notifyOnComplaintCreate.js";
import { assertComplaintImageContext } from '../services/ml/mlImageValidation.js';

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

const ACCEPTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

const toMlReviewStatus = (decision) => {
  const d = String(decision || '').trim().toLowerCase();
  if (d === 'verified') return 'Verified by AI';
  if (d === 'needs_review') return 'Submitted for Review';
  if (d === 'quarantined' || d === 'unclear') return 'Flagged for Manual Check';
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

    const uploadMime = String(req.file.mimetype || '').toLowerCase();
    if (!ACCEPTED_IMAGE_MIME_TYPES.has(uploadMime)) {
      await safelyDeleteUploadedFile(req.file.path);
      return res.status(400).json({ message: 'Only JPG, PNG, WEBP, HEIC, or HEIF images are allowed.' });
    }

    const { title, description, location, addressLine, landmark, city, district, state, pincode } = req.body || {};

    if (!title || !location) {
      await safelyDeleteUploadedFile(req.file.path);
      return res.status(400).json({ message: "title and location are required" });
    }

    const imagePath = path.join(uploadsDir, req.file.filename);

    let validationResult;
    try {
      validationResult = await assertComplaintImageContext({
        imagePath,
        originalName: req.file.originalname || req.file.filename,
        category: req.body.category || 'Other', // report.js doesn't strictly require category in req.body, so default to Other
        title,
        description: description || ""
      });
    } catch (serviceError) {
      await safelyDeleteUploadedFile(req.file.path);
      const detail = serviceError?.response?.data || serviceError.message;
      return res.status(502).json({ message: "ML service unavailable", detail });
    }

    if (!validationResult.ok) {
      await safelyDeleteUploadedFile(req.file.path);
      return res.status(400).json({ 
        message: validationResult.reportTag === 'quarantined' 
          ? 'Image appears unrelated or ambiguous for civic issue detection. Please upload a focused photo.'
          : 'Image is unclear for reliable verification. Please upload a clearer image.' 
      });
    }

    const { prediction, confidence, decision, modelOutputs, trustScore, reportTag, isDuplicate } = validationResult;
    const mlDecision = String(decision || '').trim().toLowerCase();
    const mlReviewStatus = toMlReviewStatus(mlDecision);

    const { departmentId, category } = await resolveDepartmentFromPrediction(prediction);
    if (!departmentId) {
      await safelyDeleteUploadedFile(req.file.path);
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
      imageHash: validationResult.imageHash,
      mlPrediction: prediction,
      mlConfidence: Number(confidence) || 0,
      mlDecision,
      mlReviewStatus,
      reportTag: reportTag || 'clean',
      trustScore: Number(trustScore) || 0.5,
      mlModelOutputs: modelOutputs || null
    });

    await notifyOnComplaintCreate({ complaint });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("department", "name category")
      .lean();

    // Soft UX Behavior
    if (reportTag === 'quarantined' || reportTag === 'irrelevant') {
      return res.status(201).json({
        message: "Report submitted successfully. Image may not clearly represent an issue. Our team will review it.",
        prediction,
        decision: mlDecision,
        complaint: populatedComplaint
      });
    }

    return res.status(201).json({
      message: "Report submitted successfully.",
      prediction,
      decision: mlDecision,
      complaint: populatedComplaint
    });
  } catch (error) {
    await safelyDeleteUploadedFile(req.file?.path);
    console.error("Error in /api/report:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
