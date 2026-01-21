import mongoose from 'mongoose';

const moderatorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    role: {
        type: String,
        default: 'moderator'
    },
    assignedComplaints: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Check if the model already exists to prevent the OverwriteModelError
// Register legacy model under a distinct name to avoid colliding with the new `Moderator` model
const LegacyModerator = mongoose.models.LegacyModerator || mongoose.model('LegacyModerator', moderatorSchema, 'moderators');

export default LegacyModerator;