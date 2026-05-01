import argparse
import json
import random
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_VAL_DIR = PROJECT_ROOT / "mysamaaj_ai" / "dataset_split" / "val"
DEFAULT_TRAIN_DIR = PROJECT_ROOT / "mysamaaj_ai" / "dataset_split" / "train"
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "mysamaaj_ai" / "demo_eval_samples"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Create a demo-ready evaluation set (4-5 correctly classified images)."
    )
    parser.add_argument("--count", type=int, default=5, help="Number of demo images to select")
    parser.add_argument(
        "--source",
        type=Path,
        default=DEFAULT_VAL_DIR,
        help="Primary source folder. Expected structure: <source>/<label>/<image>."
    )
    parser.add_argument(
        "--train-fallback",
        type=Path,
        default=DEFAULT_TRAIN_DIR,
        help="Fallback source when not enough correct predictions are found in --source"
    )
    parser.add_argument(
        "--max-scan",
        type=int,
        default=800,
        help="Maximum number of images to evaluate from each source"
    )
    parser.add_argument(
        "--min-confidence",
        type=float,
        default=0.45,
        help="Preferred minimum confidence while selecting demo samples"
    )
    parser.add_argument(
        "--min-gap",
        type=float,
        default=0.15,
        help="Minimum (top1 - top2) confidence gap for reliable demo samples"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for stable demo selection"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Output folder for copied demo images and JSON report"
    )
    parser.add_argument(
        "--image",
        action="append",
        default=[],
        help="Optional explicit image path. Repeat for multiple images."
    )
    return parser.parse_args()


def load_ml_module():
    # Reuse the exact same inference pipeline used by the FastAPI service.
    sys.path.insert(0, str(PROJECT_ROOT))
    import Samaaj.mysamaaj_ai.app as ml_app

    if getattr(ml_app, "model", None) is None:
        raise RuntimeError("Model is not loaded. Check MODEL_PATH and model file.")

    return ml_app


def list_images(root_dir: Path):
    if not root_dir.exists():
        return []

    files = []
    for p in root_dir.rglob("*"):
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS:
            files.append(p)
    return files


def infer_true_label(image_path: Path, source_root: Path):
    try:
        rel = image_path.relative_to(source_root)
        if len(rel.parts) >= 2:
            return rel.parts[0]
    except Exception:
        pass
    return image_path.parent.name


def predict_one(ml_app, image_path: Path):
    image = Image.open(image_path).convert("RGB")
    image = image.resize(ml_app.IMAGE_SIZE, Image.BILINEAR)

    prediction_vector, variant_agreement, variant_count = ml_app._predict_with_tta(image)
    top_idx = np.argsort(prediction_vector)[::-1]
    pred_index = int(top_idx[0])

    class_names = ml_app.class_names
    predicted_label = class_names[pred_index] if pred_index < len(class_names) else f"class_{pred_index}"
    confidence = float(prediction_vector[pred_index])

    top3 = []
    for idx in top_idx[:3]:
        i = int(idx)
        label = class_names[i] if i < len(class_names) else f"class_{i}"
        top3.append({"class": label, "confidence": float(prediction_vector[i])})

    top2_conf = float(prediction_vector[int(top_idx[1])]) if len(top_idx) > 1 else 0.0
    gap = float(confidence - top2_conf)

    return {
        "predicted_label": predicted_label,
        "confidence": confidence,
        "gap": gap,
        "variant_agreement": float(variant_agreement),
        "variant_count": int(variant_count),
        "top3": top3,
    }


def evaluate_paths(ml_app, image_paths, source_root: Path, max_scan: int):
    results = []
    for idx, image_path in enumerate(image_paths):
        if max_scan > 0 and idx >= max_scan:
            break

        pred = predict_one(ml_app, image_path)
        true_label = infer_true_label(image_path, source_root)

        results.append({
            "image_path": str(image_path),
            "true_label": true_label,
            "predicted_label": pred["predicted_label"],
            "confidence": pred["confidence"],
            "gap": pred["gap"],
            "variant_agreement": pred["variant_agreement"],
            "variant_count": pred["variant_count"],
            "correct": pred["predicted_label"] == true_label,
            "top3": pred["top3"],
        })

    return results


def choose_demo_samples(results, count: int, min_confidence: float, min_gap: float):
    preferred = [
        r
        for r in results
        if r["correct"] and r["confidence"] >= min_confidence and r.get("gap", 0.0) >= min_gap
    ]
    if len(preferred) < count:
        preferred = [r for r in results if r["correct"] and r.get("gap", 0.0) >= min_gap]

    preferred.sort(key=lambda r: (r["confidence"], r.get("gap", 0.0), r["variant_agreement"]), reverse=True)

    selected = []
    selected_paths = set()
    used_labels = set()

    for row in preferred:
        if row["true_label"] in used_labels:
            continue
        selected.append(row)
        selected_paths.add(row["image_path"])
        used_labels.add(row["true_label"])
        if len(selected) >= count:
            return selected

    for row in preferred:
        if row["image_path"] in selected_paths:
            continue
        selected.append(row)
        selected_paths.add(row["image_path"])
        if len(selected) >= count:
            break

    return selected


def copy_selected(selected, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)

    copied = []
    for index, row in enumerate(selected, start=1):
        src = Path(row["image_path"])
        safe_label = row["true_label"].replace(" ", "_")
        dst_name = f"{index:02d}_{safe_label}_{row['confidence']:.2f}{src.suffix.lower()}"
        dst = output_dir / dst_name
        shutil.copy2(src, dst)
        copied.append(str(dst))

    return copied


def print_summary(all_results, selected):
    total = len(all_results)
    correct = sum(1 for r in all_results if r["correct"])
    accuracy = (correct / total) if total else 0.0

    print("\nDemo Evaluation Summary")
    print("-" * 72)
    print(f"Scanned images   : {total}")
    print(f"Correct          : {correct}")
    print(f"Scan accuracy    : {accuracy:.2%}")
    print(f"Demo picks       : {len(selected)}")

    print("\nSelected Demo Images")
    print("-" * 72)
    print("#  true_label              predicted_label         conf    gap     agree  path")
    for i, row in enumerate(selected, start=1):
        print(
            f"{i:<2} {row['true_label'][:22]:<22} {row['predicted_label'][:22]:<22} "
            f"{row['confidence']:.3f}  {row.get('gap', 0.0):.3f}  {row['variant_agreement']:.2f}   {row['image_path']}"
        )


def main():
    args = parse_args()
    random.seed(args.seed)

    ml_app = load_ml_module()

    if args.image:
        explicit_paths = [Path(p).resolve() for p in args.image]
        explicit_paths = [p for p in explicit_paths if p.exists() and p.suffix.lower() in SUPPORTED_EXTENSIONS]
        if not explicit_paths:
            raise RuntimeError("No valid --image paths were provided.")
        random.shuffle(explicit_paths)
        all_results = evaluate_paths(ml_app, explicit_paths, PROJECT_ROOT, max_scan=0)
    else:
        primary_images = list_images(args.source)
        random.shuffle(primary_images)
        all_results = evaluate_paths(ml_app, primary_images, args.source, args.max_scan)

        if sum(1 for r in all_results if r["correct"]) < args.count and args.train_fallback.exists():
            fallback_images = list_images(args.train_fallback)
            random.shuffle(fallback_images)
            fallback_results = evaluate_paths(ml_app, fallback_images, args.train_fallback, args.max_scan)
            all_results.extend(fallback_results)

    selected = choose_demo_samples(all_results, args.count, args.min_confidence, args.min_gap)
    if not selected:
        raise RuntimeError("No correct predictions found. Try lowering --min-confidence or increasing --max-scan.")

    copied_paths = copy_selected(selected, args.output)

    report = {
        "source": str(args.source),
        "train_fallback": str(args.train_fallback),
        "count_requested": args.count,
        "count_selected": len(selected),
        "min_confidence": args.min_confidence,
        "min_gap": args.min_gap,
        "max_scan": args.max_scan,
        "selected": selected,
        "copied_images": copied_paths,
    }

    report_path = args.output / "demo_eval_report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print_summary(all_results, selected)
    print(f"\nReport written to: {report_path}")


if __name__ == "__main__":
    main()
