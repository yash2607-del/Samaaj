# Samaaj

Samaaj is a lightweight civic issue reporting platform that helps citizens raise problems in their locality and track progress toward resolution. It streamlines communication between citizens and moderators, providing clarity, accountability, and faster action.

## Core Features
- Report Issues: Submit a complaint with title, category, description, location, and a photo.
- Location Assist: Auto‑detect location from the browser for accurate reporting.
- Media Support: Upload an image to provide evidence and context.
- Status Tracking: View each issue’s current status (Pending, In Progress, Resolved, Rejected).
- Role-Based Access: Citizens file and track issues; moderators review and update statuses.
- Clean UI: Card-based listing for complaints with image, metadata, and timestamps.

## Tech Stack
- Frontend: React, React Router, Axios, Bootstrap
- Backend: Node.js, Express, Multer, Mongoose, CORS
- Database: MongoDB

## User Workflow
1. Sign Up / Log In
	- A user creates an account (Citizen or Moderator) and logs in.

2. Create a Complaint
	- The citizen fills a form with problem title, category, short description, and location (manually or via auto‑detect), and attaches a photo.
	- On submit, the image is stored on the server and a complaint record is saved in the database with a reference to the uploaded file.

3. Track Issues
	- The citizen views a card-based list of their complaints. Each card shows the image, title, category, location, creation date, and current status.
	- Cards update as moderators change status over time.

4. Moderator Review
	- Moderators access complaints for their department, evaluate submissions, and update statuses (e.g., In Progress or Resolved) to keep citizens informed.

5. Feedback and Iteration
	- Citizens can return to the track page to review progress and provide feedback where applicable.

