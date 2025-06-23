
import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
model = load_model(os.path.join(base_dir, 'model/image_classifier.h5'))
class_names = sorted(os.listdir(os.path.join(base_dir, 'dataset')))

def predict_image(img_path):
    img = image.load_img(img_path, target_size=(150, 150))
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    predictions = model.predict(img_array)[0]
    class_idx = np.argmax(predictions)
    return class_names[class_idx], round(predictions[class_idx]*100, 2)
