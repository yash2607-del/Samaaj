import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    // List of areas this department is responsible for
    areas: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { versionKey: false });

// Prevent OverwriteModelError
const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department;