"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateImage } from "./_processing/image-generation";

export const maxDuration = 120;

export type GenerateCharacterInput = {
  scenarioId: string;
  prompt: string;
  referenceImages?: string[];
};

export type GenerateCharacterResult = {
  scenarioId: string;
  imageUrl: string;
};

export async function generateCharacter(
  input: GenerateCharacterInput
): Promise<GenerateCharacterResult> {
  const result = await generateImage({
    prompt: input.prompt,
    referenceImages: input.referenceImages,
  });

  const response = await fetch(result.imageUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download image from Replicate: ${response.status} ${response.statusText}`
    );
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());

  const charactersDir = join(process.cwd(), "public", "images", "characters");
  await mkdir(charactersDir, { recursive: true });

  const fileName = `${input.scenarioId}-character.jpg`;
  await writeFile(join(charactersDir, fileName), imageBuffer);

  return {
    scenarioId: input.scenarioId,
    imageUrl: `/images/characters/${fileName}`,
  };
}
