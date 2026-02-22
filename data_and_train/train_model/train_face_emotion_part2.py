

model.load_state_dict(torch.load('best_mobilevit_emotion_finetuned2.pth'))

for param in model.parameters():
    param.requires_grad = True

FINE_TUNE_LR = 1e-5 
optimizer = optim.AdamW(model.parameters(), lr=FINE_TUNE_LR)

FINE_TUNE_EPOCHS = 10
best_acc_ft = best_acc 


for epoch in range(FINE_TUNE_EPOCHS):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    progress_bar = tqdm(train_loader, desc=f'FT Époque {epoch+1}/{FINE_TUNE_EPOCHS} [Train]')
    for inputs, labels in progress_bar:
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
        
        progress_bar.set_postfix({'Loss': f'{loss.item():.4f}', 'Acc': f'{100.*correct/total:.2f}%'})

    model.eval()
    val_loss = 0.0
    val_correct = 0
    val_total = 0
    
    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            val_loss += loss.item()
            _, predicted = outputs.max(1)
            val_total += labels.size(0)
            val_correct += predicted.eq(labels).sum().item()
            
    val_acc = 100. * val_correct / val_total
    print(f"Résultat FT Époque {epoch+1} -> Val Loss: {val_loss/len(test_loader):.4f} | Val Acc: {val_acc:.2f}%")
    
    if val_acc > best_acc_ft:
        best_acc_ft = val_acc
        torch.save(model.state_dict(), 'best_mobilevit_emotion_finetuned3.pth')
