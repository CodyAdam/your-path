import { fal } from "@fal-ai/client";

if (!process.env.FAL_AI_API_KEY) {
  throw new Error("FAL_AI_API_KEY is not set");
}

fal.config({ credentials: process.env.FAL_AI_API_KEY });

const SEEDANCE_MODEL =
  "fal-ai/bytedance/seedance/v1.5/pro/image-to-video" as const;

export interface VideoGenerationInput {
  duration?: number;
  endImageUrl?: string;
  imageUrl: string;
  prompt: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
}

/**
 * Generate a short video from an image + prompt using Fal (Seedance).
 * Returns the URL of the generated video; caller is responsible for downloading and storing.
 */
export async function generateVideoFromImage(
  input: VideoGenerationInput
): Promise<VideoGenerationResult> {
  let imageUrl = input.imageUrl;
  if (imageUrl.startsWith("data:")) {
    const blob = dataUriToBlob(imageUrl);
    imageUrl = await fal.storage.upload(blob);
  }

  let endImageUrl = input.endImageUrl;
  if (endImageUrl?.startsWith("data:")) {
    const blob = dataUriToBlob(endImageUrl);
    endImageUrl = await fal.storage.upload(blob);
  }

  const falInput: Record<string, unknown> = {
    prompt: input.prompt,
    image_url: imageUrl,
    aspect_ratio: "16:9",
    resolution: "720p",
    duration: String(input.duration ?? 5),
    generate_audio: true,
    enable_safety_checker: true,
  };

  if (endImageUrl) {
    falInput.end_image_url = endImageUrl;
  }

  const result = await fal.subscribe(SEEDANCE_MODEL, {
    input: falInput,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS" && update.logs) {
        for (const log of update.logs) {
          console.log(`  [seedance] ${log.message}`);
        }
      }
    },
  });

  const data = result.data as { video: { url: string } };
  return { videoUrl: data.video.url };
}

const MIME_MATCH_RE = /:(.*?);/;

function dataUriToBlob(dataUri: string): Blob {
  const [header, base64] = dataUri.split(",");
  const mimeMatch = header.match(MIME_MATCH_RE);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = Buffer.from(base64, "base64");
  return new Blob([binary], { type: mime });
}
