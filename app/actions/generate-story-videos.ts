"use server";

import {
  getStoryCredits,
  getStoryData,
  incrementStoryCredits,
} from "@/lib/redis";
import { generateStoryVideo } from "./generate-story-video";

/** Cost per generated video (main or idle). */
const CREDITS_PER_VIDEO = 1;

export type GenerateStoryVideosResult =
  | { success: true; nodesGenerated: number; idleGenerated: boolean }
  | { success: false; error: string };

/**
 * Main API: generate videos for all nodes + idle, sequentially.
 * Checks and uses credits; refunds on failure.
 */
export async function generateStoryVideos(
  storyId: string
): Promise<GenerateStoryVideosResult> {
  console.log("[generateStoryVideos] start", { storyId });

  const graph = await getStoryData(storyId);
  if (!graph) {
    console.log("[generateStoryVideos] no graph found", { storyId });
    return { success: false, error: "Story not found." };
  }

  const nodeCount = graph.nodes.length;
  const totalVideos = nodeCount + 1; // nodes + idle
  const totalCost = totalVideos * CREDITS_PER_VIDEO;

  const credits = await getStoryCredits(storyId);
  console.log("[generateStoryVideos] credits check", {
    storyId,
    credits,
    required: totalCost,
    nodeCount,
  });

  if (credits < totalCost) {
    return {
      success: false,
      error: `Not enough credits. Need ${totalCost} (${nodeCount} nodes + 1 idle), have ${credits}.`,
    };
  }

  const imageUrl = graph.startImageUrl;
  if (!imageUrl?.trim()) {
    return {
      success: false,
      error: "Story has no start image. Generate a story first.",
    };
  }

  // Deduct credits upfront; we will refund on failure
  await incrementStoryCredits(storyId, -totalCost);
  console.log("[generateStoryVideos] credits deducted", {
    storyId,
    deducted: totalCost,
  });

  try {
    let nodesGenerated = 0;

    for (let i = 0; i < graph.nodes.length; i++) {
      const node = graph.nodes[i];
      const step = i + 1;
      console.log("[generateStoryVideos] node video", {
        step,
        total: graph.nodes.length,
        nodeId: node.id,
        title: node.title,
      });

      const prompt = `${graph.prompt}. Scene: ${node.script}`;
      const result = await generateStoryVideo({
        imageUrl,
        prompt,
        storyId,
        nodeId: node.id,
        duration: 6,
      });

      if (!result.success) {
        console.error("[generateStoryVideos] node failed", {
          nodeId: node.id,
          error: result.error,
        });
        await incrementStoryCredits(storyId, totalCost);
        return {
          success: false,
          error: `Node "${node.title}": ${result.error}`,
        };
      }

      nodesGenerated++;
      console.log("[generateStoryVideos] node done", {
        step,
        nodeId: node.id,
        videoUrl: result.videoUrl,
      });
    }

    // Idle video
    const idlePrompt = `${graph.prompt}. The character sits quietly, listening. Subtle natural movements — blinking, slight breathing. No speaking.`;
    console.log("[generateStoryVideos] idle video start");

    const idleResult = await generateStoryVideo({
      imageUrl,
      prompt: idlePrompt,
      storyId,
      isIdleVideo: true,
      duration: 6,
    });

    if (!idleResult.success) {
      console.error("[generateStoryVideos] idle failed", {
        error: idleResult.error,
      });
      await incrementStoryCredits(storyId, totalCost);
      return {
        success: false,
        error: `Idle video: ${idleResult.error}`,
      };
    }

    console.log("[generateStoryVideos] idle done", {
      videoUrl: idleResult.videoUrl,
    });
    console.log("[generateStoryVideos] complete", {
      storyId,
      nodesGenerated,
      idleGenerated: true,
    });

    return {
      success: true,
      nodesGenerated,
      idleGenerated: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generateStoryVideos] unexpected error", {
      storyId,
      error: message,
    });
    await incrementStoryCredits(storyId, totalCost);
    return { success: false, error: message };
  }
}
