import Replicate from "replicate";

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error("REPLICATE_API_TOKEN is not set");
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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
  const output = await replicate.run("google/nano-banana", {
    input: {
      prompt: input.prompt,
      image_input: input.referenceImages ?? [],
      aspect_ratio: input.aspectRatio ?? "match_input_image",
      output_format: input.outputFormat ?? "jpg",
    },
  });

  const url = (output as { url: () => string }).url();

  return { imageUrl: url };
}
