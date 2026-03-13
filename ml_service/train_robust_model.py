import argparse
import json
import random
import shutil
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import tensorflow as tf

BASE_DIR = Path(__file__).resolve().parent
VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Train robust civic issue classifier using transfer learning and class balancing."
    )
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=BASE_DIR.parent / "dataset_augmented",
        help="Dataset root with one folder per class",
    )
    parser.add_argument(
        "--split-dir",
        type=Path,
        default=BASE_DIR.parent / "dataset_split_robust",
        help="Output split folder (train/val/test)",
    )
    parser.add_argument(
        "--artifacts-dir",
        type=Path,
        default=BASE_DIR / "artifacts",
        help="Directory to save model and metadata",
    )
    parser.add_argument("--img-size", type=int, default=224, help="Image size")
    parser.add_argument("--batch-size", type=int, default=24, help="Batch size")
    parser.add_argument("--warmup-epochs", type=int, default=8, help="Head-only training epochs")
    parser.add_argument("--fine-tune-epochs", type=int, default=16, help="Fine-tune epochs")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--train-ratio", type=float, default=0.70, help="Train split ratio")
    parser.add_argument("--val-ratio", type=float, default=0.15, help="Validation split ratio")
    parser.add_argument("--test-ratio", type=float, default=0.15, help="Test split ratio")
    parser.add_argument(
        "--use-existing-split",
        action="store_true",
        help="Use existing split directory instead of rebuilding",
    )
    parser.add_argument(
        "--backbone",
        type=str,
        default="efficientnetb0",
        choices=["efficientnetb0", "mobilenetv2"],
        help="Transfer learning backbone",
    )
    return parser.parse_args()


def check_split_ratios(train_ratio, val_ratio, test_ratio):
    total = train_ratio + val_ratio + test_ratio
    if abs(total - 1.0) > 1e-6:
        raise ValueError(f"Split ratios must sum to 1.0, got {total:.4f}")


def list_class_files(dataset_dir: Path):
    class_to_files = {}
    classes = sorted([path for path in dataset_dir.iterdir() if path.is_dir()])
    if not classes:
        raise ValueError(f"No class folders found in: {dataset_dir}")

    for class_dir in classes:
        files = [
            path
            for path in class_dir.rglob("*")
            if path.is_file() and path.suffix.lower() in VALID_IMAGE_EXTENSIONS
        ]
        if len(files) < 5:
            raise ValueError(
                f"Class '{class_dir.name}' has only {len(files)} images; at least 5 required for robust split"
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
        raise ValueError(f"Not enough samples ({total}) to split train/val/test")

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
    mapping = {"train": train_files, "val": val_files, "test": test_files}

    for subset, subset_files in mapping.items():
        subset_class_dir = split_dir / subset / class_name
        subset_class_dir.mkdir(parents=True, exist_ok=True)

        for src in subset_files:
            destination = subset_class_dir / src.name
            if destination.exists():
                stem, suffix = src.stem, src.suffix
                index = 1
                while True:
                    candidate = subset_class_dir / f"{stem}_{index}{suffix}"
                    if not candidate.exists():
                        destination = candidate
                        break
                    index += 1
            shutil.copy2(src, destination)


def build_or_validate_split(args):
    split_dir = args.split_dir.resolve()

    if args.use_existing_split:
        for subset in ("train", "val", "test"):
            subset_dir = split_dir / subset
            if not subset_dir.exists() or not any(subset_dir.iterdir()):
                raise ValueError(f"Missing or empty split subset: {subset_dir}")
        return split_dir

    dataset_dir = args.dataset_dir.resolve()
    if not dataset_dir.exists():
        raise ValueError(f"Dataset does not exist: {dataset_dir}")

    class_to_files = list_class_files(dataset_dir)
    rng = random.Random(args.seed)

    ensure_clean_split_dir(split_dir)

    print("Created robust split:")
    for class_name, files in class_to_files.items():
        train_files, val_files, test_files = split_files(
            files,
            args.train_ratio,
            args.val_ratio,
            args.test_ratio,
            rng,
        )
        copy_split_files(split_dir, class_name, train_files, val_files, test_files)

        print(
            f"- {class_name}: train={len(train_files)}, val={len(val_files)}, test={len(test_files)}, total={len(files)}"
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


def class_counts_from_split(split_dir: Path, class_names):
    counts = {}
    for class_name in class_names:
        class_dir = split_dir / "train" / class_name
        count = len(
            [
                path
                for path in class_dir.rglob("*")
                if path.is_file() and path.suffix.lower() in VALID_IMAGE_EXTENSIONS
            ]
        )
        counts[class_name] = count
    return counts


def compute_class_weight(class_names, class_counts):
    total = sum(class_counts[name] for name in class_names)
    num_classes = len(class_names)

    class_weight = {}
    for index, class_name in enumerate(class_names):
        count = max(1, class_counts[class_name])
        class_weight[index] = total / (num_classes * count)
    return class_weight


def build_transfer_model(num_classes: int, img_size: int, backbone_name: str):
    inputs = tf.keras.Input(shape=(img_size, img_size, 3), name="image")

    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.08),
            tf.keras.layers.RandomZoom(0.12),
            tf.keras.layers.RandomContrast(0.10),
        ],
        name="augmentation",
    )

    x = augmentation(inputs)

    if backbone_name == "efficientnetb0":
        preprocess = tf.keras.applications.efficientnet.preprocess_input
        backbone_class = tf.keras.applications.EfficientNetB0
    else:
        preprocess = tf.keras.applications.mobilenet_v2.preprocess_input
        backbone_class = tf.keras.applications.MobileNetV2

    x = preprocess(x)

    try:
        backbone = backbone_class(
            include_top=False,
            weights="imagenet",
            input_shape=(img_size, img_size, 3),
        )
        print(f"Using pretrained backbone: {backbone_name}")
    except Exception as exc:
        print(f"Pretrained weights unavailable ({exc}); using random-init backbone")
        backbone = backbone_class(
            include_top=False,
            weights=None,
            input_shape=(img_size, img_size, 3),
        )

    backbone.trainable = False

    x = backbone(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.35)(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="prediction")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="samaaj_robust_classifier")
    return model, backbone


def compile_model(model, learning_rate):
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )


def save_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


def count_subset_images(split_dir: Path, subset: str):
    subset_dir = split_dir / subset
    return len(
        [
            path
            for path in subset_dir.rglob("*")
            if path.is_file() and path.suffix.lower() in VALID_IMAGE_EXTENSIONS
        ]
    )


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
    class_counts = class_counts_from_split(split_dir, class_names)
    class_weight = compute_class_weight(class_names, class_counts)

    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(autotune)
    val_ds = val_ds.prefetch(autotune)
    test_ds = test_ds.prefetch(autotune)

    artifacts_dir = args.artifacts_dir.resolve()
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    warmup_model_path = artifacts_dir / "robust_warmup_model.keras"
    best_model_path = artifacts_dir / "best_civic_issue_model.keras"
    final_model_path = artifacts_dir / "civic_issue_model.keras"

    model, backbone = build_transfer_model(len(class_names), args.img_size, args.backbone)

    compile_model(model, learning_rate=1e-3)

    warmup_callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6),
        tf.keras.callbacks.ModelCheckpoint(filepath=str(warmup_model_path), monitor="val_accuracy", save_best_only=True),
    ]

    print("\nWarmup phase")
    history_warmup = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.warmup_epochs,
        callbacks=warmup_callbacks,
        class_weight=class_weight,
        verbose=1,
    )

    backbone.trainable = True
    freeze_until = int(len(backbone.layers) * 0.75)
    for layer in backbone.layers[:freeze_until]:
        layer.trainable = False

    compile_model(model, learning_rate=3e-5)

    fine_tune_callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=6, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-7),
        tf.keras.callbacks.ModelCheckpoint(filepath=str(best_model_path), monitor="val_accuracy", save_best_only=True),
    ]

    print("\nFine-tune phase")
    history_finetune = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.fine_tune_epochs,
        callbacks=fine_tune_callbacks,
        class_weight=class_weight,
        verbose=1,
    )

    if best_model_path.exists():
        best_model = tf.keras.models.load_model(best_model_path)
        test_loss, test_accuracy = best_model.evaluate(test_ds, verbose=1)
        export_model = best_model
    else:
        test_loss, test_accuracy = model.evaluate(test_ds, verbose=1)
        export_model = model

    export_model.save(final_model_path)

    combined_history = {}
    for key, values in history_warmup.history.items():
        combined_history[f"warmup_{key}"] = [float(value) for value in values]
    for key, values in history_finetune.history.items():
        combined_history[f"finetune_{key}"] = [float(value) for value in values]

    save_json(artifacts_dir / "training_history_robust.json", combined_history)
    save_json(artifacts_dir / "class_names.json", class_names)

    metadata = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "pipeline": "transfer_learning_finetune",
        "backbone": args.backbone,
        "model_path": str(final_model_path),
        "class_names": class_names,
        "num_classes": len(class_names),
        "image_size": [args.img_size, args.img_size],
        "batch_size": args.batch_size,
        "warmup_epochs": args.warmup_epochs,
        "fine_tune_epochs": args.fine_tune_epochs,
        "train_samples": count_subset_images(split_dir, "train"),
        "val_samples": count_subset_images(split_dir, "val"),
        "test_samples": count_subset_images(split_dir, "test"),
        "class_counts_train": class_counts,
        "class_weight": class_weight,
        "test_loss": float(test_loss),
        "test_accuracy": float(test_accuracy),
    }
    save_json(artifacts_dir / "model_meta.json", metadata)

    print("\nRobust training complete")
    print(f"- Saved model: {final_model_path}")
    print(f"- Saved class names: {artifacts_dir / 'class_names.json'}")
    print(f"- Test accuracy: {test_accuracy:.4f}")


if __name__ == "__main__":
    main()
