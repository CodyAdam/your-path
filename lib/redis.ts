import { Redis } from "@upstash/redis";
import z from "zod";
import { type GraphStructure, graphStructure } from "./graph-structure";

if (!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)) {
  throw new Error("KV_REST_API_URL and KV_REST_API_TOKEN must be set");
}

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const STORY_CREDITS_KEY = (storyId: string) => `story:${storyId}:credits`;
const STORY_DATA_KEY = (storyId: string) => `story:${storyId}:data`;
const VIDEO_GENERATING_KEY = (storyId: string) =>
  `story:${storyId}:video:generating`;

/** Increment credits for a story (e.g. after successful payment). Returns new total. */
export async function incrementStoryCredits(
  storyId: string,
  amount: number
): Promise<number> {
  const newTotal = await redis.incrby(STORY_CREDITS_KEY(storyId), amount);
  return newTotal;
}

export async function getStoryCredits(storyId: string): Promise<number> {
  const creditsRaw = await redis.get(STORY_CREDITS_KEY(storyId));
  const credits = z.number().parse(creditsRaw ?? 0);
  return credits;
}

export async function getStoryData(
  storyId: string
): Promise<GraphStructure | null> {
  const dataRaw = await redis.get(STORY_DATA_KEY(storyId));
  const data = graphStructure.nullable().parse(dataRaw);
  if (!data && (await getStoryCredits(storyId)) === 0) {
    return null;
  }
  // create the story if it doesn't exist
  if (!data) {
    await setStoryData(storyId, {
      id: storyId,
      title: "Untitled",
      prompt: "",
      startNodeId: "start",
      nodes: [],
    });
    return await getStoryData(storyId);
  }
  return data;
}

export async function setStoryData(storyId: string, data: GraphStructure) {
  await redis.set(STORY_DATA_KEY(storyId), JSON.stringify(data));
}

export async function listStories(): Promise<GraphStructure[]> {
  const keys = await redis.keys("story:*:data");
  const storiesRaw = await Promise.all(keys.map((key) => redis.get(key)));
  const parsedStories = storiesRaw
    .map((raw) => {
      try {
        return raw
          ? graphStructure.parse(
              typeof raw === "string" ? JSON.parse(raw) : raw
            )
          : null;
      } catch {
        return null;
      }
    })
    .filter(
      (story): story is GraphStructure =>
        !!story && Array.isArray(story.nodes) && story.nodes.length > 0
    );

  return parsedStories;
}

/** Slot is nodeId or "idle" for the idle video. Returns true if this process claimed the slot (should proceed); false if already generating. */
export async function addVideoGenerating(
  storyId: string,
  slot: string
): Promise<boolean> {
  const added = await redis.sadd(VIDEO_GENERATING_KEY(storyId), slot);
  return added === 1;
}

export async function removeVideoGenerating(
  storyId: string,
  slot: string
): Promise<void> {
  await redis.srem(VIDEO_GENERATING_KEY(storyId), slot);
}

/** Node ids and "idle" currently being generated for this story. */
export async function getVideoGenerating(storyId: string): Promise<string[]> {
  const members = await redis.smembers(VIDEO_GENERATING_KEY(storyId));
  return members ?? [];
}
