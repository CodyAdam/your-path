"use server";

import { put } from "@vercel/blob";
import type { GraphStructure } from "@/lib/graph-structure";
import {
  addVideoGenerating,
  getStoryData,
  removeVideoGenerating,
  setStoryData,
} from "@/lib/redis";
import { generateVideoFromImage } from "./_processing/video-generation";

const DEFAULT_DURATION = 5; // Seedance (Fal) duration in seconds

export interface GenerateStoryVideoInput {
  /** Duration in seconds (Fal Seedance). */
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
  /** If false, do not update the story graph (caller will update once). Default true. */
  updateGraph?: boolean;
}

export type GenerateStoryVideoResult =
  | { success: true; videoUrl: string }
  | { success: false; error: string };

/**
 * Generate a short video from an image + prompt using Fal (Seedance),
 * upload to Vercel Blob, and optionally update the Redis graph (node videoUrl or idleVideoUrl).
 */
function slotFromInput(input: GenerateStoryVideoInput): string | null {
  if (!input.storyId) {
    return null;
  }
  if (input.isIdleVideo) {
    return "idle";
  }
  if (input.nodeId !== undefined) {
    return input.nodeId;
  }
  return null;
}

export async function generateStoryVideo(
  input: GenerateStoryVideoInput
): Promise<GenerateStoryVideoResult> {
  const duration = input.duration ?? DEFAULT_DURATION;
  const slot = slotFromInput(input);

  if (slot !== null && input.storyId) {
    const claimed = await addVideoGenerating(input.storyId, slot);
    if (!claimed) {
      return {
        success: false,
        error: "This video is already being generated.",
      };
    }
  }

  try {
    const { videoUrl: falVideoUrl } = await generateVideoFromImage({
      imageUrl: input.imageUrl,
      prompt: input.prompt,
      duration,
    });

    const res = await fetch(falVideoUrl);
    if (!res.ok) {
      throw new Error(
        `Failed to download generated video: ${res.status} ${res.statusText}`
      );
    }
    const videoBuffer = Buffer.from(await res.arrayBuffer());

    const blobPath = buildBlobPath(input);

    const blob = await put(blobPath, videoBuffer, {
      access: "public",
      contentType: "video/mp4",
    });

    if (input.updateGraph !== false) {
      await maybeUpdateGraph(input, blob.url);
    }

    return { success: true, videoUrl: blob.url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Video generation failed.";
    return { success: false, error: message };
  } finally {
    if (slot !== null && input.storyId) {
      await removeVideoGenerating(input.storyId, slot);
    }
  }
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
