from PIL import Image
import os

dataset_path = "dataset"

for root, dirs, files in os.walk(dataset_path):

    for file in files:

        path = os.path.join(root, file)

        try:
            img = Image.open(path).convert("RGB")
            img = img.resize((224,224))
            img.save(path,"JPEG",quality=85)

        except:
            pass

print("Images resized to 224x224")