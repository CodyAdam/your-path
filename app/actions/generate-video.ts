"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateVideoFromImage } from "./_processing/video-generation";

export const maxDuration = 300;

export type GenerateVideoInput = {
  nodeId: string;
  script: string;
  imageUrl: string;
  graphPrompt: string;
  skipIdle?: boolean;
};

export type GenerateVideoResult = {
  nodeId: string;
  mainVideoUrl: string;
  idleVideoUrl?: string;
};

async function downloadAndSave(
  replicateUrl: string,
  fileName: string
): Promise<string> {
  const response = await fetch(replicateUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download video from Replicate: ${response.status} ${response.statusText}`
    );
  }

  const videoBuffer = Buffer.from(await response.arrayBuffer());

  const videosDir = join(process.cwd(), "public", "videos");
  await mkdir(videosDir, { recursive: true });

  await writeFile(join(videosDir, fileName), videoBuffer);
  return `/videos/${fileName}`;
}

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoResult> {
  const mainPrompt = `${input.graphPrompt}. Scene: ${input.script}`;
  const idlePrompt = `${input.graphPrompt}. The character sits quietly, listening attentively. Subtle natural movements — blinking, slight breathing, gentle head tilt. Waiting for a response. No speaking.`;

  const mainGeneration = generateVideoFromImage({
    imageUrl: input.imageUrl,
    prompt: mainPrompt,
    duration: 5,
  });

  const idleGeneration = input.skipIdle
    ? null
    : generateVideoFromImage({
        imageUrl: input.imageUrl,
        prompt: idlePrompt,
        duration: 5,
        cameraFixed: true,
      });

  const [mainResult, idleResult] = await Promise.all([
    mainGeneration,
    idleGeneration,
  ]);

  const mainFileName = `node-${input.nodeId}-main.mp4`;
  const mainVideoUrl = await downloadAndSave(mainResult.videoUrl, mainFileName);

  let idleVideoUrl: string | undefined;
  if (idleResult) {
    const idleFileName = `node-${input.nodeId}-idle.mp4`;
    idleVideoUrl = await downloadAndSave(idleResult.videoUrl, idleFileName);
  }

  return {
    nodeId: input.nodeId,
    mainVideoUrl,
    idleVideoUrl,
  };
}
