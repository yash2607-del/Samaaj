import os
import io
import numpy as np
import tensorflow as tf
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Allow overriding with env var, otherwise look in common locations
MODEL_PATH = os.getenv("MODEL_PATH") or os.path.join(BASE_DIR, "mysamaaj_ai", "civic_issue_model.keras")
if not os.path.exists(MODEL_PATH):
    alt = os.path.join(BASE_DIR, "civic_issue_model.keras")
    if os.path.exists(alt):
        MODEL_PATH = alt

model = None
ACTIVE_MODEL_PATH = None
try:
    if os.path.exists(MODEL_PATH):
        model = tf.keras.models.load_model(MODEL_PATH)
        ACTIVE_MODEL_PATH = MODEL_PATH
        print(f"Loaded model from {ACTIVE_MODEL_PATH}")
    else:
        print(f"No model file found at {MODEL_PATH}")
except Exception as exc:
    print(f"Failed to load model from {MODEL_PATH}: {exc}")
    model = None

class_names = [
    "broken_electric_pole",
    "construction_waste",
    "drain_overflow",
    "exposed_wires",
    "fallen_pole",
    "overflowing_bin",
    "potholes",
    "road_blockage",
    "road_cracks",
    "trash_pile",
    "water_leakage",
    "waterlogging",
    "streetlight_issue",
]

IMAGE_SIZE = (224, 224)


@app.get("/health")
async def health():
    return {
        "ok": model is not None,
        "model_path": ACTIVE_MODEL_PATH,
        "num_classes": len(class_names),
        "image_size": list(IMAGE_SIZE),
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image = image.resize(IMAGE_SIZE, Image.BILINEAR)

        img_array = np.array(image, dtype=np.float32) / 255.0
        if img_array.ndim != 3 or img_array.shape[2] != 3:
            raise ValueError("Invalid image format")
        img_array = np.expand_dims(img_array, axis=0)

        prediction = model.predict(img_array, verbose=0)
        if prediction.ndim == 2 and prediction.shape[0] == 1:
            prediction = prediction[0]

        top_idx = np.argsort(prediction)[::-1]
        predicted_index = int(top_idx[0])
        predicted_class = class_names[predicted_index] if predicted_index < len(class_names) else f"class_{predicted_index}"
        confidence = float(prediction[predicted_index])

        top_predictions = []
        for idx in top_idx[:3]:
            idx = int(idx)
            top_predictions.append({
                "class": class_names[idx] if idx < len(class_names) else f"class_{idx}",
                "confidence": float(prediction[idx]),
            })

        return {
            "prediction": predicted_class,
            "confidence": confidence,
            "top_predictions": top_predictions,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))