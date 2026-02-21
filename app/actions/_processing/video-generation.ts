import Replicate from "replicate";

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error("REPLICATE_API_TOKEN is not set");
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export type VideoGenerationInput = {
  imageUrl: string;
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
  const output = await replicate.run("bytedance/seedance-1.5-pro", {
    input: {
      fps: 24,
      image: input.imageUrl,
      prompt: input.prompt,
      duration: input.duration ?? 5,
      resolution: "1080p",
      aspect_ratio: "16:9",
      camera_fixed: input.cameraFixed ?? false,
      generate_audio: true,
    },
  });

  const url = (output as { url: () => string }).url();

  return { videoUrl: url };
}
