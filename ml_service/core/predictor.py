import os
import json
import numpy as np
import tensorflow as tf
from PIL import Image, ImageStat

# Lazy load transformers to keep startup fast for CNN/Pretrained
pipeline = None

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
CLASS_NAMES_PATH = os.path.join(MODELS_DIR, "class_names.json")

# Constants
IMAGE_SIZE = (224, 224)
TEMPERATURE = 1.25 # Softmax sharpening

# Globals
models = {}
class_names = []

CIVIC_MAPPING = {
    "street": "road_issue",
    "highway": "road_issue",
    "road": "road_issue",
    "pothole": "pothole",
    "asphalt": "road_issue",
    "pavement": "road_issue",
    "trash": "garbage",
    "garbage": "garbage",
    "refuse": "garbage",
    "dump": "garbage",
    "waste": "garbage",
    "water": "water",
    "puddle": "water",
    "flood": "water",
    "leak": "water",
    "drain": "water",
    "lamp": "streetlight",
    "light": "streetlight",
    "pole": "streetlight",
    "lamppost": "streetlight"
}

# Behavior-based irrelevance indicators
CIVIC_DOMAINS = ["infrastructure", "sanitation", "utility", "public", "outdoor", "urban"]

def load_model():
    global models, class_names
    models = {}
    
    # 1. Load Custom CNN
    cnn_path = os.path.join(MODELS_DIR, "civic_issue_model.keras")
    if os.path.exists(cnn_path):
        try:
            models["cnn"] = tf.keras.models.load_model(cnn_path)
            print("Loaded Custom CNN")
        except Exception as e:
            print(f"Error loading CNN: {e}")

    # 2. Load Pretrained Model
    pretrained_path = os.path.join(MODELS_DIR, "pretrained_model.keras")
    if os.path.exists(pretrained_path):
        try:
            models["pretrained"] = tf.keras.models.load_model(pretrained_path)
            print("Loaded Pretrained Model")
        except Exception as e:
            print(f"Error loading Pretrained: {e}")

    # 3. Load Class Names
    if os.path.exists(CLASS_NAMES_PATH):
        with open(CLASS_NAMES_PATH, "r") as f:
            class_names = json.load(f)
            
    return models

def init_hf():
    global pipeline
    if pipeline is None:
        try:
            from transformers import pipeline as hf_pipeline
            # Using MobileNetV2-based model for speed/efficiency in CPU environment
            pipeline = hf_pipeline("image-classification", model="google/mobilenet_v2_1.0_224")
            print("Hugging Face model initialized (MobileNetV2)")
        except Exception as e:
            print(f"Error initializing HF: {e}")
    return pipeline

def apply_temperature_scaling(probs, temp):
    probs = np.power(probs, 1/temp)
    s = np.sum(probs)
    if s == 0: return probs
    return probs / s

def get_tta_variants(img_array):
    variants = [img_array]
    variants.append(np.flip(img_array, axis=1)) # Horizontal Flip
    variants.append(np.rot90(img_array, k=1, axes=(0, 1))) # 90 deg rotation
    return variants

def predict_single_model(model, img_array):
    variants = get_tta_variants(img_array)
    variant_preds = []
    
    for v in variants:
        input_v = np.expand_dims(v, axis=0)
        pred = model.predict(input_v, verbose=0)[0]
        variant_preds.append(pred)
    
    avg_pred = np.mean(variant_preds, axis=0)
    avg_pred = apply_temperature_scaling(avg_pred, TEMPERATURE)
    
    idx = np.argmax(avg_pred)
    return {
        "label": class_names[idx] if idx < len(class_names) else "unknown",
        "confidence": float(avg_pred[idx]),
        "probs": avg_pred
    }

def get_average_hash(image_pil):
    """Generate a 64-bit perceptual hash (average hash) for duplicate detection."""
    try:
        # Resize to 8x8 and convert to grayscale
        img = image_pil.convert('L').resize((8, 8), Image.Resampling.LANCZOS)
        pixels = np.array(img)
        avg = pixels.mean()
        # Binary string
        hash_str = "".join(['1' if p > avg else '0' for p in pixels.flatten()])
        # Convert to hex
        return hex(int(hash_str, 2))[2:].zfill(16)
    except Exception as e:
        print(f"Error generating hash: {e}")
        return ""

def check_image_quality(image_pil):
    """
    Detect:
    - blur (variance of Laplacian)
    - extremely dark/bright images
    - very low resolution
    """
    # 1. Resolution Check
    width, height = image_pil.size
    is_low_res = (width < 300 or height < 300)
    
    # 2. Brightness Check
    stat = ImageStat.Stat(image_pil.convert('L'))
    brightness = stat.mean[0]
    is_too_dark = brightness < 30
    is_too_bright = brightness > 225
    
    # 3. Blur Check (Manual Laplacian Variance)
    img_gray = np.array(image_pil.convert('L'), dtype=np.float32)
    if img_gray.shape[0] > 2 and img_gray.shape[1] > 2:
        laplacian = img_gray[1:-1, 1:-1] * -4 + \
                    img_gray[0:-2, 1:-1] + \
                    img_gray[2:, 1:-1] + \
                    img_gray[1:-1, 0:-2] + \
                    img_gray[1:-1, 2:]
        lap_var = laplacian.var()
    else:
        lap_var = 500 # Default safe value for tiny images
    
    is_blurry = lap_var < 100 # Threshold for "blurry"
    
    is_low_quality = is_low_res or is_too_dark or is_too_bright or is_blurry
    
    reasons = []
    if is_low_res: reasons.append("low_resolution")
    if is_too_dark: reasons.append("too_dark")
    if is_too_bright: reasons.append("too_bright")
    if is_blurry: reasons.append("blurry")
    
    return {
        "is_low_quality": is_low_quality,
        "reasons": reasons,
        "metrics": {
            "brightness": float(brightness),
            "laplacian_var": float(lap_var),
            "resolution": f"{width}x{height}"
        }
    }

def extract_context_label(title, description):
    text = f"{title} {description}".lower()
    
    keyword_map = {
        "pothole": ["pothole", "road broken", "potholes", "cracked road", "bad road"],
        "garbage": ["garbage", "overflowing bin", "trash", "waste", "dump"],
        "water": ["water leakage", "pipe burst", "flood", "waterlogging", "leak"]
    }
    
    for label, keywords in keyword_map.items():
        if any(kw in text for kw in keywords):
            return label
    return "unknown"

def run_hf_fallback(image_pil):
    hf = init_hf()
    if not hf: return None
    
    try:
        results = hf(image_pil)
        top = results[0]
        label = top["label"].lower()
        score = top["score"]
        
        mapped_label = "unknown"
        for key, val in CIVIC_MAPPING.items():
            if key in label:
                mapped_label = val
                break
        
        # Semantic match check for civic categories
        is_civic = any(domain in label for domain in CIVIC_DOMAINS) or mapped_label != "unknown"
        
        return {
            "label": label,
            "confidence": score,
            "mapped_label": mapped_label,
            "is_civic": is_civic
        }
    except Exception as e:
        print(f"HF Inference Error: {e}")
        return None

def predict_ensemble(image_pil, title="", description="", user_category=""):
    # 0. Image Quality Check (PRE-VALIDATION)
    quality = check_image_quality(image_pil)
    image_hash = get_average_hash(image_pil)

    img = image_pil.resize(IMAGE_SIZE)
    img_array = np.array(img, dtype=np.float32) / 255.0
    
    # 1. Text Context Extraction
    context_label = extract_context_label(title, description)
    
    # Category to Context Mapping
    cat_to_context = {
        "Road": "pothole",
        "Sanitization": "garbage",
        "Water": "water"
    }
    
    # 2. Base Model Predictions
    results = {}
    for name, model in models.items():
        results[name] = predict_single_model(model, img_array)
        
    if not results:
        print("⚠️ Warning: predict_ensemble called but 'models' is empty!")
        return None

    cnn = results.get("cnn")
    pretrained = results.get("pretrained")
    
    # 3. Improved Fusion Logic
    final_label = "unknown"
    confidence = 0.0
    agreement = False
    source = "none"
    
    if cnn and pretrained:
        if cnn["label"] == pretrained["label"]:
            final_label = cnn["label"]
            # Agreement Boost: +0.20
            confidence = min(1.0, max(cnn["confidence"], pretrained["confidence"]) + 0.20)
            agreement = True
            source = "ensemble_agreement"
        else:
            if cnn["confidence"] >= pretrained["confidence"]:
                final_label = cnn["label"]
                confidence = cnn["confidence"]
                source = "cnn_primary"
            else:
                final_label = pretrained["label"]
                confidence = pretrained["confidence"]
                source = "pretrained_primary"
    elif cnn:
        final_label = cnn["label"]
        confidence = cnn["confidence"]
        source = "cnn_only"
    elif pretrained:
        final_label = pretrained["label"]
        confidence = pretrained["confidence"]
        source = "pretrained_only"

    # Context Alignment Boost: +0.15
    if context_label != "unknown" and context_label in final_label:
        confidence = min(1.0, confidence + 0.15)
        
    # 4. STRONG CONTEXT OVERRIDE (CRITICAL FIX)
    category_match = context_label != "unknown" and cat_to_context.get(user_category) == context_label
    
    if category_match:
        final_label = context_label
        confidence = max(confidence, 0.7) 
        source = "strong_context_override"
    elif confidence < 0.4 and context_label != "unknown":
        final_label = context_label
        confidence = 0.45
        source = "context_override"

    # 5. Hugging Face Fallback Validator (If confidence < 0.4)
    hf_result = None
    if confidence < 0.4:
        hf_result = run_hf_fallback(image_pil)
        if hf_result:
            if hf_result["mapped_label"] != "unknown" and hf_result["confidence"] > 0.5:
                final_label = hf_result["mapped_label"]
                confidence = max(confidence, hf_result["confidence"] - 0.1)
                source = "hf_assisted"

    # 6. Intelligent Irrelevance Detection
    # Mark as irrelevant if HF labels belong to generic categories
    NON_CIVIC_LABELS = ["person", "selfie", "food", "animal", "sky", "indoor", "furniture", "room", "face"]
    is_irrelevant = False
    
    if hf_result is None:
        hf_result = run_hf_fallback(image_pil)
    
    if hf_result:
        hf_label = hf_result["label"].lower()
        if any(bad in hf_label for bad in NON_CIVIC_LABELS) and not hf_result["is_civic"]:
            if context_label == "unknown":
                is_irrelevant = True

    # 7. Decision Logic (FINAL OUTPUT)
    decision = "needs_review"
    report_tag = "clean"
    
    if quality["is_low_quality"]:
        report_tag = "low_quality"
        decision = "needs_review"

    # Final Spam Rule:
    # If low confidence (<0.2) AND no context AND irrelevant image
    if confidence < 0.2 and context_label == "unknown" and is_irrelevant:
        decision = "quarantined"
        report_tag = "quarantined"
    elif is_irrelevant:
        report_tag = "irrelevant"
        decision = "needs_review"
    
    # Standard Decision
    if decision not in ["quarantined"]:
        if source == "strong_context_override":
            decision = "verified"
        elif confidence > 0.55 or (context_label != "unknown" and confidence > 0.3):
            decision = "verified"
        elif confidence < 0.15:
            decision = "quarantined"
            report_tag = "quarantined"

    # 8. Trust Score Update (IMPROVED SCORING LOGIC)
    # Base = 0.5
    # +0.2 high ML confidence
    # +0.2 context matches prediction
    # -0.3 duplicate (handled in Node, set to 0 here)
    # -0.4 quarantined
    # -0.2 low quality image
    
    trust_score = 0.5
    if confidence > 0.7: trust_score += 0.2
    if context_label != "unknown" and (context_label in final_label or category_match): trust_score += 0.2
    
    if report_tag == "quarantined": trust_score -= 0.4
    if quality["is_low_quality"]: trust_score -= 0.2
    
    trust_score = max(0.0, min(1.0, trust_score))

    # Top 3 predictions
    all_probs = []
    if cnn: all_probs.append(cnn["probs"])
    if pretrained: all_probs.append(pretrained["probs"])
    
    top_predictions = []
    if all_probs:
        avg_ensemble_probs = np.mean(all_probs, axis=0)
        top_indices = np.argsort(avg_ensemble_probs)[-3:][::-1]
        top_predictions = [
            {"label": class_names[i], "confidence": float(avg_ensemble_probs[i])}
            for i in top_indices if i < len(class_names)
        ]

    return {
        "final_label": str(final_label),
        "confidence": float(confidence),
        "agreement": bool(agreement),
        "source": str(source),
        "cnn": {"label": str(cnn["label"]), "confidence": float(cnn["confidence"])} if cnn else None,
        "pretrained": {"label": str(pretrained["label"]), "confidence": float(pretrained["confidence"])} if pretrained else None,
        "hf": hf_result,
        "top_predictions": top_predictions,
        "decision": str(decision),
        "reportTag": str(report_tag),
        "trustScore": float(trust_score),
        "context_label": str(context_label),
        "quality": {
            "is_low_quality": bool(quality["is_low_quality"]),
            "reasons": quality["reasons"],
            "metrics": {
                "brightness": float(quality["metrics"]["brightness"]),
                "laplacian_var": float(quality["metrics"]["laplacian_var"]),
                "resolution": quality["metrics"]["resolution"]
            }
        },
        "imageHash": str(image_hash)
    }

