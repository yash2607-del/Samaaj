import json
import io

with open("mysamaaj.ipynb", "r", encoding="utf-8") as f:
    nb = json.load(f)

output = io.StringIO()
for cell in nb.get("cells", []):
    if cell["cell_type"] == "code":
        src = "".join(cell.get("source", []))
        if "categories = " in src or "labels = " in src or "class_names" in src or "issueToCategoryMap" in src or "classes" in src:
            output.write(src)
            output.write("\n" + "-" * 80 + "\n")

with open("tmp_classes_output.txt", "w", encoding="utf-8") as f:
    f.write(output.getvalue())
