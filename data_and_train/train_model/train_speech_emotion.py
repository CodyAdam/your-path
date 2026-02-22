import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, random_split
import timm
import copy
from tqdm import tqdm

# --- 1. CONFIGURATION ---
DATA_DIR = "/content/clean_data_meld_train"  
BATCH_SIZE = 32
EPOCHS_PHASE1 = 10  
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"Préparation de l'entraînement sur : {DEVICE}")

# --- 2. PRÉPARATION DES DONNÉES ---
# Augmentation forte pour rendre l'IA robuste aux bruits de fond
train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.RandomErasing(p=0.5, scale=(0.02, 0.1)), # Masque des fréquences au hasard
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

full_dataset = datasets.ImageFolder(root=DATA_DIR)
train_size = int(0.8 * len(full_dataset))
val_size = len(full_dataset) - train_size
train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

train_dataset.dataset.transform = train_transform
val_dataset.dataset.transform = val_transform

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)


# --- 3. CRÉATION DU MODÈLE ---
model = timm.create_model('mobilevit_xs', pretrained=True, num_classes=len(full_dataset.classes), drop_rate=0.5)
model = model.to(DEVICE)
criterion = nn.CrossEntropyLoss()

def run_epoch(epoch, total_epochs, loader, is_train, optimizer):
    if is_train: model.train()
    else: model.eval()
    
    running_loss, running_corrects = 0.0, 0
    for inputs, labels in tqdm(loader, desc=f"Epoch {epoch+1}/{total_epochs} [{'Train' if is_train else 'Val'}]", leave=False):
        inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad()
        
        with torch.set_grad_enabled(is_train):
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            if is_train:
                loss.backward()
                optimizer.step()
                
        running_loss += loss.item() * inputs.size(0)
        running_corrects += torch.sum(preds == labels.data)
        
    return running_loss / len(loader.dataset), running_corrects.double() / len(loader.dataset)

best_acc = 0.0

for param in model.parameters(): param.requires_grad = False
for param in model.head.parameters(): param.requires_grad = True

optimizer1 = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=0.001, weight_decay=0.01)

for epoch in range(EPOCHS_PHASE1):
    t_loss, t_acc = run_epoch(epoch, EPOCHS_PHASE1, train_loader, True, optimizer1)
    v_loss, v_acc = run_epoch(epoch, EPOCHS_PHASE1, val_loader, False, optimizer1)
    print(f"Train Acc: {t_acc:.4f} | Val Acc: {v_acc:.4f}")
    if v_acc > best_acc:
        best_acc = v_acc
        torch.save(model.state_dict(), '/content/best_meld_emotion.pth')


print(f"Meilleure précision : {best_acc:.4f}")
