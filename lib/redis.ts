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

/** Increment credits for a story (e.g. after successful payment). Returns new total. */
export async function incrementStoryCredits(storyId: string): Promise<number> {
  const newTotal = await redis.incr(STORY_CREDITS_KEY(storyId));
  return newTotal;
}

export async function getStoryCredits(storyId: string): Promise<number> {
  const creditsRaw = await redis.get(STORY_CREDITS_KEY(storyId));
  const credits = z.number().parse(creditsRaw ?? 0);
  return credits;
}

export async function getStoryData(storyId: string): Promise<GraphStructure> {
  const dataRaw = await redis.get(STORY_DATA_KEY(storyId));
  const data = graphStructure.parse(dataRaw);
  return data;
}

export async function setStoryData(storyId: string, data: GraphStructure) {
  await redis.set(STORY_DATA_KEY(storyId), JSON.stringify(data));
}
