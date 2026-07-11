import sys
import os
import urllib.request
import json
import cv2
import numpy as np

# Print json helper
def exit_with_json(matched, message="", score=0.0):
    print(json.dumps({
        "matched": matched,
        "message": message,
        "score": float(score)
    }))
    sys.exit(0)

if len(sys.argv) < 3:
    exit_with_json(False, "Missing arguments. Usage: python verify_face.py <selfie_path> <registered_dir_path>")

selfie_path = sys.argv[1]
registered_dir = sys.argv[2]

if not os.path.exists(selfie_path):
    exit_with_json(False, f"Selfie file not found: {selfie_path}")

if not os.path.exists(registered_dir) or not os.path.isdir(registered_dir):
    exit_with_json(False, f"Registered directory not found or invalid: {registered_dir}")

# Models directory setup
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'storage', 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

# Correct GitHub raw URLs using the main branch
YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

yunet_path = os.path.join(MODELS_DIR, 'yunet.onnx')
sface_path = os.path.join(MODELS_DIR, 'sface.onnx')

def download_file(url, path):
    # If file exists but is too small (e.g. LFS pointer file), remove it and re-download
    if os.path.exists(path) and os.path.getsize(path) < 10000:
        try:
            os.remove(path)
        except Exception:
            pass

    if not os.path.exists(path):
        try:
            urllib.request.urlretrieve(url, path)
        except Exception as e:
            exit_with_json(False, f"Failed to download face model: {str(e)}")

download_file(YUNET_URL, yunet_path)
download_file(SFACE_URL, sface_path)

# Initialize OpenCV face detector and recognizer using positional arguments
try:
    detector = cv2.FaceDetectorYN.create(
        yunet_path,      # model
        "",              # config
        (320, 320),      # inputSize
        0.6,             # scoreThreshold
        0.3,             # nmsThreshold
        5000             # topK
    )
    recognizer = cv2.FaceRecognizerSF.create(
        sface_path,      # model
        ""               # config
    )
except Exception as e:
    exit_with_json(False, f"Failed to initialize face recognition: {str(e)}")

def extract_feature(img_path):
    img = cv2.imread(img_path)
    if img is None:
        return None
    h, w, _ = img.shape
    
    # Set input size for YuNet detector
    detector.setInputSize((w, h))
    _, faces = detector.detect(img)
    
    if faces is None or len(faces) == 0:
        return None
    
    # Align and crop the first detected face
    try:
        aligned_face = recognizer.alignCrop(img, faces[0])
        feature = recognizer.feature(aligned_face)
        return feature
    except Exception:
        return None

# Extract feature from uploaded selfie
selfie_feature = extract_feature(selfie_path)
if selfie_feature is None:
    exit_with_json(False, "Wajah tidak terdeteksi pada foto selfie Anda.")

# Scan registered folder and compare
registered_files = [os.path.join(registered_dir, f) for f in os.listdir(registered_dir) 
                    if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]

if not registered_files:
    exit_with_json(False, "Tidak ada data foto wajah terdaftar di sistem.")

best_score = -1.0

# Cosine similarity threshold for SFace (typically >= 0.363 is considered a match)
COSINE_THRESHOLD = 0.363

for reg_file in registered_files:
    reg_feature = extract_feature(reg_file)
    if reg_feature is None:
        continue
    
    try:
        # Match using Cosine Similarity
        score = recognizer.match(selfie_feature, reg_feature, cv2.FaceRecognizerSF_FR_COSINE)
        if score > best_score:
            best_score = score
    except Exception:
        continue

if best_score >= COSINE_THRESHOLD:
    exit_with_json(True, "Verifikasi wajah berhasil.", best_score)
else:
    exit_with_json(False, "Wajah tidak cocok dengan data wajah yang terdaftar.", best_score)
