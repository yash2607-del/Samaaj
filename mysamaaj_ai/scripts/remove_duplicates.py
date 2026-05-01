from __future__ import annotations

from pathlib import Path

import imagehash
from PIL import Image


BASE_DIR = Path(__file__).resolve().parents[1]  # mysamaaj_ai/
DATASET_DIR = BASE_DIR / "dataset"


def main():
    if not DATASET_DIR.exists():
        raise FileNotFoundError(f"Dataset folder not found: {DATASET_DIR}")

    hashes: dict[str, str] = {}
    removed = 0
    errors = 0

    for path in DATASET_DIR.rglob("*"):
        if not path.is_file():
            continue
        try:
            with Image.open(path) as img:
                h = str(imagehash.phash(img))
            if h in hashes:
                path.unlink(missing_ok=True)
                removed += 1
            else:
                hashes[h] = str(path)
        except Exception:
            # Don't auto-delete on any exception; count and continue.
            errors += 1

    print(f"Duplicate removal complete | removed={removed} hash_errors={errors}")


if __name__ == "__main__":
    main()