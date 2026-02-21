import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { NextRequest, NextResponse } from "next/server";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY ?? "",
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("audio") as File | null;
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing or invalid 'audio' file" },
      { status: 400 }
    );
  }

  try {
    const data = await client.speechToText.convert({
      file,
      modelId: "scribe_v2",
    });

    // Sync response is either a single chunk or multichannel
    if (data && "text" in data && typeof data.text === "string") {
      return NextResponse.json({ text: data.text });
    }
    if (data && "transcripts" in data && Array.isArray(data.transcripts)) {
      const text = data.transcripts
        .map((t) => ("text" in t ? t.text : ""))
        .filter(Boolean)
        .join("\n");
      return NextResponse.json({ text });
    }

    return NextResponse.json(
      { error: "Unexpected transcription response" },
      { status: 500 }
    );
  } catch (err) {
    console.error("analyse-audio error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
