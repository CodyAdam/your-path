import os
import cv2
import mediapipe as mp
from tqdm import tqdm

# --- 1. CONFIGURATION ---
# Remplace par tes vrais chemins
INPUT_DIR = "dataset_original" # Là où se trouvent "train" et "test"
OUTPUT_DIR = "dataset_224x224" # Le dossier qui sera créé
TARGET_SIZE = (224, 224)

# Initialisation de MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection
# model_selection=0 est idéal pour les visages de près (ce qui est le cas dans ce dataset)
face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)

splits = ['train', 'test']
emotions = ['anger', 'contempt', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

# --- 2. FONCTION DE RECADRAGE ---
def process_image(img_path, save_path):
    # Charger l'image avec OpenCV
    image = cv2.imread(img_path)
    if image is None:
        return False # L'image est corrompue ou introuvable

    # MediaPipe a besoin d'images en RGB (OpenCV charge en BGR)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_detection.process(image_rgb)

    # Si aucun visage n'est détecté, on ignore l'image (ça nettoie le dataset !)
    if not results.detections:
        return False

    # On prend le premier visage détecté (le plus confiant)
    detection = results.detections[0]
    bboxC = detection.location_data.relative_bounding_box
    ih, iw, _ = image.shape

    # Conversion des coordonnées relatives (pourcentages) en pixels réels
    x = int(bboxC.xmin * iw)
    y = int(bboxC.ymin * ih)
    w = int(bboxC.width * iw)
    h = int(bboxC.height * ih)

    # Sécurité : s'assurer que les coordonnées ne sortent pas de l'image
    x, y = max(0, x), max(0, y)
    w = min(iw - x, w)
    h = min(ih - y, h)

    # Si la boîte est invalide après correction, on ignore
    if w <= 0 or h <= 0:
        return False

    # Découpage du visage
    face_crop = image[y:y+h, x:x+w]

    # Redimensionnement en 224x224 pour le Vision Transformer
    face_resized = cv2.resize(face_crop, TARGET_SIZE, interpolation=cv2.INTER_AREA)

    # Sauvegarde
    cv2.imwrite(save_path, face_resized)
    return True

# --- 3. BOUCLE PRINCIPALE ---
images_processed = 0
images_skipped = 0

print("Démarrage de la pipeline de traitement...")

for split in splits:
    for emotion in emotions:
        input_emotion_dir = os.path.join(INPUT_DIR, split, emotion)
        output_emotion_dir = os.path.join(OUTPUT_DIR, split, emotion)
        
        # Vérifier si le dossier source existe
        if not os.path.exists(input_emotion_dir):
            continue

        # Créer le dossier de destination s'il n'existe pas
        os.makedirs(output_emotion_dir, exist_ok=True)
        
        # Lister toutes les images (.jpg, .png, etc.)
        image_files = [f for f in os.listdir(input_emotion_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        
        # Utilisation de tqdm pour la barre de progression
        for img_name in tqdm(image_files, desc=emotion, unit="img"):
            img_path = os.path.join(input_emotion_dir, img_name)
            save_path = os.path.join(output_emotion_dir, img_name)
            
            success = process_image(img_path, save_path)
            if success:
                images_processed += 1
            else:
                images_skipped += 1

print(f" Visages recadrés et sauvegardés : {images_processed}")
