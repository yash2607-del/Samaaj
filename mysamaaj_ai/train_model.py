import tensorflow as tf
from tensorflow.keras import layers, models
import os

# Get current directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

train_dir = os.path.join(BASE_DIR, "dataset_split", "train")
val_dir = os.path.join(BASE_DIR, "dataset_split", "val")

img_size = (224,224)
batch_size = 16

# Load datasets
train_ds = tf.keras.preprocessing.image_dataset_from_directory(
    train_dir,
    image_size=img_size,
    batch_size=batch_size
)

val_ds = tf.keras.preprocessing.image_dataset_from_directory(
    val_dir,
    image_size=img_size,
    batch_size=batch_size
)

class_names = train_ds.class_names
print("Classes:", class_names)

# Normalize
normalization_layer = layers.Rescaling(1./255)

train_ds = train_ds.map(lambda x,y:(normalization_layer(x),y))
val_ds = val_ds.map(lambda x,y:(normalization_layer(x),y))

# Data Augmentation (improves accuracy)
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1)
])

# CNN Model
model = models.Sequential([

data_augmentation,

layers.Conv2D(32,(3,3),activation='relu',input_shape=(224,224,3)),
layers.MaxPooling2D(),

layers.Conv2D(64,(3,3),activation='relu'),
layers.MaxPooling2D(),

layers.Conv2D(128,(3,3),activation='relu'),
layers.MaxPooling2D(),

layers.Flatten(),

layers.Dense(128,activation='relu'),

layers.Dropout(0.3),

layers.Dense(len(class_names),activation='softmax')

])

model.compile(

optimizer='adam',
loss='sparse_categorical_crossentropy',
metrics=['accuracy']

)

model.summary()

history = model.fit(

train_ds,
validation_data=val_ds,
epochs=35

)

model.save("civic_issue_model.keras")

print("Model saved successfully")