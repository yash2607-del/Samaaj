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

# Optional second model (pretrained fine-tuned).
PRETRAINED_MODEL_PATH = os.getenv("PRETRAINED_MODEL_PATH") or os.path.join(
    BASE_DIR, "mysamaaj_ai", "pretrained_model.keras"
)

PRETRAINED_CLASS_NAMES_PATH = os.getenv("PRETRAINED_CLASS_NAMES_PATH")
if not PRETRAINED_CLASS_NAMES_PATH:
    candidate = os.path.join(os.path.dirname(PRETRAINED_MODEL_PATH), "class_names.json")
    if os.path.exists(candidate):
        PRETRAINED_CLASS_NAMES_PATH = candidate
    else:
        PRETRAINED_CLASS_NAMES_PATH = CLASS_NAMES_PATH

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

pretrained_model = None
ACTIVE_PRETRAINED_MODEL_PATH = None
try:
    if PRETRAINED_MODEL_PATH and os.path.exists(PRETRAINED_MODEL_PATH):
        pretrained_model = tf.keras.models.load_model(PRETRAINED_MODEL_PATH)
        ACTIVE_PRETRAINED_MODEL_PATH = PRETRAINED_MODEL_PATH
        print(f"Loaded pretrained model from {ACTIVE_PRETRAINED_MODEL_PATH}")
    else:
        print(f"No pretrained model file found at {PRETRAINED_MODEL_PATH}")
except Exception as exc:
    print(f"Failed to load pretrained model from {PRETRAINED_MODEL_PATH}: {exc}")
    pretrained_model = None

def _load_class_names(path: str | None) -> list[str]:
    if path and os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list) and all(isinstance(x, str) for x in data) and len(data) > 0:
                print(f"Loaded class names from {path}")
                return data
        except Exception as exc:
            print(f"Failed to load class names from {path}: {exc}")

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


class_names = _load_class_names(CLASS_NAMES_PATH)
pretrained_class_names = _load_class_names(PRETRAINED_CLASS_NAMES_PATH)

IMAGE_SIZE = (224, 224)

# Confidence calibration + decision thresholds
TEMPERATURE = float(os.getenv("TEMPERATURE", "1.25"))
CNN_TEMPERATURE = float(os.getenv("CNN_TEMPERATURE", str(TEMPERATURE)))
PRETRAINED_TEMPERATURE = float(os.getenv("PRETRAINED_TEMPERATURE", str(TEMPERATURE)))

# Ensemble decision thresholds
ENSEMBLE_AGREE_BOOST = float(os.getenv("ENSEMBLE_AGREE_BOOST", "0.05"))
PRETRAINED_HIGH_CONF = float(os.getenv("PRETRAINED_HIGH_CONF", "0.65"))
CNN_WEAK_CONF = float(os.getenv("CNN_WEAK_CONF", "0.50"))
BOTH_LOW_CONF = float(os.getenv("BOTH_LOW_CONF", "0.30"))
DISAGREE_SMALL_GAP = float(os.getenv("DISAGREE_SMALL_GAP", "0.10"))

# Decision thresholds
THRESH_VERIFIED = float(os.getenv("THRESH_VERIFIED", "0.65"))
THRESH_REVIEW = float(os.getenv("THRESH_REVIEW", "0.30"))

EASY_VERIFIED_THRESH = float(os.getenv("EASY_VERIFIED_THRESH", "0.35"))
EASY_CLASSES = {
    x.strip()
    for x in str(os.getenv("EASY_CLASSES", "trash_pile,overflowing_bin,construction_waste,drain_overflow")).split(",")
    if x.strip()
}


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
    # Keep TTA small (3 variants) for predictable latency:
    # 1) original
    # 2) horizontal flip
    # 3) slight zoom (center crop then resize)
    variants = [base_array]

    flipped = np.ascontiguousarray(base_array[:, ::-1, :])
    variants.append(flipped)

    height, width, _ = base_array.shape
    # 8% crop ~= mild zoom-in when resized back
    crop_margin = int(min(height, width) * 0.08)
    if crop_margin > 0 and (height - 2 * crop_margin) > 20 and (width - 2 * crop_margin) > 20:
        crop = base_array[crop_margin:height - crop_margin, crop_margin:width - crop_margin, :]
        crop_img = Image.fromarray((crop * 255).astype(np.uint8)).resize((width, height), Image.BILINEAR)
        variants.append(np.array(crop_img, dtype=np.float32) / 255.0)
    else:
        variants.append(base_array)

    return variants


def _predict_vector_with_tta(model_obj: tf.keras.Model, image: Image.Image, temperature: float) -> tuple[np.ndarray, float, int]:
    base_array = _to_model_input_array(image)
    variants = _build_tta_variants(base_array)

    predictions = []
    top_class_indices = []

    for variant in variants:
        model_input = np.expand_dims(variant, axis=0)
        pred = model_obj.predict(model_input, verbose=0)
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
    averaged_prediction = _apply_temperature_scaling(averaged_prediction, temperature)
    final_top_class = int(np.argmax(averaged_prediction))
    agreement = sum(1 for idx in top_class_indices if idx == final_top_class) / max(len(top_class_indices), 1)

    return averaged_prediction, float(agreement), len(variants)


def _predict_with_tta(image: Image.Image) -> tuple[np.ndarray, float, int]:
    # Backward-compatible wrapper used by demo tools.
    return _predict_vector_with_tta(model, image, CNN_TEMPERATURE)


@app.get("/health")
async def health():
    return {
        "ok": model is not None,
        "model_path": ACTIVE_MODEL_PATH,
        "pretrained_ok": pretrained_model is not None,
        "pretrained_model_path": ACTIVE_PRETRAINED_MODEL_PATH,
        "class_names_path": CLASS_NAMES_PATH if CLASS_NAMES_PATH and os.path.exists(CLASS_NAMES_PATH) else None,
        "pretrained_class_names_path": PRETRAINED_CLASS_NAMES_PATH if PRETRAINED_CLASS_NAMES_PATH and os.path.exists(PRETRAINED_CLASS_NAMES_PATH) else None,
        "num_classes": len(class_names),
        "image_size": list(IMAGE_SIZE),
        "temperatures": {
            "cnn": CNN_TEMPERATURE,
            "pretrained": PRETRAINED_TEMPERATURE,
        },
        "thresholds": {
            "verified": THRESH_VERIFIED,
            "needs_review": THRESH_REVIEW,
            "ensemble": {
                "agree_boost": ENSEMBLE_AGREE_BOOST,
                "pretrained_high_conf": PRETRAINED_HIGH_CONF,
                "cnn_weak_conf": CNN_WEAK_CONF,
                "both_low_conf": BOTH_LOW_CONF,
                "disagree_small_gap": DISAGREE_SMALL_GAP,
            },
        },
    }


def _decision_from_confidence(confidence: float) -> str:
    if confidence >= THRESH_VERIFIED:
        return "verified"
    if confidence >= THRESH_REVIEW:
        return "needs_review"
    return "unclear"


def _apply_easy_class_adjustment(label: str, confidence: float, decision: str) -> str:
    # For easy/visually distinct classes, allow a lower verified threshold.
    # Never upgrade an "unclear" prediction.
    if decision != "needs_review":
        return decision
    if label in EASY_CLASSES and confidence >= EASY_VERIFIED_THRESH:
        return "verified"
    return decision


def _topk_from_vector(vector: np.ndarray, names: list[str], k: int) -> list[dict]:
    vec = np.asarray(vector, dtype=np.float32).reshape(-1)
    idx = np.argsort(vec)[::-1][:k]
    out = []
    for raw in idx:
        i = int(raw)
        label = names[i] if i < len(names) else f"class_{i}"
        out.append({"label": label, "confidence": float(vec[i])})
    return out


def _predict_label_conf(model_obj: tf.keras.Model, names: list[str], image: Image.Image, temperature: float) -> dict:
    vec, _, _ = _predict_vector_with_tta(model_obj, image, temperature)
    vec = np.asarray(vec, dtype=np.float32).reshape(-1)
    top_idx = int(np.argmax(vec))
    label = names[top_idx] if top_idx < len(names) else f"class_{top_idx}"
    confidence = float(vec[top_idx])
    top2 = _topk_from_vector(vec, names, k=2)
    return {"label": label, "confidence": confidence, "top2": top2, "vector": vec}


def _second_best_candidate(*top2_lists: list[dict], exclude_label: str) -> dict | None:
    candidates = []
    for top2 in top2_lists:
        for row in top2:
            if row.get("label") and row.get("label") != exclude_label:
                candidates.append(row)
    if not candidates:
        return None
    candidates.sort(key=lambda r: float(r.get("confidence", 0.0)), reverse=True)
    best = candidates[0]
    return {"label": str(best["label"]), "confidence": float(best.get("confidence", 0.0))}


def _ensemble_decision(cnn_out: dict, pt_out: dict | None) -> dict:
    # If pretrained isn't available, fall back to single-model decisioning.
    if pt_out is None:
        conf = float(cnn_out["confidence"])
        if conf >= THRESH_VERIFIED:
            decision = "verified"
        elif conf >= THRESH_REVIEW:
            decision = "needs_review"
        else:
            decision = "unclear"

        decision = _apply_easy_class_adjustment(str(cnn_out["label"]), conf, decision)

        top_predictions = list(cnn_out["top2"])
        return {
            "final_label": cnn_out["label"],
            "confidence": conf,
            "decision": decision,
            "top_predictions": top_predictions,
        }

    cnn_label = str(cnn_out["label"])
    pt_label = str(pt_out["label"])
    cnn_conf = float(cnn_out["confidence"])
    pt_conf = float(pt_out["confidence"])

    # Case 1: agreement
    if cnn_label == pt_label:
        merged_conf = min(0.99, ((cnn_conf + pt_conf) / 2.0) + ENSEMBLE_AGREE_BOOST)
        second = _second_best_candidate(cnn_out["top2"], pt_out["top2"], exclude_label=cnn_label)
        top_predictions = [{"label": cnn_label, "confidence": merged_conf}]
        if second:
            top_predictions.append(second)
        decision = "verified"
        decision = _apply_easy_class_adjustment(cnn_label, merged_conf, decision)
        return {
            "final_label": cnn_label,
            "confidence": merged_conf,
            "decision": decision,
            "top_predictions": top_predictions[:2],
        }

    # Case 2: trust pretrained when it's strong and CNN is weak
    if pt_conf >= PRETRAINED_HIGH_CONF and cnn_conf < CNN_WEAK_CONF:
        second = {"label": cnn_label, "confidence": cnn_conf}
        top_predictions = [{"label": pt_label, "confidence": pt_conf}, second]
        top_predictions.sort(key=lambda r: float(r["confidence"]), reverse=True)
        decision = "verified"
        decision = _apply_easy_class_adjustment(pt_label, pt_conf, decision)
        return {
            "final_label": pt_label,
            "confidence": pt_conf,
            "decision": decision,
            "top_predictions": top_predictions[:2],
        }

    # Case 3: both low confidence
    if cnn_conf < BOTH_LOW_CONF and pt_conf < BOTH_LOW_CONF:
        top_predictions = [
            {"label": pt_label, "confidence": pt_conf},
            {"label": cnn_label, "confidence": cnn_conf},
        ]
        top_predictions.sort(key=lambda r: float(r["confidence"]), reverse=True)
        return {
            "final_label": top_predictions[0]["label"],
            "confidence": float(top_predictions[0]["confidence"]),
            "decision": "unclear",
            "top_predictions": top_predictions[:2],
        }

    # Case 4: disagree and confidence gap is small
    if abs(pt_conf - cnn_conf) <= DISAGREE_SMALL_GAP:
        top_predictions = [
            {"label": pt_label, "confidence": pt_conf},
            {"label": cnn_label, "confidence": cnn_conf},
        ]
        top_predictions.sort(key=lambda r: float(r["confidence"]), reverse=True)
        return {
            "final_label": top_predictions[0]["label"],
            "confidence": float(top_predictions[0]["confidence"]),
            "decision": "uncertain",
            "top_predictions": top_predictions[:2],
        }

    # Default: pick higher-confidence model, but keep decision conservative
    if pt_conf >= cnn_conf:
        chosen_label, chosen_conf = pt_label, pt_conf
        other_label, other_conf = cnn_label, cnn_conf
    else:
        chosen_label, chosen_conf = cnn_label, cnn_conf
        other_label, other_conf = pt_label, pt_conf

    if chosen_conf >= THRESH_VERIFIED:
        decision = "verified"
    elif chosen_conf >= THRESH_REVIEW:
        decision = "needs_review"
    else:
        decision = "unclear"

    decision = _apply_easy_class_adjustment(chosen_label, float(chosen_conf), decision)

    return {
        "final_label": chosen_label,
        "confidence": float(chosen_conf),
        "decision": decision,
        "top_predictions": [
            {"label": chosen_label, "confidence": float(chosen_conf)},
            {"label": other_label, "confidence": float(other_conf)},
        ],
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="CNN model not loaded")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image = image.resize(IMAGE_SIZE, Image.BILINEAR)

        cnn_out = _predict_label_conf(model, class_names, image, CNN_TEMPERATURE)

        pt_out = None
        if pretrained_model is not None:
            pt_out = _predict_label_conf(pretrained_model, pretrained_class_names, image, PRETRAINED_TEMPERATURE)

        ensemble = _ensemble_decision(cnn_out, pt_out)

        return {
            "final_label": ensemble["final_label"],
            "confidence": ensemble["confidence"],
            "decision": ensemble["decision"],
            "top_predictions": ensemble["top_predictions"],
            "model_outputs": {
                "cnn": {"label": cnn_out["label"], "confidence": float(cnn_out["confidence"])},
                "pretrained": None if pt_out is None else {"label": pt_out["label"], "confidence": float(pt_out["confidence"])},
            },
            # Backward-compatible alias (server expects `prediction`)
            "prediction": ensemble["final_label"],
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))