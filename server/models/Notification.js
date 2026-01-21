import mongoose from 'mongoose';
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
      type: String, 
      enum: ["status_change", "community_validation", "assignment", "new_complaint"],
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    complaintId: { type: Schema.Types.ObjectId, ref: "Complaint", required: true },
    isRead: { type: Boolean, default: false },
    metadata: {
      oldStatus: String,
      newStatus: String,
      validatorName: String,
      moderatorName: String,
      area: String
    }
  },
  { timestamps: true, versionKey: false }
);

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
