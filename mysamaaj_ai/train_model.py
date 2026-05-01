import json
import os

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, regularizers


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TRAIN_DIR = os.path.join(BASE_DIR, "dataset_split", "train")
VAL_DIR = os.path.join(BASE_DIR, "dataset_split", "val")

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 60

LABEL_SMOOTHING = 0.10
DROPOUT_RATE = 0.50
L2_WEIGHT = 1e-4

MODEL_OUT_PATH = os.path.join(BASE_DIR, "civic_issue_model.keras")
CLASS_NAMES_PATH = os.path.join(BASE_DIR, "class_names.json")


def _build_generators():
    if not os.path.isdir(TRAIN_DIR):
        raise FileNotFoundError(f"Missing train folder: {TRAIN_DIR}")
    if not os.path.isdir(VAL_DIR):
        raise FileNotFoundError(f"Missing val folder: {VAL_DIR}")

    # Stronger augmentation (small dataset + better generalization)
    train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1.0 / 255.0,
        rotation_range=25,
        width_shift_range=0.12,
        height_shift_range=0.12,
        shear_range=0.10,
        zoom_range=0.18,
        brightness_range=(0.8, 1.2),
        horizontal_flip=True,
        fill_mode="nearest",
    )

    val_datagen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1.0 / 255.0)

    train_gen = train_datagen.flow_from_directory(
        TRAIN_DIR,
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=True,
    )

    val_gen = val_datagen.flow_from_directory(
        VAL_DIR,
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=False,
    )

    # Persist class names to keep inference label order reliable
    class_indices = train_gen.class_indices
    class_names = [None] * len(class_indices)
    for name, idx in class_indices.items():
        class_names[int(idx)] = str(name)
    print("Classes:", class_names)
    with open(CLASS_NAMES_PATH, "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)

    # Class weights for imbalance
    class_counts = np.bincount(train_gen.classes, minlength=len(class_names)).astype(np.float32)
    total = float(np.sum(class_counts))
    class_weight = {}
    for i, count in enumerate(class_counts):
        if count <= 0:
            class_weight[i] = 1.0
        else:
            class_weight[i] = total / (len(class_names) * float(count))

    return train_gen, val_gen, class_names, class_weight


def _build_model(num_classes: int) -> tf.keras.Model:
    reg = regularizers.l2(L2_WEIGHT)

    def conv_block(filters: int):
        return [
            layers.Conv2D(filters, (3, 3), padding="same", use_bias=False, kernel_regularizer=reg),
            layers.BatchNormalization(),
            layers.Activation("relu"),
            layers.MaxPooling2D(),
            layers.Dropout(0.20),
        ]

    model = models.Sequential(
        [
            layers.Input(shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3)),
            *conv_block(32),
            *conv_block(64),
            *conv_block(128),
            layers.Conv2D(192, (3, 3), padding="same", use_bias=False, kernel_regularizer=reg),
            layers.BatchNormalization(),
            layers.Activation("relu"),
            layers.GlobalAveragePooling2D(),
            layers.Dense(128, activation="relu", kernel_regularizer=reg),
            layers.Dropout(DROPOUT_RATE),
            layers.Dense(num_classes, activation="softmax"),
        ]
    )
    return model


def main():
    train_gen, val_gen, class_names, class_weight = _build_generators()

    model = _build_model(num_classes=len(class_names))
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
        metrics=[
            "accuracy",
            tf.keras.metrics.TopKCategoricalAccuracy(k=2, name="top_2_accuracy"),
        ],
    )

    model.summary()

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            filepath=MODEL_OUT_PATH,
            monitor="val_loss",
            save_best_only=True,
            save_weights_only=False,
            verbose=1,
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=8,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=1,
    )

    # Save final model too (best model is already saved by checkpoint)
    model.save(MODEL_OUT_PATH)
    print(f"Model saved: {MODEL_OUT_PATH}")
    print(f"Class names saved: {CLASS_NAMES_PATH}")

    return history


if __name__ == "__main__":
    main()