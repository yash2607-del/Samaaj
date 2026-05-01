import io
import json
import os

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

CLASS_NAMES_PATH = os.getenv("CLASS_NAMES_PATH")
if not CLASS_NAMES_PATH:
    # Prefer side-by-side with the model (same folder), fallback to mysamaaj_ai
    model_dir = os.path.dirname(MODEL_PATH) if MODEL_PATH else BASE_DIR
    candidate = os.path.join(model_dir, "class_names.json")
    if os.path.exists(candidate):
        CLASS_NAMES_PATH = candidate
    else:
        CLASS_NAMES_PATH = os.path.join(BASE_DIR, "mysamaaj_ai", "class_names.json")

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

def _load_class_names() -> list[str]:
    if CLASS_NAMES_PATH and os.path.exists(CLASS_NAMES_PATH):
        try:
            with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list) and all(isinstance(x, str) for x in data) and len(data) > 0:
                print(f"Loaded class names from {CLASS_NAMES_PATH}")
                return data
        except Exception as exc:
            print(f"Failed to load class names from {CLASS_NAMES_PATH}: {exc}")

    # Fallback list (kept for backward compatibility)
    return [
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


class_names = _load_class_names()

IMAGE_SIZE = (224, 224)

# Confidence calibration + decision thresholds
TEMPERATURE = float(os.getenv("TEMPERATURE", "1.25"))
THRESH_VERIFIED = float(os.getenv("THRESH_VERIFIED", "0.70"))
THRESH_REVIEW = float(os.getenv("THRESH_REVIEW", "0.40"))


def _to_model_input_array(image: Image.Image) -> np.ndarray:
    img_array = np.array(image, dtype=np.float32) / 255.0
    if img_array.ndim != 3 or img_array.shape[2] != 3:
        raise ValueError("Invalid image format")
    return img_array


def _gamma_correct(img_array: np.ndarray, gamma: float) -> np.ndarray:
    return np.clip(np.power(img_array, gamma), 0.0, 1.0)


def _apply_temperature_scaling(probs: np.ndarray, temperature: float) -> np.ndarray:
    probs = np.asarray(probs, dtype=np.float32)
    probs = np.clip(probs, 1e-8, 1.0)
    if temperature is None:
        return probs
    t = float(temperature)
    if t <= 0:
        return probs
    if abs(t - 1.0) < 1e-6:
        return probs

    # Softmax(log(p)/T) == normalize(p^(1/T))
    scaled = np.power(probs, 1.0 / t)
    scaled_sum = float(np.sum(scaled))
    if scaled_sum <= 0:
        return probs
    return scaled / scaled_sum


def _build_tta_variants(base_array: np.ndarray) -> list[np.ndarray]:
    # Keep variants small and deterministic so predictions stay fast and stable.
    variants = [base_array]
    brightness = float(np.mean(base_array))

    if brightness < 0.45:
        variants.append(_gamma_correct(base_array, 0.75))
        variants.append(np.clip(base_array * 1.2, 0.0, 1.0))
    else:
        variants.append(np.clip((base_array - 0.5) * 1.12 + 0.5, 0.0, 1.0))

    height, width, _ = base_array.shape
    crop_margin = int(min(height, width) * 0.08)
    if crop_margin > 0 and (height - 2 * crop_margin) > 20 and (width - 2 * crop_margin) > 20:
        crop = base_array[crop_margin:height - crop_margin, crop_margin:width - crop_margin, :]
        crop_img = Image.fromarray((crop * 255).astype(np.uint8)).resize((width, height), Image.BILINEAR)
        variants.append(np.array(crop_img, dtype=np.float32) / 255.0)

    return variants


def _predict_with_tta(image: Image.Image) -> tuple[np.ndarray, float, int]:
    base_array = _to_model_input_array(image)
    variants = _build_tta_variants(base_array)

    predictions = []
    top_class_indices = []

    for variant in variants:
        model_input = np.expand_dims(variant, axis=0)
        pred = model.predict(model_input, verbose=0)
        if pred.ndim == 2 and pred.shape[0] == 1:
            pred = pred[0]
        pred = np.asarray(pred, dtype=np.float32)
        # Ensure it's a probability vector even if the model changes later
        if pred.ndim != 1:
            pred = pred.reshape(-1)
        pred_sum = float(np.sum(pred))
        if pred_sum > 0:
            pred = pred / pred_sum
        predictions.append(pred)
        top_class_indices.append(int(np.argmax(pred)))

    # Proper TTA: average probabilities across variants
    averaged_prediction = np.mean(np.stack(predictions, axis=0), axis=0)
    averaged_prediction = _apply_temperature_scaling(averaged_prediction, TEMPERATURE)
    final_top_class = int(np.argmax(averaged_prediction))
    agreement = sum(1 for idx in top_class_indices if idx == final_top_class) / max(len(top_class_indices), 1)

    return averaged_prediction, float(agreement), len(variants)


@app.get("/health")
async def health():
    return {
        "ok": model is not None,
        "model_path": ACTIVE_MODEL_PATH,
        "class_names_path": CLASS_NAMES_PATH if CLASS_NAMES_PATH and os.path.exists(CLASS_NAMES_PATH) else None,
        "num_classes": len(class_names),
        "image_size": list(IMAGE_SIZE),
        "temperature": TEMPERATURE,
        "thresholds": {
            "verified": THRESH_VERIFIED,
            "needs_review": THRESH_REVIEW,
        },
    }


def _decision_from_confidence(confidence: float) -> str:
    if confidence >= THRESH_VERIFIED:
        return "verified"
    if confidence >= THRESH_REVIEW:
        return "needs_review"
    return "unclear"


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image = image.resize(IMAGE_SIZE, Image.BILINEAR)

        prediction, variant_agreement, variant_count = _predict_with_tta(image)

        top_idx = np.argsort(prediction)[::-1]

        top_predictions = []
        for idx in top_idx[:2]:
            i = int(idx)
            label = class_names[i] if i < len(class_names) else f"class_{i}"
            top_predictions.append({"label": label, "confidence": float(prediction[i])})

        predicted_index = int(top_idx[0])
        final_label = class_names[predicted_index] if predicted_index < len(class_names) else f"class_{predicted_index}"
        confidence = float(prediction[predicted_index])
        decision = _decision_from_confidence(confidence)

        return {
            "top_predictions": top_predictions,
            "final_label": final_label,
            "confidence": confidence,
            "decision": decision,
            # Backward-compatible alias (server expects `prediction`)
            "prediction": final_label,
            "variant_agreement": variant_agreement,
            "variant_count": variant_count,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))