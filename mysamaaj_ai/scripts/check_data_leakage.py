from __future__ import annotations

import argparse
import hashlib
from pathlib import Path


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def parse_args():
    parser = argparse.ArgumentParser(description="Check for data leakage between train/val splits.")
    base = Path(__file__).resolve().parents[1]
    parser.add_argument("--train", type=Path, default=base / "dataset_split" / "train")
    parser.add_argument("--val", type=Path, default=base / "dataset_split" / "val")
    parser.add_argument(
        "--mode",
        choices=["name", "hash"],
        default="hash",
        help="Leakage check mode: 'name' compares relative paths; 'hash' compares file content hashes.",
    )
    parser.add_argument("--max-files", type=int, default=0, help="Optional cap to speed up hashing (0 = no cap).")
    return parser.parse_args()


def sha1(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def list_images(root: Path):
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS:
            yield p


def main():
    args = parse_args()
    train = args.train.resolve()
    val = args.val.resolve()

    if not train.exists() or not val.exists():
        raise FileNotFoundError(f"Missing split folders. train={train} val={val}")

    if args.mode == "name":
        train_rel = {str(p.relative_to(train)).lower() for p in list_images(train)}
        val_rel = {str(p.relative_to(val)).lower() for p in list_images(val)}
        overlap = sorted(train_rel.intersection(val_rel))
        if overlap:
            print(f"LEAKAGE FOUND (relative-path overlap): {len(overlap)}")
            for row in overlap[:25]:
                print(f"  {row}")
            raise SystemExit(1)
        print("OK: no relative-path overlap between train and val")
        return

    train_hashes = {}
    val_hashes = {}

    def fill_hashes(root: Path, out: dict[str, str]):
        count = 0
        for p in list_images(root):
            out[sha1(p)] = str(p)
            count += 1
            if args.max_files and count >= args.max_files:
                break
        return count

    train_count = fill_hashes(train, train_hashes)
    val_count = fill_hashes(val, val_hashes)

    overlap_hashes = sorted(set(train_hashes.keys()).intersection(val_hashes.keys()))
    if overlap_hashes:
        print(f"LEAKAGE FOUND (content-hash overlap): {len(overlap_hashes)}")
        for h in overlap_hashes[:25]:
            print(f"  train={train_hashes[h]}")
            print(f"  val  ={val_hashes[h]}")
        raise SystemExit(1)

    print(f"OK: no content overlap between train and val | train_files={train_count} val_files={val_count}")


if __name__ == "__main__":
    main()
