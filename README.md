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

Frontend (React) -> Node/Express (`/api/report`) -> FastAPI (`/predict`) -> TensorFlow/Keras model

### Folder Structure

- `app.py` (FastAPI inference service)
- `mysamaaj_ai/train_model.py` (custom CNN training)
- `mysamaaj_ai/scripts/demo_eval.py` (demo sample picker)
- `mysamaaj_ai/dataset` and `mysamaaj_ai/dataset_split` (class folders + train/val split)
- `server/routes/report.js`

### 1) Train the Model (Data -> Split -> Train -> Model)

From project root:

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate

pip install -r mysamaaj_ai/requirements.txt

# (optional) resize + split dataset
python mysamaaj_ai/scripts/resize_images.py
python mysamaaj_ai/scripts/split_dataset.py

# train
python mysamaaj_ai/train_model.py
```

What this does:

- reads class folders from `mysamaaj_ai/dataset_split/train` and `mysamaaj_ai/dataset_split/val`
- trains a lightweight custom CNN (no transfer learning)
- writes artifacts:
	- `mysamaaj_ai/civic_issue_model.keras`
	- `mysamaaj_ai/class_names.json`

### 1b) Pick Demo Evaluation Samples (Optional)

```bash
python mysamaaj_ai/scripts/demo_eval.py --count 5 --min-confidence 0.55 --min-gap 0.15
```

### 2) Start the FastAPI ML Service

From project root:

```bash
# If needed, point to the trained model explicitly
# Windows PowerShell:
#   $env:MODEL_PATH = "<full path>\\mysamaaj_ai\\civic_issue_model.keras"
#   $env:TEMPERATURE = "1.25"

uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Optional environment variables for `app.py`:

- `MODEL_PATH` (explicit model path)
- `CLASS_NAMES_PATH` (path to `class_names.json`)
- `PRETRAINED_MODEL_PATH` (optional fine-tuned pretrained model path, e.g. MobileNet/EfficientNet saved as `.keras`)
- `PRETRAINED_CLASS_NAMES_PATH` (optional class mapping for the pretrained model; defaults to `CLASS_NAMES_PATH`)
- `TEMPERATURE` (confidence calibration, e.g. `1.25`)
- `CNN_TEMPERATURE` / `PRETRAINED_TEMPERATURE` (per-model calibration overrides)
- `THRESH_VERIFIED` (default `0.70`)
- `THRESH_REVIEW` (default `0.40`)

Hybrid ensemble notes:

- If `PRETRAINED_MODEL_PATH` points to a valid model file, the FastAPI `/predict` endpoint runs both models with TTA and combines them via a rule-based decision engine.
- Response includes `model_outputs` for `cnn` and `pretrained`, plus `final_label`, `confidence`, `decision`, and `top_predictions`.

### 3) Start Express Server

From `server` folder:

```bash
npm install
npm run dev
```

Optional env var:

```bash
ML_SERVICE_URL=http://127.0.0.1:8000
```

### 4) Report API (Node Route)

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

### 5) Confidence Gate (Why "Image is unclear")

Express validation uses `ML_MIN_CONFIDENCE` (default `0.45`).

If prediction confidence is below this threshold, image verification fails with an "unclear" message.
After retraining, tune threshold in server env if needed:

```bash
ML_MIN_CONFIDENCE=0.40
```


