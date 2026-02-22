import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_AI_API_KEY });

export type ImageGenerationInput = {
  prompt: string;
  referenceImages?: string[];
  aspectRatio?: string;
  outputFormat?: string;
};

export type ImageGenerationResult = {
  imageUrl: string;
};

export async function generateImage(
  input: ImageGenerationInput
): Promise<ImageGenerationResult> {
  // Upload any data URI reference images to fal storage first
  const imageUrls: string[] = [];
  if (input.referenceImages) {
    for (const img of input.referenceImages) {
      if (img.startsWith("data:")) {
        const blob = dataUriToBlob(img);
        imageUrls.push(await fal.storage.upload(blob));
      } else {
        imageUrls.push(img);
      }
    }
  }

  // Use nano-banana/edit when reference images are provided, otherwise plain nano-banana
  const model = imageUrls.length > 0 ? "fal-ai/nano-banana/edit" : "fal-ai/nano-banana";

  const falInput: Record<string, unknown> = {
    prompt: input.prompt,
    num_images: 1,
    aspect_ratio: input.aspectRatio ?? "16:9",
    output_format: input.outputFormat ?? "png",
    safety_tolerance: "4",
  };

  if (imageUrls.length > 0) {
    falInput.image_urls = imageUrls;
  }

  const result = await fal.subscribe(model, {
    input: falInput,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS" && update.logs) {
        for (const log of update.logs) {
          console.log(`  [nano-banana] ${log.message}`);
        }
      }
    },
  });

  const data = result.data as { images: { url: string }[] };
  return { imageUrl: data.images[0].url };
}

function dataUriToBlob(dataUri: string): Blob {
  const [header, base64] = dataUri.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = Buffer.from(base64, "base64");
  return new Blob([binary], { type: mime });
}
