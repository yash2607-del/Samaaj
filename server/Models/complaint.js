import mongoose from 'mongoose';
const { Schema } = mongoose;

const complaintSchema = new Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["Sanitization","Cleanliness","Electricity","Road","Water","Public Safety","Other"],
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
    status: {
      type: String,
      enum: ["Pending","In Progress","Resolved","Rejected"],
      default: "Pending"
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true }
  },
  { timestamps: true, versionKey: false }
);

// guard against OverwriteModelError
const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
export default Complaint;
