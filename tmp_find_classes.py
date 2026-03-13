import json

with open("mysamaaj.ipynb", "r", encoding="utf-8") as f:
    nb = json.load(f)

for cell in nb["cells"]:
    if cell["cell_type"] == "code":
        src = "".join(cell["source"])
        if "labels" in src or "class_names" in src or "class" in src:
            for line in src.split("\n"):
                if "class_names" in line or "labels" in line:
                    print(line)
