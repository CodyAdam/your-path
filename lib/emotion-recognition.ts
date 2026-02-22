import type { InferenceSession } from "onnxruntime-web";
import { Tensor } from "onnxruntime-web";

export const EMOTION_NAMES = [
  "Anger",
  "Contempt",
  "Disgust",
  "Fear",
  "Happy",
  "Neutral",
  "Sad",
  "Surprise",
] as const;

export const CROP_SIZE = 224;
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

export type EmotionScores = number[];

export function softmax(logits: number[]): number[] {
  const maxL = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - maxL));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

export function preprocessFaceFromCtx(
  ctx: CanvasRenderingContext2D
): Tensor | null {
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

export async function runEmotionInference(
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

/** Format current emotion scores as a short string for the LLM prompt (e.g. "Happy 45%, Neutral 30%, Sad 12%"). */
export function formatEmotionContextForPrompt(scores: EmotionScores): string {
  const withNames = EMOTION_NAMES.map((name, i) => ({
    name,
    pct: Math.round((scores[i] ?? 0) * 100),
  }))
    .filter((x) => x.pct > 0)
    .sort((a, b) => b.pct - a.pct);
  if (withNames.length === 0) {
    return "No face detected.";
  }
  return withNames.map((x) => `${x.name} ${x.pct}%`).join(", ");
}
