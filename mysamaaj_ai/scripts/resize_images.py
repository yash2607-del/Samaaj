from __future__ import annotations

from pathlib import Path

from PIL import Image


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
BASE_DIR = Path(__file__).resolve().parents[1]  # mysamaaj_ai/
DATASET_DIR = BASE_DIR / "dataset"
TARGET_SIZE = (224, 224)


def main():
    if not DATASET_DIR.exists():
        raise FileNotFoundError(f"Dataset folder not found: {DATASET_DIR}")

    processed = 0
    skipped = 0

    for path in DATASET_DIR.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            skipped += 1
            continue
        try:
            img = Image.open(path).convert("RGB")
            img = img.resize(TARGET_SIZE)
            # Preserve original extension when possible; default to JPEG for unknown
            if path.suffix.lower() in {".jpg", ".jpeg"}:
                img.save(path, "JPEG", quality=85)
            else:
                img.save(path)
            processed += 1
        except Exception:
            skipped += 1

    print(f"Images resized to {TARGET_SIZE[0]}x{TARGET_SIZE[1]} | processed={processed} skipped={skipped}")


if __name__ == "__main__":
    main()