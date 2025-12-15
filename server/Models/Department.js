import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // List of areas this department is responsible for
    areas: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { versionKey: false });

// Prevent OverwriteModelError
const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department;