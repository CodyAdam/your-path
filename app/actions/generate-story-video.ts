"use server";

import { vertex } from "@ai-sdk/google-vertex";
import { put } from "@vercel/blob";
import { experimental_generateVideo as generateVideo } from "ai";
import type { GraphStructure } from "@/lib/graph-structure";
import { getStoryData, setStoryData } from "@/lib/redis";

const VEO_MODEL_ID = "veo-3.1-fast-generate-001" as const;
const DEFAULT_DURATION = 6; // Veo 3.1 supports 4, 6, 8 seconds
const ASPECT_RATIO = "16:9" as const;
const RESOLUTION = "1280x720" as const;

export interface GenerateStoryVideoInput {
  /** Duration in seconds. Veo 3.1 supports 4, 6, or 8. */
  duration?: number;
  /** Image URL (https) or base64 data URI to animate. */
  imageUrl: string;
  /** If true with storyId, update the graph's idleVideoUrl instead of a node. */
  isIdleVideo?: boolean;
  /** If set with storyId, update this node's videoUrl. Ignored if isIdleVideo is true. */
  nodeId?: string;
  /** Text prompt describing the desired motion/scene. */
  prompt: string;
  /** If set, upload to Blob and store URL on this story's node. */
  storyId?: string;
}

export type GenerateStoryVideoResult =
  | { success: true; videoUrl: string }
  | { success: false; error: string };

/**
 * Generate a short video from an image + prompt using AI SDK and Veo 3.1 Fast,
 * upload to Vercel Blob, and optionally update the Redis graph (node videoUrl or idleVideoUrl).
 */
export async function generateStoryVideo(
  input: GenerateStoryVideoInput
): Promise<GenerateStoryVideoResult> {
  const duration = input.duration ?? DEFAULT_DURATION;
  const clampedDuration = clampVeoDuration(duration);

  try {
    const model = vertex.video(VEO_MODEL_ID);

    const { video } = await generateVideo({
      model,
      prompt: {
        image: input.imageUrl,
        text: input.prompt,
      },
      aspectRatio: ASPECT_RATIO,
      resolution: RESOLUTION,
      duration: clampedDuration,
      providerOptions: {
        vertex: {
          generateAudio: false,
          pollTimeoutMs: 600_000, // 10 min
        },
      },
    });

    const blobPath = buildBlobPath(input);

    const blob = await put(blobPath, Buffer.from(video.uint8Array), {
      access: "public",
      contentType: video.mediaType ?? "video/mp4",
    });

    const videoUrl = blob.url;

    await maybeUpdateGraph(input, videoUrl);

    return { success: true, videoUrl };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Video generation failed.";
    return { success: false, error: message };
  }
}

function clampVeoDuration(seconds: number): 4 | 6 | 8 {
  if (seconds <= 4) {
    return 4;
  }
  if (seconds <= 6) {
    return 6;
  }
  return 8;
}

function buildBlobPath(input: GenerateStoryVideoInput): string {
  const hasStoryTarget =
    input.storyId && (input.nodeId !== undefined || input.isIdleVideo);
  if (!hasStoryTarget) {
    return `stories/videos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`;
  }
  if (input.isIdleVideo) {
    return `stories/${input.storyId}/videos/idle.mp4`;
  }
  return `stories/${input.storyId}/videos/${input.nodeId}-main.mp4`;
}

async function maybeUpdateGraph(
  input: GenerateStoryVideoInput,
  videoUrl: string
): Promise<void> {
  const shouldUpdate =
    input.storyId && (input.nodeId !== undefined || input.isIdleVideo === true);
  if (!shouldUpdate) {
    return;
  }

  const storyId = input.storyId;
  if (!storyId) {
    return;
  }

  const graph = await getStoryData(storyId);
  if (!graph) {
    return;
  }

  const nodeId = input.isIdleVideo ? undefined : input.nodeId;
  const updated = updateGraphWithVideo(graph, {
    videoUrl,
    nodeId,
    isIdleVideo: input.isIdleVideo ?? false,
  });
  await setStoryData(storyId, updated);
}

function updateGraphWithVideo(
  graph: GraphStructure,
  options: {
    videoUrl: string;
    nodeId?: string;
    isIdleVideo: boolean;
  }
): GraphStructure {
  if (options.isIdleVideo) {
    return { ...graph, idleVideoUrl: options.videoUrl };
  }
  if (!options.nodeId) {
    return graph;
  }
  const nodes = graph.nodes.map((node) =>
    node.id === options.nodeId ? { ...node, videoUrl: options.videoUrl } : node
  );
  return { ...graph, nodes };
}
