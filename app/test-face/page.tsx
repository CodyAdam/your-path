"use client";

import type { FaceDetector } from "@mediapipe/tasks-vision";
import { InferenceSession, env as ortEnv, Tensor } from "onnxruntime-web";
import { useCallback, useEffect, useRef, useState } from "react";

const EMOTIONS = [
  { id: 0, name: "Anger", color: "#e53935" },
  { id: 1, name: "Contempt", color: "#8d6e63" },
  { id: 2, name: "Disgust", color: "#7cb342" },
  { id: 3, name: "Fear", color: "#8e24aa" },
  { id: 4, name: "Happy", color: "#43a047" },
  { id: 5, name: "Neutral", color: "#9e9e9e" },
  { id: 6, name: "Sad", color: "#1e88e5" },
  { id: 7, name: "Surprise", color: "#00acc1" },
] as const;

const CROP_SIZE = 224;
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

type EmotionScores = number[];

function softmax(logits: number[]): number[] {
  const maxL = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - maxL));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

function preprocessFaceFromCtx(ctx: CanvasRenderingContext2D): Tensor | null {
  const imageData = ctx.getImageData(0, 0, CROP_SIZE, CROP_SIZE);
  const { data } = imageData;
  const floatData = new Float32Array(1 * 3 * CROP_SIZE * CROP_SIZE);

  for (let i = 0; i < CROP_SIZE * CROP_SIZE; i++) {
    floatData[i] = (data[i * 4] / 255 - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
    floatData[i + CROP_SIZE * CROP_SIZE] =
      (data[i * 4 + 1] / 255 - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
    floatData[i + CROP_SIZE * CROP_SIZE * 2] =
      (data[i * 4 + 2] / 255 - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
  }
  return new Tensor("float32", floatData, [1, 3, CROP_SIZE, CROP_SIZE]);
}

async function runEmotionInference(
  cropCtx: CanvasRenderingContext2D,
  session: InferenceSession
): Promise<number[] | null> {
  const tensor = preprocessFaceFromCtx(cropCtx);
  if (!tensor) {
    return null;
  }
  const inputName = session.inputNames?.[0] ?? "input";
  const outputs = await session.run({ [inputName]: tensor });
  const outputName = session.outputNames?.[0] ?? "output";
  const output = outputs[outputName];
  const logits = Array.from(output.data as Float32Array | Float64Array);
  return softmax(logits);
}

export default function TestFacePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<string>("Initialisation…");
  const [statusReady, setStatusReady] = useState(false);
  const [scores, setScores] = useState<EmotionScores>(() =>
    EMOTIONS.map(() => 0)
  );

  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const sessionRef = useRef<InferenceSession | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: detection loop needs many ref/context guards
  const predictWebcam = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const cropCanvas = cropCanvasRef.current;
    const faceDetector = faceDetectorRef.current;
    const session = sessionRef.current;

    if (!(video && canvas && cropCanvas && faceDetector && session)) {
      rafRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const ctx = canvas.getContext("2d");
    const cropCtx = cropCanvas.getContext("2d");
    if (!(ctx && cropCtx)) {
      rafRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    // Only clear and redraw when we have a new video frame. Otherwise we'd clear
    // every rAF (~60fps) but only draw when video time changes (~30fps), causing flicker.
    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const result = faceDetector.detectForVideo(video, performance.now());

      const firstDetection = result.detections[0];
      const box = firstDetection?.boundingBox;
      if (firstDetection && box) {
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 4;
        ctx.strokeRect(box.originX, box.originY, box.width, box.height);

        const x = Math.max(0, box.originX);
        const y = Math.max(0, box.originY);
        const w = Math.min(video.videoWidth - x, box.width);
        const h = Math.min(video.videoHeight - y, box.height);

        if (w > 0 && h > 0) {
          cropCtx.drawImage(video, x, y, w, h, 0, 0, CROP_SIZE, CROP_SIZE);
          try {
            const probs = await runEmotionInference(cropCtx, session);
            if (probs) {
              setScores(
                probs.map(
                  (p) => Math.min(Math.max(Math.round(p * 100), 0), 100) / 100
                )
              );
            }
          } catch (err) {
            console.error("Inference error:", err);
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(predictWebcam);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: init has sequential async steps and cancellation checks
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (cancelled) {
          for (const t of stream.getTracks()) {
            t.stop();
          }
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) {
          return;
        }
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });
        video.play();
        setStatus("Camera active. Loading AI…");

        const { FaceDetector, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
        });
        if (cancelled) {
          return;
        }
        faceDetectorRef.current = detector;

        if (ortEnv?.wasm) {
          ortEnv.wasm.numThreads = 1;
        }

        const session = await InferenceSession.create(
          "/emotion_model_web.onnx",
          { executionProviders: ["wasm"] }
        );
        if (cancelled) {
          return;
        }
        sessionRef.current = session;

        setStatus("Ready");
        setStatusReady(true);
        predictWebcam();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatus(`Error: ${message}`);
        console.error(error);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      for (const t of streamRef.current?.getTracks() ?? []) {
        t.stop();
      }
      streamRef.current = null;
      faceDetectorRef.current = null;
      sessionRef.current = null;
    };
  }, [predictWebcam]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-950 font-sans text-white">
      <h1 className="mt-5 font-semibold text-xl">
        Real-time emotion (MobileViT + ONNX)
      </h1>
      <div
        className={`mt-5 mb-5 rounded-full px-5 py-2.5 font-bold text-sm ${
          statusReady
            ? "bg-green-800 text-green-100"
            : "bg-amber-900 text-amber-200"
        }`}
      >
        {status}
      </div>

      <div className="flex flex-wrap items-start justify-center gap-8">
        <div className="relative w-[500px] overflow-hidden rounded-xl border-2 border-zinc-700">
          <video
            autoPlay
            className="block w-full"
            muted
            playsInline
            ref={videoRef}
          />
          <canvas
            className="pointer-events-none absolute top-0 left-0 h-full w-full"
            ref={canvasRef}
          />
        </div>

        <div className="w-[350px] rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
          {EMOTIONS.map((emo, index) => (
            <div className="mb-3" key={emo.id}>
              <div className="mb-1 flex justify-between font-semibold text-sm">
                <span>{emo.name}</span>
                <span>{Math.round((scores[index] ?? 0) * 100)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-700">
                <div
                  className="h-full rounded-full transition-[width] duration-200 ease-out"
                  style={{
                    width: `${(scores[index] ?? 0) * 100}%`,
                    backgroundColor: emo.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <canvas
        aria-hidden
        className="hidden"
        height={CROP_SIZE}
        ref={cropCanvasRef}
        width={CROP_SIZE}
      />
    </div>
  );
}
