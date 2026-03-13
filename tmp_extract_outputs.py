import json
import io
import pprint

with open("mysamaaj.ipynb", "r", encoding="utf-8") as f:
    nb = json.load(f)

output = io.StringIO()
for cell in nb.get("cells", []):
    for out in cell.get("outputs", []):
        text = out.get("text", [])
        if isinstance(text, list):
            text = "".join(text)
        if "['" in text or "classes" in text or "belonging to" in text:
            output.write(text)
            output.write("\n" + "="*80 + "\n")

with open("tmp_notebook_outputs.txt", "w", encoding="utf-8") as f:
    f.write(output.getvalue())
