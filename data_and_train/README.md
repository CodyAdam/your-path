# Real-Time Emotion Recognition (Video & Audio)

This repository contains two ultra-lightweight Deep Learning models designed for instant, client-side emotion recognition directly in the browser. 

Our primary constraint was inference speed: we traded massive, heavy architectures for extremely small models to ensure a seamless, zero-latency user experience without relying on a backend server.

## Hardware & Environment
All model training and fine-tuning were performed entirely on Google Colab, utilizing an NVIDIA L4 GPU to accelerate the processing of both the visual and audio datasets.

---

## Model 1: Visual Emotion Recognition (Webcam)

This model analyzes facial expressions in real-time via a standard webcam feed.

* **Architecture:** MobileViT-XXSs
* **Dataset:** AffectNet (A large-scale dataset of labeled facial expressions).
* **Pipeline:** 1. We capture the webcam frame.
  2. We use Google's MediaPipe Face Detection to accurately isolate and crop the user's face from the background.
  3. The cropped face is passed to the MobileViT model for inference.

### Training Strategy
To prevent overfitting and ensure the model generalizes well to new faces, we used a two-phase Transfer Learning approach with Cross-Entropy loss:
1. **Phase 1 (10 Epochs):** We froze the entire network and only fine-tuned the classification head.
2. **Phase 2 (40 Epochs):** We unfroze the entire model and fine-tuned it using a very low learning rate to gently adjust the foundational weights.

### Results
* **Testing Accuracy:** Improved from 15% to 65%. 

---

## Model 2: Audio Emotion Recognition (Microphone)

This model listens to the user's voice and classifies the underlying emotional tone, independent of the words spoken.

* **Architecture:** MobileViT-XS
* **Dataset:** MELD (Multimodal EmotionLines Dataset). A dataset built from Friends TV show dialogues, providing highly realistic, conversational audio.
* **Pipeline:** Since Vision Transformers process images, we convert the raw audio waveform into a Mel-Spectrogram. This turns sound frequencies and time into a 2D visual representation that the model can see and analyze.

### Training Strategy
Similar to the visual model, we utilized Cross-Entropy loss on the MobileViT-XS architecture to classify the generated audio spectrograms into distinct emotional categories.

### Results
* **Testing Accuracy:** Improved from 14% to 50%.

---

## The Accuracy vs. Speed Trade-off
You might notice that the testing accuracies (65% and 50%) are not breaking global state-of-the-art records. This is a deliberate architectural choice. 

State-of-the-art models in emotion recognition are typically massive and require heavy GPU backends. By restricting ourselves to MobileViT-XXS and MobileViT-XS, we capped our maximum theoretical accuracy but achieved our primary goal: instantaneous inference directly on the client's device, ensuring total privacy and zero network latency for the user.

