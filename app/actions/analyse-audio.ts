"use server";

import { speechToEmotion } from "./_processing/speech-emotion";
import { speechToText } from "./_processing/speech-to-text";

export interface AnalyseAudioResult {
  sentimentAnalysis: { result: string };
  speechToText: { result: string };
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = [
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/x-m4a",
];

export async function analyseAudio(
  formData: FormData
): Promise<AnalyseAudioResult> {
  console.log("analyseAudio called");
  const audio = formData.get("audio");

  if (audio == null) {
    throw new Error("Missing 'audio' in form data");
  }

  if (!(audio instanceof Blob)) {
    throw new Error("'audio' must be a file");
  }

  if (audio.size === 0) {
    throw new Error("Audio file is empty");
  }

  if (audio.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Audio file too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`
    );
  }

  const type =
    (audio instanceof File
      ? audio.type
      : (audio as Blob).type
    )?.toLowerCase() || "";
  if (
    type &&
    !ALLOWED_TYPES.some(
      (t) => type === t || type.includes(t.replace("audio/", ""))
    )
  ) {
    throw new Error(
      `Unsupported audio type: ${type}. Allowed: ${ALLOWED_TYPES.join(", ")}`
    );
  }

  const [speechToTextResult, sentimentAnalysisResult] = await Promise.all([
    speechToText(audio),
    speechToEmotion(audio),
  ]);

  console.log("speechToTextResult", speechToTextResult);
  console.log("sentimentAnalysisResult", sentimentAnalysisResult);

  return {
    speechToText: speechToTextResult,
    sentimentAnalysis: sentimentAnalysisResult,
  };
}
