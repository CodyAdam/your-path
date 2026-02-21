import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { AudioProcessor } from "./types";

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error("ELEVENLABS_API_KEY is not set");
}

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});


export const speechToText: AudioProcessor = async (
  file: Blob
) => {
  const data = await client.speechToText.convert({
    file,
    modelId: "scribe_v2",
  });

  if (data && "text" in data && typeof data.text === "string") {
    return { result: data.text };
  }
  if (data && "transcripts" in data && Array.isArray(data.transcripts)) {
    const text = data.transcripts
      .map((t) => ("text" in t ? t.text : ""))
      .filter(Boolean)
      .join("\n");
    return { result: text };
  }

  throw new Error("Unexpected transcription response");
};
