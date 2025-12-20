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
        enum: ['Electricity', 'Sanitation', 'Road', 'Public Works', 'Water', 'Public Safety'],
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