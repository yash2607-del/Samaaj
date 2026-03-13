import io
import json
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image

app = FastAPI(title="Samaaj ML Service", version="2.0")

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
CLASS_NAMES = []
IMAGE_SIZE = (224, 224)


def _parse_image_size(raw: str):
    if not raw:
        return None

    parts = [part.strip() for part in str(raw).split(",") if part.strip()]
    if len(parts) != 2:
        return None

    try:
        height = int(parts[0])
        width = int(parts[1])
        if height > 0 and width > 0:
            return (height, width)
    except ValueError:
        return None

    return None


def _load_json(path: Path):
    if not path.exists():
        return None

    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _resolve_model_path():
    env_model = os.getenv("MODEL_PATH")
    candidates = []

    if env_model:
        candidates.append(Path(env_model))

    candidates.extend(
        [
            ARTIFACTS_DIR / "civic_issue_model.keras",
            REPO_ROOT / "civic_issue_model.keras",
            REPO_ROOT / "civic_issue_model.h5",
        ]
    )

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate

    return None


def _class_names_from_dirs():
    split_train = REPO_ROOT / "dataset_split" / "train"
    raw_dataset = REPO_ROOT / "dataset"

    for base in (split_train, raw_dataset):
        if base.exists() and base.is_dir():
            names = sorted([d.name for d in base.iterdir() if d.is_dir()])
            if names:
                return names

    return []


def _resolve_class_names(num_outputs: int):
    env_classes = os.getenv("CLASS_NAMES", "").strip()
    if env_classes:
        names = [name.strip() for name in env_classes.split(",") if name.strip()]
        if names:
            return names

    class_name_candidates = [
        ARTIFACTS_DIR / "class_names.json",
        REPO_ROOT / "class_names.json",
    ]
    for json_path in class_name_candidates:
        payload = _load_json(json_path)
        if isinstance(payload, list) and payload:
            return [str(item) for item in payload]

    dir_names = _class_names_from_dirs()
    if dir_names:
        return dir_names

    return [f"class_{idx}" for idx in range(max(1, int(num_outputs)))]


def _resolve_image_size():
    env_size = _parse_image_size(os.getenv("MODEL_IMAGE_SIZE", ""))
    if env_size:
        return env_size

    meta_candidates = [
        ARTIFACTS_DIR / "model_meta.json",
        REPO_ROOT / "model_meta.json",
    ]
    for meta_path in meta_candidates:
        payload = _load_json(meta_path)
        if not isinstance(payload, dict):
            continue
        raw_size = payload.get("image_size")
        if isinstance(raw_size, list) and len(raw_size) == 2:
            try:
                h, w = int(raw_size[0]), int(raw_size[1])
                if h > 0 and w > 0:
                    return (h, w)
            except (TypeError, ValueError):
                continue

    return (224, 224)


def _align_class_names(class_names, num_outputs: int):
    names = list(class_names)
    if len(names) < num_outputs:
        names.extend([f"class_{idx}" for idx in range(len(names), num_outputs)])
    elif len(names) > num_outputs:
        names = names[:num_outputs]

    return names


def _load_model_bundle():
    model_path = _resolve_model_path()
    if not model_path:
        print("[ML] No model file found. Set MODEL_PATH or train a model first.")
        return None, [], (224, 224), None

    try:
        model_instance = tf.keras.models.load_model(model_path)
    except Exception as exc:
        print(f"[ML] Failed to load model from {model_path}: {exc}")
        return None, [], (224, 224), model_path

    num_outputs = int(model_instance.output_shape[-1])
    class_names = _resolve_class_names(num_outputs)
    class_names = _align_class_names(class_names, num_outputs)
    image_size = _resolve_image_size()

    print(f"[ML] Model loaded: {model_path}")
    print(f"[ML] Output classes: {len(class_names)} | Image size: {image_size[0]}x{image_size[1]}")
    return model_instance, class_names, image_size, model_path


model, CLASS_NAMES, IMAGE_SIZE, ACTIVE_MODEL_PATH = _load_model_bundle()


def preprocess_image(image_bytes: bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((IMAGE_SIZE[1], IMAGE_SIZE[0]))
        img_array = np.array(img, dtype=np.float32) / 255.0
        return np.expand_dims(img_array, axis=0)
    except Exception as exc:
        raise ValueError(f"Invalid image: {exc}") from exc


@app.get("/health")
async def health():
    return {
        "ok": model is not None,
        "model_path": str(ACTIVE_MODEL_PATH) if ACTIVE_MODEL_PATH else None,
        "num_classes": len(CLASS_NAMES),
        "image_size": list(IMAGE_SIZE),
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        image_bytes = await file.read()
        img_array = preprocess_image(image_bytes)
        prediction_vector = model.predict(img_array, verbose=0)[0]

        predicted_index = int(np.argmax(prediction_vector))
        confidence = float(prediction_vector[predicted_index])
        predicted_class = CLASS_NAMES[predicted_index] if predicted_index < len(CLASS_NAMES) else "Other"

        top_indices = np.argsort(prediction_vector)[::-1][:3]
        top_predictions = [
            {
                "class": CLASS_NAMES[int(idx)] if int(idx) < len(CLASS_NAMES) else f"class_{int(idx)}",
                "confidence": float(prediction_vector[int(idx)]),
            }
            for idx in top_indices
        ]

        return {
            "prediction": predicted_class,
            "confidence": confidence,
            "top_predictions": top_predictions,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
