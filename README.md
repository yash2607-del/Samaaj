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

## ML Integration (FastAPI + Keras)

Architecture:

Frontend (React) → Node/Express (`/api/report`) → FastAPI (`/predict`) → TensorFlow/Keras model

### Folder Structure

- `ml_service/app.py`
- `ml_service/civic_model.keras`
- `server/routes/report.js`

### 1) Start the FastAPI ML Service

From project root:

```bash
cd ml_service
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate

pip install fastapi uvicorn tensorflow pillow numpy python-multipart
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Optional environment variables for `ml_service/app.py`:

- `MODEL_PATH` (default: `ml_service/civic_model.keras`)
- `CLASS_NAMES` (comma-separated class names)

If `CLASS_NAMES` is not provided, class names are resolved in this order:
1. `class_names.json`
2. dataset folders (`dataset_split/train` or `dataset`)
3. generated fallback (`class_0`, `class_1`, ...)

### 2) Start Express Server

From `server` folder:

```bash
npm install
```

Set env var (optional, default shown):

```bash
ML_SERVICE_URL=http://127.0.0.1:8000
```

Run server:

```bash
npm run dev
```

### 3) Report API (Node Route)

`POST /api/report`

Multipart form-data fields:
- `photo` (required image)
- `title` (required)
- `location` (required)
- optional: `description`, `addressLine`, `landmark`, `city`, `district`, `state`, `pincode`

The route:
- uploads image with Multer
- calls FastAPI `/predict` using Axios + FormData
- stores `mlPrediction` and `mlConfidence` in complaint document
- maps predicted subclass to complaint category and assigns a matching department


