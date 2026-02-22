"use server";

import { getVideoGenerating } from "@/lib/redis";

/** Returns node ids and "idle" that are currently being generated for this story. */
export async function getGeneratingVideoSlots(
  storyId: string
): Promise<string[]> {
  return await getVideoGenerating(storyId);
}
