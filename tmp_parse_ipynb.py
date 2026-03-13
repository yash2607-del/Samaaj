import json

with open("mysamaaj.ipynb", "r", encoding="utf-8") as f:
    notebook = json.load(f)

for i, cell in enumerate(notebook["cells"]):
    if cell["cell_type"] == "code":
        source = "".join(cell["source"])
        if "classes=" in source or "class_names" in source or "labels" in source or "categories" in source:
            print(f"--- Cell {i} ---")
            print(source[:500])
