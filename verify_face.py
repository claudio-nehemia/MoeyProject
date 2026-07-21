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

if len(sys.argv) < 2:
    exit_with_json(False, "Missing arguments. Usage: python verify_face.py <selfie_path> [registered_dir_path]")

selfie_path = sys.argv[1]
registered_dir = sys.argv[2] if len(sys.argv) >= 3 else ""

if not os.path.exists(selfie_path):
    exit_with_json(False, f"Selfie file not found: {selfie_path}")

# Check blur using Laplacian variance
def check_blur(img_path):
    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return False, "Gagal membaca berkas gambar untuk pengecekan blur."
    laplacian_var = cv2.Laplacian(img, cv2.CV_64F).var()
    if laplacian_var < 40.0:
        return False, f"Gambar terlalu kabur atau tidak tajam. Mohon ambil foto di tempat yang lebih stabil."
    return True, ""

# Check exposure / brightness levels
def check_exposure(img_path):
    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return False, "Gagal membaca berkas gambar untuk pengecekan pencahayaan."
    mean_brightness = img.mean()
    if mean_brightness < 50.0:
        return False, f"Pencahayaan terlalu gelap. Mohon cari tempat yang lebih terang."
    if mean_brightness > 240.0:
        return False, f"Pencahayaan terlalu silau/terang. Mohon cari tempat dengan pencahayaan stabil."
    return True, ""

# Run quality checks first
is_not_blurry, blur_msg = check_blur(selfie_path)
if not is_not_blurry:
    exit_with_json(False, blur_msg)

is_good_exposure, exp_msg = check_exposure(selfie_path)
if not is_good_exposure:
    exit_with_json(False, exp_msg)

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
        0.5,             # scoreThreshold (relaxed from 0.6 for better detection in low-light/various angles)
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
    try:
        img = cv2.imread(img_path)
        if img is None:
            sys.stderr.write(f"Failed to read image path: {img_path}\n")
            return None
        h, w, _ = img.shape
        
        # Round width and height to nearest multiple of 32 to prevent YuNet getMemoryShapes crash on odd dimensions
        new_w = int(round(w / 32.0) * 32)
        new_h = int(round(h / 32.0) * 32)
        new_w = max(new_w, 32)
        new_h = max(new_h, 32)
        
        img = cv2.resize(img, (new_w, new_h))
        
        # Set input size for YuNet detector
        detector.setInputSize((new_w, new_h))
        try:
            _, faces = detector.detect(img)
        except Exception as e:
            sys.stderr.write(f"YuNet detect error on {img_path}: {str(e)}\n")
            return None
        
        if faces is None or len(faces) == 0:
            return None
        
        # Align and crop the first detected face, then resize to 112x112 (SFace standard input)
        try:
            aligned_face = recognizer.alignCrop(img, faces[0])
            aligned_face = cv2.resize(aligned_face, (112, 112))
            feature = recognizer.feature(aligned_face)
            return feature
        except Exception as e:
            sys.stderr.write(f"SFace align/feature error on {img_path}: {str(e)}\n")
            return None
    except Exception as e:
        sys.stderr.write(f"extract_feature general error on {img_path}: {str(e)}\n")
        return None

# Extract feature from uploaded selfie
selfie_feature = extract_feature(selfie_path)
if selfie_feature is None:
    exit_with_json(False, "Wajah tidak terdeteksi pada foto selfie Anda. Pastikan wajah tegak, tidak tertutup masker/kacamata hitam, dan menghadap kamera.")

# If registered directory is not provided or empty, we succeed on quality validation!
if not registered_dir or not os.path.exists(registered_dir) or not os.path.isdir(registered_dir):
    exit_with_json(True, "Kualitas foto selfie memenuhi syarat (Pencocokan wajah dilewati).", 1.0)

# Scan registered folder and compare
registered_files = [os.path.join(registered_dir, f) for f in os.listdir(registered_dir) 
                    if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]

if not registered_files:
    # If folder has no images, still succeed on quality validation
    exit_with_json(True, "Kualitas foto selfie memenuhi syarat (Tidak ada wajah pembanding terdaftar).", 1.0)

best_score = -1.0

# Cosine similarity threshold for SFace (relaxed from 0.363 to 0.28 for better mobile tolerance)
COSINE_THRESHOLD = 0.28

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
    exit_with_json(False, f"Wajah tidak cocok dengan data wajah yang terdaftar (Score: {best_score:.3f}).", best_score)
