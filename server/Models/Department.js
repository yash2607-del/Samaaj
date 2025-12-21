import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        // Align categories with complaint model and client UI
        enum: ['Sanitization', 'Cleanliness', 'Electricity', 'Road', 'Water', 'Public Safety', 'Public Works', 'Other'],
        trim: true
    },
    subcategory: {
        type: String,
        trim: true
    },
    coverageAreas: [{
        type: String,
        trim: true
    }],
    moderatorAuthority: {
        type: String,
        trim: true
    },
    contactInfo: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { versionKey: false });

// Prevent OverwriteModelError
const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department;