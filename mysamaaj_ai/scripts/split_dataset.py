from __future__ import annotations

from pathlib import Path

import splitfolders


BASE_DIR = Path(__file__).resolve().parents[1]  # mysamaaj_ai/
DATASET_DIR = BASE_DIR / "dataset"
OUT_DIR = BASE_DIR / "dataset_split"


def main():
    if not DATASET_DIR.exists():
        raise FileNotFoundError(f"Dataset folder not found: {DATASET_DIR}")

    splitfolders.ratio(
        str(DATASET_DIR),
        output=str(OUT_DIR),
        seed=42,
        ratio=(0.8, 0.2),
        group_prefix=None,
    )

    print(f"Dataset split created at: {OUT_DIR}")


if __name__ == "__main__":
    main()