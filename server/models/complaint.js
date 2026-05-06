import mongoose from 'mongoose';
const { Schema } = mongoose;

const complaintSchema = new Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["Sanitization","Cleanliness","Electricity","Road","Water","Public Safety","Public Works","Other"],
      required: true
    },
    description: { type: String, default: "" },
    location: { type: String, required: true },
    addressLine: { type: String, default: "" },
    landmark: { type: String, default: "" },
    city: { type: String, default: "" },
    district: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    photo: { type: String, default: "" },
    mlPrediction: { type: String, default: "" },
    mlConfidence: { type: Number, min: 0, max: 1, default: null },
    mlDecision: {
      type: String,
      enum: ["", "verified", "needs_review", "uncertain", "unclear", "quarantined"],
      default: ""
    },
    mlReviewStatus: {
      type: String,
      enum: ["", "Verified", "Pending Review", "Manual Check", "Rejected", "Hidden/Rejected", "Duplicate", "AI Verified", "AI Needs Review", "Quarantined", "Verified by AI", "Submitted for Review", "Flagged for Manual Check"],
      default: ""
    },
    mlModelOutputs: { type: Schema.Types.Mixed, default: null },
    
    // AI Observability Suite
    cnnLabel: { type: String, default: "" },
    cnnConfidence: { type: Number, default: 0 },
    pretrainedLabel: { type: String, default: "" },
    pretrainedConfidence: { type: Number, default: 0 },
    contextLabel: { type: String, default: "" },
    aiExplanation: { type: String, default: "" },
    
    // Moderator Feedback Loop
    correctedLabel: { type: String, default: "" },
    isModelCorrect: { type: Boolean, default: null }, // null until reviewed

    aiDecision: { type: String, default: "" },
    aiConfidence: { type: Number, default: 0 },
    modelAgreement: { type: Boolean, default: false },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: Schema.Types.ObjectId, ref: "Complaint", default: null },
    trustScore: { type: Number, default: 0.5 },
    imageHash: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending","In Progress","Resolved","Rejected", "Duplicate", "Quarantined"],
      default: "Pending"
    },
    reportTag: {
      type: String,
      enum: ["", "spam", "duplicate", "irrelevant", "clean", "quarantined"],
      default: ""
    },
    imageSource: {
      type: String,
      enum: ["", "camera", "gallery"],
      default: ""
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Moderator", default: null },
    communityValidations: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        note: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    history: [
      {
        status: { type: String },
        changedBy: { type: Schema.Types.ObjectId, ref: "Moderator" },
        changedByEmail: { type: String },
        note: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true, versionKey: false }
);

// guard against OverwriteModelError
const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
export default Complaint;
