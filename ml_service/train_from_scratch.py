import argparse
import json
import random
import shutil
from datetime import datetime
from pathlib import Path

import numpy as np
import tensorflow as tf

VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
BASE_DIR = Path(__file__).resolve().parent


def parse_args():
    parser = argparse.ArgumentParser(description="Train Samaaj civic issue classifier from scratch.")
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=BASE_DIR.parent / "dataset",
        help="Raw dataset root with one folder per class",
    )
    parser.add_argument(
        "--split-dir",
        type=Path,
        default=BASE_DIR.parent / "dataset_split",
        help="Output split folder (train/val/test)",
    )
    parser.add_argument(
        "--artifacts-dir",
        type=Path,
        default=BASE_DIR / "artifacts",
        help="Directory to save model and metadata",
    )
    parser.add_argument("--model-name", type=str, default="civic_issue_model.keras", help="Saved model filename")
    parser.add_argument("--img-size", type=int, default=224, help="Image size used for training")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--epochs", type=int, default=35, help="Max training epochs")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--train-ratio", type=float, default=0.70, help="Train split ratio")
    parser.add_argument("--val-ratio", type=float, default=0.15, help="Validation split ratio")
    parser.add_argument("--test-ratio", type=float, default=0.15, help="Test split ratio")
    parser.add_argument(
        "--use-existing-split",
        action="store_true",
        help="Use existing split-dir as-is instead of rebuilding from dataset-dir",
    )
    return parser.parse_args()


def check_split_ratios(train_ratio, val_ratio, test_ratio):
    total = train_ratio + val_ratio + test_ratio
    if abs(total - 1.0) > 1e-6:
        raise ValueError(f"Split ratios must sum to 1.0, got {total:.4f}")


def list_class_files(dataset_dir: Path):
    class_to_files = {}
    classes = sorted([p for p in dataset_dir.iterdir() if p.is_dir()])
    if not classes:
        raise ValueError(f"No class folders found in {dataset_dir}")

    for class_dir in classes:
        files = [
            file_path
            for file_path in class_dir.rglob("*")
            if file_path.is_file() and file_path.suffix.lower() in VALID_IMAGE_EXTENSIONS
        ]
        if len(files) < 3:
            raise ValueError(
                f"Class '{class_dir.name}' has only {len(files)} image(s). At least 3 are required for train/val/test split."
            )
        class_to_files[class_dir.name] = sorted(files)

    return class_to_files


def split_files(files, train_ratio, val_ratio, test_ratio, rng):
    items = list(files)
    rng.shuffle(items)
    total = len(items)

    test_count = max(1, int(round(total * test_ratio)))
    val_count = max(1, int(round(total * val_ratio)))
    train_count = total - test_count - val_count

    if train_count < 1:
        overflow = 1 - train_count
        while overflow > 0 and val_count > 1:
            val_count -= 1
            overflow -= 1
        while overflow > 0 and test_count > 1:
            test_count -= 1
            overflow -= 1
        train_count = total - test_count - val_count

    if train_count < 1:
        raise ValueError(f"Not enough samples ({total}) to split into train/val/test")

    train_files = items[:train_count]
    val_files = items[train_count : train_count + val_count]
    test_files = items[train_count + val_count :]

    return train_files, val_files, test_files


def ensure_clean_split_dir(split_dir: Path):
    if split_dir.exists():
        shutil.rmtree(split_dir)
    for subset in ("train", "val", "test"):
        (split_dir / subset).mkdir(parents=True, exist_ok=True)


def copy_split_files(split_dir: Path, class_name: str, train_files, val_files, test_files):
    mapping = {
        "train": train_files,
        "val": val_files,
        "test": test_files,
    }

    for subset, subset_files in mapping.items():
        subset_class_dir = split_dir / subset / class_name
        subset_class_dir.mkdir(parents=True, exist_ok=True)
        for src in subset_files:
            dst = subset_class_dir / src.name
            # Handle accidental duplicate names by appending an index.
            if dst.exists():
                stem, suffix = src.stem, src.suffix
                index = 1
                while True:
                    candidate = subset_class_dir / f"{stem}_{index}{suffix}"
                    if not candidate.exists():
                        dst = candidate
                        break
                    index += 1
            shutil.copy2(src, dst)


def build_or_validate_split(args):
    split_dir = args.split_dir.resolve()

    if args.use_existing_split:
        for subset in ("train", "val", "test"):
            subset_dir = split_dir / subset
            if not subset_dir.exists() or not any(subset_dir.iterdir()):
                raise ValueError(f"Missing or empty split subset: {subset_dir}")
        print(f"Using existing split at: {split_dir}")
        return split_dir

    dataset_dir = args.dataset_dir.resolve()
    if not dataset_dir.exists():
        raise ValueError(f"Dataset directory not found: {dataset_dir}")

    class_to_files = list_class_files(dataset_dir)
    rng = random.Random(args.seed)

    ensure_clean_split_dir(split_dir)

    summary = []
    for class_name, files in class_to_files.items():
        train_files, val_files, test_files = split_files(
            files,
            args.train_ratio,
            args.val_ratio,
            args.test_ratio,
            rng,
        )
        copy_split_files(split_dir, class_name, train_files, val_files, test_files)
        summary.append(
            {
                "class": class_name,
                "train": len(train_files),
                "val": len(val_files),
                "test": len(test_files),
                "total": len(files),
            }
        )

    print("Created dataset split:")
    for row in summary:
        print(
            f"- {row['class']}: train={row['train']}, val={row['val']}, test={row['test']} (total={row['total']})"
        )

    return split_dir


def create_dataset(directory: Path, img_size: int, batch_size: int, shuffle: bool, seed: int):
    return tf.keras.utils.image_dataset_from_directory(
        directory,
        labels="inferred",
        label_mode="int",
        image_size=(img_size, img_size),
        batch_size=batch_size,
        shuffle=shuffle,
        seed=seed,
    )


def build_model(num_classes: int, img_size: int):
    inputs = tf.keras.Input(shape=(img_size, img_size, 3), name="image")

    x = tf.keras.layers.RandomFlip("horizontal")(inputs)
    x = tf.keras.layers.RandomRotation(0.08)(x)
    x = tf.keras.layers.RandomZoom(0.15)(x)
    x = tf.keras.layers.RandomContrast(0.1)(x)
    x = tf.keras.layers.Rescaling(1.0 / 255.0)(x)

    for filters in (32, 64, 128, 256):
        x = tf.keras.layers.Conv2D(filters, 3, padding="same", activation="relu")(x)
        x = tf.keras.layers.BatchNormalization()(x)
        x = tf.keras.layers.MaxPooling2D()(x)

    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.35)(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="prediction")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="samaaj_civic_classifier")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def count_images(split_dir: Path, subset: str):
    subset_dir = split_dir / subset
    return len(
        [
            path
            for path in subset_dir.rglob("*")
            if path.is_file() and path.suffix.lower() in VALID_IMAGE_EXTENSIONS
        ]
    )


def save_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


def main():
    args = parse_args()
    check_split_ratios(args.train_ratio, args.val_ratio, args.test_ratio)

    tf.random.set_seed(args.seed)
    np.random.seed(args.seed)
    random.seed(args.seed)

    split_dir = build_or_validate_split(args)

    train_ds = create_dataset(split_dir / "train", args.img_size, args.batch_size, shuffle=True, seed=args.seed)
    val_ds = create_dataset(split_dir / "val", args.img_size, args.batch_size, shuffle=False, seed=args.seed)
    test_ds = create_dataset(split_dir / "test", args.img_size, args.batch_size, shuffle=False, seed=args.seed)

    class_names = list(train_ds.class_names)
    num_classes = len(class_names)

    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(autotune)
    val_ds = val_ds.prefetch(autotune)
    test_ds = test_ds.prefetch(autotune)

    artifacts_dir = args.artifacts_dir.resolve()
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    model_path = artifacts_dir / args.model_name
    best_model_path = artifacts_dir / f"best_{args.model_name}"

    model = build_model(num_classes, args.img_size)
    print(model.summary())

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=8, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=4, min_lr=1e-6),
        tf.keras.callbacks.ModelCheckpoint(filepath=str(best_model_path), monitor="val_accuracy", save_best_only=True),
    ]

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=callbacks,
        verbose=1,
    )

    model.save(model_path)

    if best_model_path.exists():
        best_model = tf.keras.models.load_model(best_model_path)
        loss, accuracy = best_model.evaluate(test_ds, verbose=1)
        export_model = best_model
    else:
        loss, accuracy = model.evaluate(test_ds, verbose=1)
        export_model = model

    final_model_path = artifacts_dir / "civic_issue_model.keras"
    export_model.save(final_model_path)

    history_payload = {key: [float(v) for v in values] for key, values in history.history.items()}
    save_json(artifacts_dir / "training_history.json", history_payload)
    save_json(artifacts_dir / "class_names.json", class_names)

    meta = {
        "created_at": datetime.utcnow().isoformat() + "Z",
        "model_path": str(final_model_path),
        "class_names": class_names,
        "num_classes": num_classes,
        "image_size": [args.img_size, args.img_size],
        "batch_size": args.batch_size,
        "epochs_requested": args.epochs,
        "train_samples": count_images(split_dir, "train"),
        "val_samples": count_images(split_dir, "val"),
        "test_samples": count_images(split_dir, "test"),
        "test_loss": float(loss),
        "test_accuracy": float(accuracy),
    }
    save_json(artifacts_dir / "model_meta.json", meta)

    print("\nTraining complete")
    print(f"- Saved model: {final_model_path}")
    print(f"- Saved class names: {artifacts_dir / 'class_names.json'}")
    print(f"- Test accuracy: {accuracy:.4f}")


if __name__ == "__main__":
    main()
