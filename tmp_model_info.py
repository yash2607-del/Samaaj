import os
import tensorflow as tf

model_path = r"C:\Users\dishi\mysamaaj\Samaaj\civic_issue_model.h5"
try:
    model = tf.keras.models.load_model(model_path)
    print("Input shape:", model.input_shape)
    print("Output shape:", model.output_shape)
except Exception as e:
    print("Error loading h5:", e)

model_path_keras = r"C:\Users\dishi\mysamaaj\Samaaj\civic_issue_model.keras"
try:
    model2 = tf.keras.models.load_model(model_path_keras)
    print("\nKeras Input shape:", model2.input_shape)
    print("Keras Output shape:", model2.output_shape)
except Exception as e:
    print("Error loading keras:", e)
