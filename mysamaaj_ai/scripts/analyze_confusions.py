from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_VAL_DIR = PROJECT_ROOT / "mysamaaj_ai" / "dataset_split" / "val"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Analyze validation confusions and suggest potentially overlapping classes."
    )
    parser.add_argument(
        "--val",
        type=Path,
        default=DEFAULT_VAL_DIR,
        help="Validation folder: <val>/<label>/<image>",
    )
    parser.add_argument("--max", type=int, default=800, help="Max images to scan")
    parser.add_argument(
        "--min-confusion-rate",
        type=float,
        default=0.25,
        help="Suggest merges when a class is confused with another >= this fraction.",
    )
    return parser.parse_args()


def list_images(root: Path):
    files = []
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS:
            files.append(p)
    return files


def infer_true_label(image_path: Path, val_root: Path) -> str:
    try:
        rel = image_path.relative_to(val_root)
        if len(rel.parts) >= 2:
            return rel.parts[0]
    except Exception:
        pass
    return image_path.parent.name


def load_ml_app():
    sys.path.insert(0, str(PROJECT_ROOT))
    import Samaaj.mysamaaj_ai.app as ml_app

    if getattr(ml_app, "model", None) is None:
        raise RuntimeError("Model is not loaded. Set MODEL_PATH or train a model first.")
    return ml_app


def predict_label(ml_app, image_path: Path) -> str:
    image = Image.open(image_path).convert("RGB")
    image = image.resize(ml_app.IMAGE_SIZE, Image.BILINEAR)
    probs, _, _ = ml_app._predict_with_tta(image)
    probs = np.asarray(probs, dtype=np.float32)
    idx = int(np.argmax(probs))
    return ml_app.class_names[idx] if idx < len(ml_app.class_names) else f"class_{idx}"


def main():
    args = parse_args()
    val_root = args.val.resolve()
    if not val_root.exists():
        raise FileNotFoundError(f"Validation folder not found: {val_root}")

    ml_app = load_ml_app()

    images = list_images(val_root)
    if not images:
        raise RuntimeError(f"No images found under {val_root}")

    # confusion[true][pred] counts
    confusion = defaultdict(lambda: defaultdict(int))
    total_by_true = defaultdict(int)

    for i, img_path in enumerate(images[: args.max if args.max > 0 else len(images)]):
        true_label = infer_true_label(img_path, val_root)
        try:
            pred_label = predict_label(ml_app, img_path)
        except Exception:
            continue

        confusion[true_label][pred_label] += 1
        total_by_true[true_label] += 1

    pairs = []
    for true_label, row in confusion.items():
        total = total_by_true[true_label]
        if total <= 0:
            continue
        # ignore self
        for pred_label, count in row.items():
            if pred_label == true_label:
                continue
            rate = count / total
            pairs.append((rate, count, total, true_label, pred_label))

    pairs.sort(reverse=True, key=lambda x: (x[0], x[1]))

    print("Top confusions (true -> predicted)")
    print("-" * 72)
    for rate, count, total, true_label, pred_label in pairs[:15]:
        print(f"{true_label:22} -> {pred_label:22}  {count:4}/{total:<4} ({rate:.1%})")

    print("\nMerge suggestions (high confusion pairs)")
    print("-" * 72)
    suggestions = [p for p in pairs if p[0] >= args.min_confusion_rate]
    if not suggestions:
        print("No merge suggestions at current threshold.")
        return

    for rate, count, total, true_label, pred_label in suggestions[:10]:
        print(f"Consider reviewing/merging: '{true_label}' vs '{pred_label}' (confusion {rate:.1%})")


if __name__ == "__main__":
    main()
