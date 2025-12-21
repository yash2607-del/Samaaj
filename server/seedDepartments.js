import mongoose from 'mongoose';
import Department from './models/Department.js';
import dotenv from 'dotenv';

dotenv.config();

const departments = [
  // Electricity
  {
    name: 'BSES Radhani Power Ltd (BRPL)',
    category: 'Electricity',
    subcategory: 'Power Supply, Billing, Poles, Wires',
    coverageAreas: ['South Delhi', 'West Delhi'],
    moderatorAuthority: 'BSES BRPL Grievance Cell / Customer Care',
    contactInfo: '19123 / 1912',
    isActive: true
  },
  {
    name: 'BSES Yamuna Power Ltd (BYPL)',
    category: 'Electricity',
    subcategory: 'Power Supply, Billing, Poles, Wires',
    coverageAreas: ['Central Delhi', 'East Delhi'],
    moderatorAuthority: 'BSES BYPL Grievance Cell / Customer Care',
    contactInfo: '19122 / 1912',
    isActive: true
  },
  {
    name: 'Tata Power Delhi Distribution Ltd (TPDDL)',
    category: 'Electricity',
    subcategory: 'Power Supply, Billing, Poles, Wires',
    coverageAreas: ['North Delhi', 'North-West Delhi'],
    moderatorAuthority: 'TPDDL Grievance Cell / Customer Care',
    contactInfo: '19124 / 1912',
    isActive: true
  },
  
  // Sanitation
  {
    name: 'Municipal Corporation of Delhi (MCD)',
    category: 'Sanitization',
    subcategory: 'Cleanliness, Garbage, Sweeping, Drains',
    coverageAreas: ['Most of Delhi'],
    moderatorAuthority: 'MCD Sanitation Department (Zonal Health Officer)',
    contactInfo: '1800-11-4545',
    isActive: true
  },
  {
    name: 'New Delhi Municipal Council (NDMC)',
    category: 'Sanitization',
    subcategory: 'Cleanliness, Garbage, Sweeping, Drains',
    coverageAreas: ['Connaught Place', 'Lutyen\'s Delhi', 'Central Areas'],
    moderatorAuthority: 'NDMC Sanitation Department (Zonal Health Officer)',
    contactInfo: '1800-11-3392',
    isActive: true
  },
  {
    name: 'Delhi Cantonment Board (DCB)',
    category: 'Sanitization',
    subcategory: 'Cleanliness, Garbage, Sweeping, Drains',
    coverageAreas: ['Cantonment (Army) Areas'],
    moderatorAuthority: 'DCB Health Department',
    contactInfo: '011-2569-9531',
    isActive: true
  },
  
  // Road
  {
    name: 'Public Works Department (PWD), Delhi Govt',
    category: 'Road',
    subcategory: 'Potholes, Footpaths, Street Repair',
    coverageAreas: ['Major Roads', 'Flyovers', 'Arterial Roads'],
    moderatorAuthority: 'PWD Executive Engineer / MCD Zonal Office',
    contactInfo: '1800-11-1315',
    isActive: true
  },
  {
    name: 'Municipal Corporation of Delhi (MCD)',
    category: 'Road',
    subcategory: 'Potholes, Footpaths, Street Repair',
    coverageAreas: ['Internal Colony Roads', 'Local Streets'],
    moderatorAuthority: 'PWD Executive Engineer / MCD Zonal Office',
    contactInfo: '1800-11-4545',
    isActive: true
  },
  {
    name: 'National Highways Authority of India (NHAI)',
    category: 'Road',
    subcategory: 'Potholes, Footpaths, Street Repair',
    coverageAreas: ['National Highways passing through Delhi'],
    moderatorAuthority: 'NHAI Regional Office',
    contactInfo: '1033',
    isActive: true
  },
  {
    name: 'Delhi Development Authority (DDA)',
    category: 'Road',
    subcategory: 'Potholes, Footpaths, Street Repair',
    coverageAreas: ['DDA Housing Societies', 'DDA Land'],
    moderatorAuthority: 'DDA Engineering Department',
    contactInfo: '1800-11-3715',
    isActive: true
  },
  
  // Public Works
  {
    name: 'Public Works Department (PWD), GNCTD',
    category: 'Public Works',
    subcategory: 'Streetlights, Flyovers, Govt Buildings',
    coverageAreas: ['Flyovers', 'Govt Schools', 'Hospitals', 'Main Roads'],
    moderatorAuthority: 'PWD Division Office or Civic Body Engineering Dept',
    contactInfo: '1800-11-1315',
    isActive: true
  },
  {
    name: 'MCD / NDMC',
    category: 'Public Works',
    subcategory: 'Streetlights, Flyovers, Govt Buildings',
    coverageAreas: ['Streetlights', 'Local Infrastructure'],
    moderatorAuthority: 'PWD Division Office or Civic Body Engineering Dept',
    contactInfo: '1800-11-4545 / 1800-11-3392',
    isActive: true
  },
  
  // Water
  {
    name: 'Delhi Jal Board (DJB)',
    category: 'Water',
    subcategory: 'Water Supply, Billing, Pipelines, Quality',
    coverageAreas: ['Entire NCT of Delhi'],
    moderatorAuthority: 'DJB Customer Care / Zonal Office',
    contactInfo: '1916',
    isActive: true
  },
  {
    name: 'New Delhi Municipal Council (NDMC)',
    category: 'Water',
    subcategory: 'Water Supply, Billing, Pipelines, Quality',
    coverageAreas: ['NDMC Areas (Lutyen\'s Delhi, Connaught Place)'],
    moderatorAuthority: 'NDMC Water Department',
    contactInfo: '1800-11-3392',
    isActive: true
  },
  
  // Public Safety
  {
    name: 'Delhi Police',
    category: 'Public Safety',
    subcategory: 'Crime, Security, Emergency',
    coverageAreas: ['Entire NCT of Delhi'],
    moderatorAuthority: 'Delhi Police Control Room / Local Police Station',
    contactInfo: '100',
    isActive: true
  },
  {
    name: 'Delhi Fire Service',
    category: 'Public Safety',
    subcategory: 'Fire Emergency, Rescue',
    coverageAreas: ['Entire NCT of Delhi'],
    moderatorAuthority: 'Delhi Fire Service Control Room',
    contactInfo: '101',
    isActive: true
  }
];

async function seedDepartments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing departments
    await Department.deleteMany({});
    console.log('Cleared existing departments');

    // Insert new departments
    await Department.insertMany(departments);
    console.log('Successfully seeded departments:', departments.length);

    const allDepts = await Department.find();
    console.log('\nAll departments:');
    allDepts.forEach(dept => {
      console.log(`- ${dept.name} (${dept.category})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding departments:', error);
    process.exit(1);
  }
}

seedDepartments();
