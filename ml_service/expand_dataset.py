import argparse
import json
import random
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

BASE_DIR = Path(__file__).resolve().parent
VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Expand raw dataset with synthetic augmentations to a target count per class."
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=BASE_DIR.parent / "dataset",
        help="Input dataset folder with one subfolder per class",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=BASE_DIR.parent / "dataset_augmented",
        help="Output folder for expanded dataset",
    )
    parser.add_argument(
        "--target-count",
        type=int,
        default=350,
        help="Minimum images per class after augmentation",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed",
    )
    parser.add_argument(
        "--clear-output",
        action="store_true",
        help="Delete output directory before generating dataset",
    )
    return parser.parse_args()


def list_class_images(dataset_dir: Path):
    classes = sorted([path for path in dataset_dir.iterdir() if path.is_dir()])
    if not classes:
        raise ValueError(f"No class folders found in: {dataset_dir}")

    class_map = {}
    for class_dir in classes:
        images = [
            path
            for path in class_dir.rglob("*")
            if path.is_file() and path.suffix.lower() in VALID_IMAGE_EXTENSIONS
        ]
        if not images:
            raise ValueError(f"Class '{class_dir.name}' has no valid images")
        class_map[class_dir.name] = sorted(images)
    return class_map


def random_crop_resize(image: Image.Image, rng: random.Random):
    width, height = image.size
    crop_ratio = rng.uniform(0.82, 1.0)
    new_w = max(16, int(width * crop_ratio))
    new_h = max(16, int(height * crop_ratio))

    left = rng.randint(0, max(0, width - new_w))
    top = rng.randint(0, max(0, height - new_h))
    cropped = image.crop((left, top, left + new_w, top + new_h))
    return cropped.resize((width, height), Image.Resampling.BICUBIC)


def add_noise(image: Image.Image, rng: random.Random):
    arr = np.asarray(image).astype(np.float32)
    sigma = rng.uniform(2.0, 10.0)
    noise = np.random.normal(0.0, sigma, arr.shape).astype(np.float32)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def augment_image(image: Image.Image, rng: random.Random):
    augmented = image.copy().convert("RGB")

    if rng.random() < 0.65:
        augmented = random_crop_resize(augmented, rng)

    if rng.random() < 0.55:
        angle = rng.uniform(-22.0, 22.0)
        augmented = augmented.rotate(angle, resample=Image.Resampling.BICUBIC)

    if rng.random() < 0.50:
        augmented = ImageEnhance.Brightness(augmented).enhance(rng.uniform(0.78, 1.28))

    if rng.random() < 0.50:
        augmented = ImageEnhance.Contrast(augmented).enhance(rng.uniform(0.78, 1.35))

    if rng.random() < 0.35:
        augmented = ImageEnhance.Color(augmented).enhance(rng.uniform(0.75, 1.30))

    if rng.random() < 0.30:
        augmented = ImageEnhance.Sharpness(augmented).enhance(rng.uniform(0.70, 1.40))

    if rng.random() < 0.25:
        radius = rng.uniform(0.2, 1.4)
        augmented = augmented.filter(ImageFilter.GaussianBlur(radius=radius))

    if rng.random() < 0.45:
        augmented = add_noise(augmented, rng)

    if rng.random() < 0.50:
        augmented = augmented.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    return augmented


def copy_original_images(images, output_class_dir: Path):
    copied = 0
    for index, source_path in enumerate(images):
        extension = source_path.suffix.lower()
        destination = output_class_dir / f"orig_{index:05d}{extension}"
        shutil.copy2(source_path, destination)
        copied += 1
    return copied


def generate_augmented_images(images, output_class_dir: Path, target_count: int, rng: random.Random):
    generated = 0

    existing_files = list(output_class_dir.glob("*"))
    counter = len(existing_files)

    while len(list(output_class_dir.glob("*"))) < target_count:
        source_path = rng.choice(images)
        with Image.open(source_path) as source_image:
            augmented = augment_image(source_image, rng)

        destination = output_class_dir / f"aug_{counter:05d}.jpg"
        augmented.save(destination, format="JPEG", quality=95)
        generated += 1
        counter += 1

    return generated


def main():
    args = parse_args()
    rng = random.Random(args.seed)
    np.random.seed(args.seed)

    input_dir = args.input_dir.resolve()
    output_dir = args.output_dir.resolve()

    if not input_dir.exists():
        raise ValueError(f"Input dataset does not exist: {input_dir}")
    if args.target_count < 1:
        raise ValueError("target-count must be >= 1")

    if args.clear_output and output_dir.exists():
        shutil.rmtree(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    class_images = list_class_images(input_dir)

    summary = []
    for class_name, images in class_images.items():
        output_class_dir = output_dir / class_name
        output_class_dir.mkdir(parents=True, exist_ok=True)

        copied = copy_original_images(images, output_class_dir)
        generated = 0

        if copied < args.target_count:
            generated = generate_augmented_images(images, output_class_dir, args.target_count, rng)

        final_count = len([path for path in output_class_dir.iterdir() if path.is_file()])

        summary.append(
            {
                "class": class_name,
                "original": len(images),
                "copied": copied,
                "generated": generated,
                "final": final_count,
            }
        )

        print(
            f"- {class_name}: original={len(images)}, generated={generated}, final={final_count}"
        )

    total_original = sum(item["original"] for item in summary)
    total_final = sum(item["final"] for item in summary)

    report = {
        "input_dir": str(input_dir),
        "output_dir": str(output_dir),
        "target_count": args.target_count,
        "total_original": total_original,
        "total_final": total_final,
        "classes": summary,
    }

    report_path = output_dir / "augmentation_report.json"
    with report_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\nAugmentation complete")
    print(f"- Report: {report_path}")
    print(f"- Total original images: {total_original}")
    print(f"- Total final images: {total_final}")


if __name__ == "__main__":
    main()
