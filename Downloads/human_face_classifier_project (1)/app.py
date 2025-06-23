
import streamlit as st
from PIL import Image
import os
from src.predict import predict_image

st.set_page_config(page_title="Human Face Classifier", layout="centered")
st.title("🧠 Human Face Classifier")

uploaded_file = st.file_uploader("Upload a face image", type=["jpg", "jpeg", "png"])
if uploaded_file:
    image = Image.open(uploaded_file)
    st.image(image, caption="Uploaded Image", use_column_width=True)

    # Save temporary file
    temp_path = "temp.jpg"
    image.save(temp_path)

    label, confidence = predict_image(temp_path)
    st.success(f"Prediction: **{label}** with {confidence}% confidence")
