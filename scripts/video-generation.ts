import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_AI_API_KEY });

export type VideoGenerationInput = {
  imageUrl: string;
  endImageUrl?: string;
  prompt: string;
  duration?: number;
  cameraFixed?: boolean;
};

export type VideoGenerationResult = {
  videoUrl: string;
};

export async function generateVideoFromImage(
  input: VideoGenerationInput
): Promise<VideoGenerationResult> {
  // If imageUrl is a data URI, upload it to fal storage first
  let imageUrl = input.imageUrl;
  if (imageUrl.startsWith("data:")) {
    const blob = dataUriToBlob(imageUrl);
    imageUrl = await fal.storage.upload(blob);
  }

  // If endImageUrl is a data URI, upload it too
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

  const result = await fal.subscribe(
    "fal-ai/bytedance/seedance/v1.5/pro/image-to-video",
    {
      input: falInput,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          for (const log of update.logs) {
            console.log(`  [seedance] ${log.message}`);
          }
        }
      },
    }
  );

  const data = result.data as { video: { url: string } };
  return { videoUrl: data.video.url };
}

function dataUriToBlob(dataUri: string): Blob {
  const [header, base64] = dataUri.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = Buffer.from(base64, "base64");
  return new Blob([binary], { type: mime });
}
