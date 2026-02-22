"use client";

import { InferenceSession } from "onnxruntime-web";
import { useCallback, useEffect, useRef, useState } from "react";
import { runEmotionInference } from "@/lib/emotion-recognition";

const MODEL_URL = "/emotion_model_web-speech.onnx";
const SPECTROGRAM_SIZE = 224;

const CLASSES = [
  "Colère",
  "Dégoût",
  "Peur",
  "Joie",
  "Neutre",
  "Tristesse",
  "Surprise",
  "Autre",
];

const BAR_COLORS = [
  "#ff4757",
  "#2ed573",
  "#57606f",
  "#ffa502",
  "#7bed9f",
  "#1e90ff",
  "#ff6b81",
  "#a4b0be",
];

function getMagmaColor(val: number): string {
  const r = Math.min(255, val * 2);
  const g = val > 128 ? (val - 128) * 2 : 0;
  const b = val < 128 ? val * 2 : 0;
  return `rgb(${r}, ${g}, ${b})`;
}

export default function TestSpeechPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<InferenceSession | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const predictTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);

  const [status, setStatus] = useState("En attente...");
  const [probabilities, setProbabilities] = useState<number[]>(() =>
    new Array(CLASSES.length).fill(0)
  );
  const [micActive, setMicActive] = useState(false);

  // Load ONNX model on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("⏳ Chargement du modèle ONNX...");
        const session = await InferenceSession.create(MODEL_URL, {
          executionProviders: ["wasm"],
        });
        if (cancelled) {
          return;
        }
        sessionRef.current = session;
        setStatus("✅ Prêt à écouter !");
      } catch (e) {
        if (!cancelled) {
          setStatus("❌ Erreur de chargement du modèle.");
          console.error(e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const drawSpectrogramLoop = useCallback(() => {
    rafRef.current = requestAnimationFrame(drawSpectrogramLoop);
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!(canvas && analyser && dataArray)) {
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return;
    }

    analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);

    ctx.drawImage(
      canvas,
      1,
      0,
      SPECTROGRAM_SIZE - 1,
      SPECTROGRAM_SIZE,
      0,
      0,
      SPECTROGRAM_SIZE - 1,
      SPECTROGRAM_SIZE
    );

    for (let i = 0; i < SPECTROGRAM_SIZE; i++) {
      const bin = Math.floor(
        (SPECTROGRAM_SIZE - 1 - i) * (dataArray.length / SPECTROGRAM_SIZE)
      );
      const val = dataArray[bin] ?? 0;
      ctx.fillStyle = getMagmaColor(val);
      ctx.fillRect(SPECTROGRAM_SIZE - 1, i, 1, 1);
    }
  }, []);

  const predictLoop = useCallback(async () => {
    const session = sessionRef.current;
    const canvas = canvasRef.current;
    if (!(session && canvas)) {
      predictTimeoutRef.current = setTimeout(predictLoop, 250);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      predictTimeoutRef.current = setTimeout(predictLoop, 250);
      return;
    }

    try {
      const scores = await runEmotionInference(ctx, session);
      if (scores) {
        setProbabilities(scores);
      }
    } catch (_) {
      // ignore single-frame errors
    }
    predictTimeoutRef.current = setTimeout(predictLoop, 250);
  }, []);

  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16_000 });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      setMicActive(true);
      drawSpectrogramLoop();
      predictLoop();
    } catch (err) {
      setStatus("❌ Erreur : Micro refusé ou introuvable.");
      console.error(err);
    }
  }, [drawSpectrogramLoop, predictLoop]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (predictTimeoutRef.current) {
        clearTimeout(predictTimeoutRef.current);
      }
      for (const t of streamRef.current?.getTracks() ?? []) {
        t.stop();
      }
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#121212] p-5 text-white">
      <h1 className="mb-2 font-semibold text-2xl">
        🎙️ IA d&apos;Analyse Vocale
      </h1>
      <p className="mb-5 text-[#aaa] italic" id="status">
        {status}
      </p>

      {!micActive && (
        <button
          className="mb-5 cursor-pointer rounded-md border-none bg-[#00ff88] px-5 py-2.5 font-bold text-base text-black hover:bg-[#00cc6a]"
          onClick={startMicrophone}
          type="button"
        >
          🎤 Activer le Micro
        </button>
      )}

      <div className="flex w-full max-w-[600px] flex-col items-center">
        <canvas
          className="mb-5 h-[300px] w-full max-w-[300px] rounded-lg border-2 border-[#444] bg-black"
          height={SPECTROGRAM_SIZE}
          ref={canvasRef}
          style={{ aspectRatio: "1" }}
          width={SPECTROGRAM_SIZE}
        />

        <div className="w-full max-w-[400px] rounded-lg bg-[#222] p-4 shadow-lg">
          {CLASSES.map((label, index) => (
            <div className="mb-2 flex items-center gap-2 last:mb-0" key={label}>
              <span className="w-20 shrink-0 text-left font-bold text-[#ddd] text-sm">
                {label}
              </span>
              <div className="mx-2.5 h-4 flex-1 overflow-hidden rounded-full bg-[#333]">
                <div
                  className="h-full rounded-full transition-[width] duration-100 ease-out"
                  style={{
                    width: `${(probabilities[index] ?? 0) * 100}%`,
                    backgroundColor: BAR_COLORS[index],
                  }}
                />
              </div>
              <span
                className="w-12 shrink-0 text-right text-sm"
                style={{
                  color: (probabilities[index] ?? 0) > 0.4 ? "#fff" : "#aaa",
                  fontWeight:
                    (probabilities[index] ?? 0) > 0.4 ? "bold" : "normal",
                }}
              >
                {((probabilities[index] ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
