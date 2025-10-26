import mongoose from 'mongoose';
import Department from '../models/Department.js';

const departments = [
    {
        name: 'Sanitation',
        description: 'Responsible for waste management and cleanliness',
        areas: ['Waste Collection', 'Street Cleaning', 'Public Toilets']
    },
    {
        name: 'Public Works',
        description: 'Responsible for infrastructure maintenance',
        areas: ['Roads', 'Bridges', 'Public Buildings']
    },
    {
        name: 'Water Supply',
        description: 'Responsible for water supply and management',
        areas: ['Water Distribution', 'Water Quality', 'Pipeline Maintenance']
    },
    {
        name: 'Electricity',
        description: 'Responsible for electrical infrastructure',
        areas: ['Power Distribution', 'Street Lighting', 'Electrical Maintenance']
    },
    {
        name: 'Public Safety',
        description: 'Responsible for public safety and security',
        areas: ['Street Safety', 'Emergency Response', 'Public Security']
    }
];

async function seedDepartments() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/samaaj');
        console.log('Connected to MongoDB');

        // Clear existing departments
        await Department.deleteMany({});
        console.log('Cleared existing departments');

        // Insert new departments
        const result = await Department.insertMany(departments);
        console.log(`Added ${result.length} departments`);

        console.log('Departments created:');
        result.forEach(dept => {
            console.log(`- ${dept.name} (${dept._id})`);
        });

    } catch (error) {
        console.error('Error seeding departments:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the seed function
seedDepartments();