import os
import json
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# -----------------------
# Config
# -----------------------
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS_HEAD = 5        # train classification head
EPOCHS_FINE = 10       # fine-tune top layers
LR_HEAD = 3e-4
LR_FINE = 1e-5

TRAIN_DIR = "dataset_split/train"
VAL_DIR   = "dataset_split/val"

OUT_DIR = "artifacts"  # change if you prefer repo root
MODEL_PATH = os.path.join(OUT_DIR, "pretrained_model.keras")
CLASS_NAMES_PATH = os.path.join(OUT_DIR, "class_names.json")

os.makedirs(OUT_DIR, exist_ok=True)

# -----------------------
# Data Generators
# -----------------------
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=30,
    zoom_range=0.3,
    width_shift_range=0.1,
    height_shift_range=0.1,
    brightness_range=[0.7, 1.3],
    horizontal_flip=True
)

val_datagen = ImageDataGenerator(rescale=1./255)

train_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=True
)

val_gen = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False
)

num_classes = train_gen.num_classes
class_indices = train_gen.class_indices  # dict: {class_name: index}

# IMPORTANT: keep deterministic order for both models
class_names = [None] * len(class_indices)
for name, idx in class_indices.items():
    class_names[idx] = name

with open(CLASS_NAMES_PATH, "w") as f:
    json.dump(class_names, f, indent=2)

print("Classes:", class_names)

# -----------------------
# Choose backbone
# (MobileNetV2 or EfficientNetB0)
# -----------------------
# Option A: MobileNetV2 (faster)
base_model = tf.keras.applications.MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=IMG_SIZE + (3,)
)

# Option B (comment A, uncomment B): EfficientNetB0 (slightly better, heavier)
# base_model = tf.keras.applications.EfficientNetB0(
#     weights="imagenet",
#     include_top=False,
#     input_shape=IMG_SIZE + (3,)
# )

base_model.trainable = False  # freeze for head training

# -----------------------
# Build model
# -----------------------
x = base_model.output
x = layers.GlobalAveragePooling2D()(x)
x = layers.BatchNormalization()(x)
x = layers.Dense(128, activation="relu")(x)
x = layers.Dropout(0.5)(x)
outputs = layers.Dense(num_classes, activation="softmax")(x)

model = models.Model(inputs=base_model.input, outputs=outputs)

# Label smoothing helps calibration
loss_fn = tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LR_HEAD),
    loss=loss_fn,
    metrics=[
        "accuracy",
        tf.keras.metrics.TopKCategoricalAccuracy(k=2, name="top2_acc")
    ]
)

# -----------------------
# Callbacks
# -----------------------
callbacks = [
    tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
    tf.keras.callbacks.ReduceLROnPlateau(patience=3, factor=0.3, min_lr=1e-6),
    tf.keras.callbacks.ModelCheckpoint(MODEL_PATH, monitor="val_accuracy", save_best_only=True)
]

# -----------------------
# Stage 1: Train head
# -----------------------
print("\n[Stage 1] Training classification head...")
model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_HEAD,
    callbacks=callbacks
)

# -----------------------
# Stage 2: Fine-tune top layers
# -----------------------
print("\n[Stage 2] Fine-tuning top layers...")

# Unfreeze top N layers (keep most frozen to avoid overfitting)
FINE_TUNE_AT = int(len(base_model.layers) * 0.75)  # unfreeze top 25%

for layer in base_model.layers[FINE_TUNE_AT:]:
    layer.trainable = True

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LR_FINE),
    loss=loss_fn,
    metrics=[
        "accuracy",
        tf.keras.metrics.TopKCategoricalAccuracy(k=2, name="top2_acc")
    ]
)

model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_FINE,
    callbacks=callbacks
)

# Ensure final save (best already saved by callback)
model.save(MODEL_PATH)
print(f"\nSaved model to: {MODEL_PATH}")
print(f"Saved class names to: {CLASS_NAMES_PATH}")