from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from PIL import Image


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def parse_args():
    parser = argparse.ArgumentParser(description="Remove or quarantine corrupt/unreadable images.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "dataset",
        help="Dataset root (class-wise folders).",
    )
    parser.add_argument(
        "--quarantine",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "dataset_quarantine",
        help="Folder to move corrupt images into. If --delete is set, quarantine is ignored.",
    )
    parser.add_argument(
        "--delete",
        action="store_true",
        help="Delete corrupt images instead of moving them to quarantine.",
    )
    return parser.parse_args()


def is_valid_image(path: Path) -> bool:
    try:
        with Image.open(path) as img:
            img.verify()
        # Re-open to ensure it can be decoded (verify() doesn't always decode)
        with Image.open(path) as img:
            img.convert("RGB")
        return True
    except Exception:
        return False


def main():
    args = parse_args()
    root = args.root.resolve()

    if not root.exists():
        raise FileNotFoundError(f"Dataset root not found: {root}")

    quarantine = args.quarantine.resolve()

    scanned = 0
    corrupt = 0
    moved_or_deleted = 0

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        scanned += 1
        if is_valid_image(path):
            continue

        corrupt += 1

        if args.delete:
            path.unlink(missing_ok=True)
            moved_or_deleted += 1
            continue

        rel = path.relative_to(root)
        dst = quarantine / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        try:
            shutil.move(str(path), str(dst))
            moved_or_deleted += 1
        except Exception:
            # If moving fails, leave file in place
            pass

    action = "deleted" if args.delete else "quarantined"
    print(f"Scanned={scanned} corrupt={corrupt} {action}={moved_or_deleted}")


if __name__ == "__main__":
    main()
