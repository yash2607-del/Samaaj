from fastapi import FastAPI, File, UploadFile, Form
from huggingface_hub import hf_hub_download
try:
    import keras
    from keras.models import load_model
    print(f"📦 Using standalone Keras {keras.__version__}")
except ImportError:
    from tensorflow.keras.models import load_model
    print("📦 Using tensorflow.keras")
from PIL import Image
import io
import os
import sys

# Add current directory to path to import from core
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from core.predictor import predict_ensemble

app = FastAPI(title="Samaaj AI Service")

HF_REPO = "dishiii/samaaj-civic-classifier"

def load_all_models():
    models = {}
    # Try multiple possible directories for flexibility
    local_dirs = [
        os.path.join(project_root, "models_data"),
        os.path.join(project_root, "samaaj-civic-classifier")
    ]
    
    local_dir = next((d for d in local_dirs if os.path.exists(d)), local_dirs[0])
    
    # Ensure local_dir exists
    if not os.path.exists(local_dir):
        print(f"⚠️ Local model directory not found: {local_dir}")
        try:
            print(f"📁 Project root contents: {os.listdir(project_root)}")
        except:
            pass
    else:
        print(f"✅ Local model directory found: {local_dir}")
        try:
            print(f"📁 Local dir contents: {os.listdir(local_dir)}")
        except Exception as e:
            print(f"❌ Could not list local dir: {e}")

    # 1. Try CNN
    try:
        cnn_path = None
        # Try .dat (renamed to bypass LFS), .h5, then .keras
        for ext in [".dat", ".h5", ".keras"]:
            local_cnn = os.path.abspath(os.path.join(local_dir, f"civic_issue_model{ext}"))
            if os.path.exists(local_cnn):
                print(f"✅ Found CNN locally at: {local_cnn}")
                cnn_path = local_cnn
                break
        
        if not cnn_path:
            print("🌐 CNN not found locally. Downloading from Hugging Face...")
            cnn_path = hf_hub_download(repo_id=HF_REPO, filename="civic_issue_model.keras")
        
        if cnn_path:
            try:
                # Strategy 1: Standard load
                models["cnn"] = load_model(cnn_path)
            except Exception as e:
                print(f"⚠️ Standard load failed, trying compile=False: {e}")
                try:
                    # Strategy 2: Without compilation (fixes many format issues)
                    models["cnn"] = load_model(cnn_path, compile=False)
                except Exception as e2:
                    print(f"❌ All load strategies failed for CNN: {e2}")
                    raise e2
            print("✅ CNN loaded successfully")
    except Exception as e:
        print(f"❌ CNN load failed: {e}")
        # Try HF as fallback if local failed
        if "cnn" not in models:
            try:
                print("🔄 Retrying CNN download from HF...")
                cnn_path = hf_hub_download(repo_id=HF_REPO, filename="civic_issue_model.keras")
                models["cnn"] = load_model(cnn_path)
                print("✅ CNN loaded from HF after local failure")
            except Exception as e2:
                print(f"❌ CNN HF fallback also failed: {e2}")

    # 2. Try Pretrained
    try:
        pt_path = None
        for ext in [".dat", ".h5", ".keras"]:
            local_pt = os.path.abspath(os.path.join(local_dir, f"pretrained_model{ext}"))
            if os.path.exists(local_pt):
                pt_path = local_pt
                break
        
        if not pt_path:
            try:
                pt_path = hf_hub_download(repo_id=HF_REPO, filename="pretrained_model.keras")
            except:
                pass
        
        if pt_path:
            try:
                models["pretrained"] = load_model(pt_path)
            except:
                try:
                    models["pretrained"] = load_model(pt_path, compile=False)
                except:
                    pass
            print("✅ Pretrained loaded successfully")
    except Exception as e:
        print(f"⚠️ Pretrained not available: {e}")
        
    return models

# Initialize models
MODELS = load_all_models()

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    title: str = Form(""),
    description: str = Form(""),
    category: str = Form("")
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        if not MODELS:
            return {"error": "ML Service Error: No models loaded. Please check service logs."}
            
        # Inject loaded models into predictor module
        import core.predictor as predictor
        predictor.models = MODELS
        
        result = predict_ensemble(
            image, 
            title=title, 
            description=description, 
            user_category=category
        )
        
        if result is None:
            return {"error": "ML Service Error: Ensemble prediction returned None. This usually means the models failed to process the image."}
            
        return result
    except Exception as e:
        print(f"Prediction Error: {e}")
        return {"error": str(e)}

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": list(MODELS.keys())}