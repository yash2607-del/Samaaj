# Department Structure Update

## Overview
Updated the department structure to match real-world Delhi government departments with detailed coverage areas, contact information, and moderator authorities.

## New Department Schema

### Fields:
- **name**: Department name (e.g., "BSES Radhani Power Ltd (BRPL)")
- **category**: Main category (Electricity, Sanitation, Road, Public Works, Water, Public Safety)
- **subcategory**: Specific services (e.g., "Power Supply, Billing, Poles, Wires")
- **coverageAreas**: Array of areas covered (e.g., ["South Delhi", "West Delhi"])
- **moderatorAuthority**: Responsible authority (e.g., "BSES BRPL Grievance Cell")
- **contactInfo**: Contact number/helpline
- **isActive**: Boolean for active status

## Departments by Category

### 1. Electricity (Power Supply, Billing, Poles, Wires)
- **BSES Radhani Power Ltd (BRPL)**
  - Coverage: South & West Delhi
  - Authority: BSES BRPL Grievance Cell / Customer Care
  - Contact: 19123 / 1912

- **BSES Yamuna Power Ltd (BYPL)**
  - Coverage: Central & East Delhi
  - Authority: BSES BYPL Grievance Cell / Customer Care
  - Contact: 19122 / 1912

- **Tata Power Delhi Distribution Ltd (TPDDL)**
  - Coverage: North & North-West Delhi
  - Authority: TPDDL Grievance Cell / Customer Care
  - Contact: 19124 / 1912

### 2. Sanitation (Cleanliness, Garbage, Sweeping, Drains)
- **Municipal Corporation of Delhi (MCD)**
  - Coverage: Most of Delhi
  - Authority: MCD Sanitation Department (Zonal Health Officer)
  - Contact: 1800-11-4545

- **New Delhi Municipal Council (NDMC)**
  - Coverage: Connaught Place, Lutyen's Delhi, Central Areas
  - Authority: NDMC Sanitation Department (Zonal Health Officer)
  - Contact: 1800-11-3392

- **Delhi Cantonment Board (DCB)**
  - Coverage: Cantonment (Army) Areas
  - Authority: DCB Health Department
  - Contact: 011-2569-9531

### 3. Road (Potholes, Footpaths, Street Repair)
- **Public Works Department (PWD), Delhi Govt**
  - Coverage: Major Roads, Flyovers, Arterial Roads
  - Authority: PWD Executive Engineer / MCD Zonal Office
  - Contact: 1800-11-1315

- **Municipal Corporation of Delhi (MCD)**
  - Coverage: Internal Colony Roads, Local Streets
  - Authority: PWD Executive Engineer / MCD Zonal Office
  - Contact: 1800-11-4545

- **National Highways Authority of India (NHAI)**
  - Coverage: National Highways passing through Delhi
  - Authority: NHAI Regional Office
  - Contact: 1033

- **Delhi Development Authority (DDA)**
  - Coverage: DDA Housing Societies, DDA Land
  - Authority: DDA Engineering Department
  - Contact: 1800-11-3715

### 4. Public Works (Streetlights, Flyovers, Govt Buildings)
- **Public Works Department (PWD), GNCTD**
  - Coverage: Flyovers, Govt Schools, Hospitals, Main Roads
  - Authority: PWD Division Office or Civic Body Engineering Dept
  - Contact: 1800-11-1315

- **MCD / NDMC**
  - Coverage: Streetlights, Local Infrastructure
  - Authority: PWD Division Office or Civic Body Engineering Dept
  - Contact: 1800-11-4545 / 1800-11-3392

### 5. Water (Water Supply, Billing, Pipelines, Quality)
- **Delhi Jal Board (DJB)**
  - Coverage: Entire NCT of Delhi
  - Authority: DJB Customer Care / Zonal Office
  - Contact: 1916

- **New Delhi Municipal Council (NDMC)**
  - Coverage: NDMC Areas (Lutyen's Delhi, Connaught Place)
  - Authority: NDMC Water Department
  - Contact: 1800-11-3392

### 6. Public Safety (Crime, Security, Emergency)
- **Delhi Police**
  - Coverage: Entire NCT of Delhi
  - Authority: Delhi Police Control Room / Local Police Station
  - Contact: 100

- **Delhi Fire Service**
  - Coverage: Entire NCT of Delhi
  - Authority: Delhi Fire Service Control Room
  - Contact: 101

## Changes Made

### 1. Database Schema (`server/Models/Department.js`)
- Added `category` field with enum validation
- Added `subcategory` for service types
- Renamed `areas` to `coverageAreas` for clarity
- Added `moderatorAuthority` for responsible authority
- Added `contactInfo` for helpline numbers
- Removed `unique: true` from name to allow same department under different categories

### 2. Seed Script (`server/seedDepartments.js`)
- Created script to populate database with 16 departments
- Includes all major Delhi government departments
- Can be run with: `node seedDepartments.js`

### 3. API Routes (`server/routes/Complaints.js`)
- Added GET `/api/complaints/departments/:id` to fetch single department by ID

### 4. Frontend Updates

#### Create Complaint Form (`client/src/pages/UserIssue/Create.jsx`)
- Updated `getFilteredDepartments()` to filter by category field
- Shows coverage areas in dropdown: "Department Name (Area1, Area2)"
- Auto-selects department when only one option available for category

#### Moderator Profile (`client/src/pages/ModeratorProfile/ModeratorProfile.jsx`)
- Enhanced to show full department information:
  - Department name with subcategory
  - Coverage areas
  - Moderator authority
  - Contact information
- Added new icons: FiMapPin, FiPhone

#### Issue Cards (`client/src/pages/NearbyComplaints/NearbyComplaints.jsx`)
- Removed department display from complaint cards (as requested)

## Usage

### To Seed Database:
```bash
cd server
node seedDepartments.js
```

### Department Selection Flow:
1. User selects category (e.g., "Electricity")
2. Dropdown shows only relevant departments for that category
3. Each option shows department name with coverage areas
4. If only one department available, auto-selects

### Moderator View:
- Moderators now see complete department info in their profile
- Includes coverage areas, authority, and contact details
- Helps moderators understand their jurisdiction

## Benefits
1. **Accurate Mapping**: Real Delhi government departments with actual coverage areas
2. **Better UX**: Users see only relevant departments for their issue category
3. **Contact Info**: Quick access to helpline numbers
4. **Authority Info**: Clear chain of command for complaint escalation
5. **Coverage Areas**: Users can verify if department covers their area
