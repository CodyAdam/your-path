import os
import pandas as pd
import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np
from moviepy.editor import VideoFileClip
from tqdm import tqdm
import glob


CSV_PATH = '/content/MELD.Raw/train_sent_emo.csv' 
OUTPUT_DIR = "/content/clean_data_meld_train" 

meld_map = {
    'neutral': 'neutral', 'joy': 'happy', 'surprise': 'surprised',
    'anger': 'angry', 'sadness': 'sad', 'disgust': 'disgust', 'fear': 'fearful'
}

for emo in meld_map.values():
    os.makedirs(os.path.join(OUTPUT_DIR, emo), exist_ok=True)

def create_spec(audio_array, sr, save_path):
    target_length = 3 * sr
    if len(audio_array) > target_length:
        audio_array = audio_array[:target_length]
    else:
        audio_array = np.pad(audio_array, (0, target_length - len(audio_array)))

    S = librosa.feature.melspectrogram(y=audio_array, sr=sr, n_mels=128, fmax=8000)
    S_dB = librosa.power_to_db(S, ref=np.max)
    
    fig = plt.figure(figsize=(2.24, 2.24), dpi=100)
    ax = plt.Axes(fig, [0., 0., 1., 1.])
    ax.set_axis_off() 
    fig.add_axes(ax)
    librosa.display.specshow(S_dB, sr=sr, fmax=8000, ax=ax, cmap='magma')
    
    fig.savefig(save_path, bbox_inches='tight', pad_inches=0)
    plt.close(fig)

print("🔍 Indexation des vidéos...")
all_mp4 = glob.glob('/content/MELD.Raw/**/*.mp4', recursive=True)
video_dict = {os.path.basename(p): p for p in all_mp4}

df = pd.read_csv(CSV_PATH)
print(f"🚀 DÉMARRAGE : Traitement de {len(df)} répliques...")

for index, row in tqdm(df.iterrows(), total=len(df)):
    video_filename = f"dia{row['Dialogue_ID']}_utt{row['Utterance_ID']}.mp4"
    
    if video_filename in video_dict and row['Emotion'] in meld_map:
        video_path = video_dict[video_filename]
        save_path = os.path.join(OUTPUT_DIR, meld_map[row['Emotion']], video_filename.replace(".mp4", ".jpg"))
        
        if os.path.exists(save_path):
            continue
            
        try:
            video_clip = VideoFileClip(video_path)
            if video_clip.audio is not None:
                audio_array = video_clip.audio.to_soundarray(fps=16000)
                
                if len(audio_array.shape) > 1: 
                    audio_array = audio_array.mean(axis=1)
                
                create_spec(audio_array, 16000, save_path)
            video_clip.close() 
        except Exception as e:
            continue

print(f"\nTerminé ! Le dataset est prêt dans '{OUTPUT_DIR}'.")