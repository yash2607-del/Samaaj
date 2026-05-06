import os

THRESH_VERIFIED = float(os.getenv("THRESH_VERIFIED", "0.70"))
THRESH_REVIEW = float(os.getenv("THRESH_REVIEW", "0.40"))

def decision_from_confidence(confidence: float, prediction: str = "") -> str:
    # Explicit Irrelevant Class check
    if prediction.lower() in ["irrelevant", "non_civic"]:
        return "unclear"
        
    if confidence >= THRESH_VERIFIED:
        return "verified"
    if confidence >= THRESH_REVIEW:
        return "needs_review"
    return "unclear"

def get_thresholds():
    return {
        "verified": THRESH_VERIFIED,
        "needs_review": THRESH_REVIEW,
    }
