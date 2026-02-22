import type { FaceDetector } from "@mediapipe/tasks-vision";
import { InferenceSession, env as ortEnv } from "onnxruntime-web";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CROP_SIZE,
  type EmotionScores,
  runEmotionInference,
} from "@/lib/emotion-recognition";

const MODEL_URL = "/emotion_model_web.onnx";
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";

export function PlayCameraPreview({
  onEmotionScores,
}: {
  onEmotionScores?: (scores: EmotionScores) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const sessionRef = useRef<InferenceSession | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const onEmotionsRef = useRef(onEmotionScores);
  onEmotionsRef.current = onEmotionScores;
  const [error, setError] = useState<string>("");

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
        ctx.lineWidth = 2;
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
              const normalized = probs.map(
                (p) => Math.min(Math.max(Math.round(p * 100), 0), 100) / 100
              );
              onEmotionsRef.current?.(normalized);
            }
          } catch (err) {
            console.error("Emotion inference error:", err);
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
          audio: false,
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

        const { FaceDetector, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
        });
        if (cancelled) {
          return;
        }
        faceDetectorRef.current = detector;

        if (ortEnv?.wasm) {
          ortEnv.wasm.numThreads = 1;
        }
        const session = await InferenceSession.create(MODEL_URL, {
          executionProviders: ["wasm"],
        });
        if (cancelled) {
          return;
        }
        sessionRef.current = session;

        predictWebcam();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not access camera";
        setError(message);
        console.error("PlayCameraPreview init error:", err);
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

  if (error) {
    return (
      <div className="absolute bottom-4 left-4 flex h-24 w-32 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 p-2 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
        Camera unavailable
      </div>
    );
  }

  return (
    <>
      <div className="absolute bottom-4 left-4 w-1/3 overflow-hidden rounded-lg border border-zinc-300 bg-zinc-900 shadow-lg dark:border-zinc-700">
        {/* 4:3 matches the stream (640x480) so video and canvas overlay without stretch/crop */}
        <div className="relative aspect-[4/3] w-full">
          <video
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            ref={videoRef}
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
            ref={canvasRef}
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      </div>
      <canvas
        aria-hidden
        className="hidden"
        height={CROP_SIZE}
        ref={cropCanvasRef}
        width={CROP_SIZE}
      />
    </>
  );
}
