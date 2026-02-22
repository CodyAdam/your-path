import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# --- CONFIGURATION VISUELLE ---
sns.set_theme(style="whitegrid")

def eda_affectnet(data_dir):
    print("EDA : Dataset AffectNet (Images de Visages) ---")
    if not os.path.exists(data_dir):
        print(f"Dossier introuvable : {data_dir}")
        return
        
    classes = os.listdir(data_dir)
    counts = []
    
    for c in classes:
        class_path = os.path.join(data_dir, c)
        if os.path.isdir(class_path):
            num_files = len(os.listdir(class_path))
            counts.append({'Emotion': c, 'Nombre d\'images': num_files})
            
    df_affect = pd.DataFrame(counts).sort_values(by='Nombre d\'images', ascending=False)
    
    # Affichage texte
    print(df_affect.to_string(index=False))
    print(f"Total d'images : {df_affect['Nombre d\'images'].sum()}\n")
    
    # Affichage graphique
    plt.figure(figsize=(10, 5))
    sns.barplot(data=df_affect, x='Emotion', y='Nombre d\'images', palette='viridis')
    plt.title('Distribution des émotions - AffectNet (Train)', fontsize=14, fontweight='bold')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

def eda_meld(csv_path):
    print("EDA : Dataset MELD (Répliques Audio) ---")
    if not os.path.exists(csv_path):
        print(f"Fichier introuvable : {csv_path}")
        return
        
    df_meld = pd.read_csv(csv_path)
    
    # Comptage des émotions
    emo_counts = df_meld['Emotion'].value_counts().reset_index()
    emo_counts.columns = ['Emotion', 'Nombre de répliques']
    
    # Affichage texte
    print(emo_counts.to_string(index=False))
    print(f"Total de répliques : {emo_counts['Nombre de répliques'].sum()}\n")
    
    # Affichage graphique
    plt.figure(figsize=(10, 5))
    sns.barplot(data=emo_counts, x='Emotion', y='Nombre de répliques', palette='magma')
    plt.title('Distribution des émotions - MELD (Train)', fontsize=14, fontweight='bold')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

# --- LANCEMENT DE L'ANALYSE ---
# Modifie ces chemins pour qu'ils correspondent à tes dossiers sur Colab
AFFECTNET_DIR = "dataset_emotion/clean_data/train" 
MELD_CSV = "/content/MELD.Raw/train_sent_emo.csv"

eda_affectnet(AFFECTNET_DIR)
eda_meld(MELD_CSV)