from __future__ import annotations

import argparse
from pathlib import Path


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def parse_args():
    parser = argparse.ArgumentParser(description="Validate dataset folder structure for flow_from_directory.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "dataset",
        help="Dataset root folder (expected: <root>/<class_name>/<image>).",
    )
    parser.add_argument(
        "--min-per-class",
        type=int,
        default=10,
        help="Warn if a class has fewer than this many images.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    root = args.root.resolve()

    if not root.exists():
        raise FileNotFoundError(f"Dataset root not found: {root}")

    if any(p.is_file() for p in root.iterdir()):
        raise SystemExit(f"Invalid structure: dataset root contains files: {root}")

    class_dirs = sorted([p for p in root.iterdir() if p.is_dir()])
    if not class_dirs:
        raise SystemExit(f"No class folders found in: {root}")

    bad_classes = []
    warnings = []

    for class_dir in class_dirs:
        images = [p for p in class_dir.rglob("*") if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS]
        if len(images) == 0:
            bad_classes.append(class_dir.name)
        if len(images) < args.min_per_class:
            warnings.append((class_dir.name, len(images)))

    if bad_classes:
        raise SystemExit(f"Empty class folders found: {bad_classes}")

    print(f"OK: {len(class_dirs)} classes under {root}")
    if warnings:
        print("Warnings (few images):")
        for name, count in warnings:
            print(f"  - {name}: {count}")


if __name__ == "__main__":
    main()
