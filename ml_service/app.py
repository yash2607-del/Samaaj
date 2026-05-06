import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from PIL import Image
from core.predictor import load_model, predict_ensemble

app = FastAPI(title="Samaaj ML Service - Ensemble Engine")

# Load models on startup
models = load_model()

@app.get("/health")
async def health():
    return {
        "status": "online",
        "models_loaded": list(models.keys()),
        "ensemble_ready": len(models) > 0
    }

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    title: str = Form(""),
    description: str = Form(""),
    category: str = Form("")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        result = predict_ensemble(image, title=title, description=description, user_category=category)
        
        if not result:
            raise HTTPException(status_code=500, detail="Prediction failed: No models available.")
            
        return result
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))