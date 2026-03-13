import imagehash
from PIL import Image
import os

hashes = {}

dataset_path = "dataset"

for root, dirs, files in os.walk(dataset_path):

    for file in files:

        path = os.path.join(root, file)

        try:
            img = Image.open(path)
            h = str(imagehash.phash(img))

            if h in hashes:
                os.remove(path)
            else:
                hashes[h] = path

        except:
            os.remove(path)

print("Duplicate images removed")