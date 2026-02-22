"use server";

import {
  getStoryCredits,
  getStoryData,
  incrementStoryCredits,
  setStoryData,
} from "@/lib/redis";
import { generateStoryVideo } from "./generate-story-video";

export type GenerateStoryVideosResult =
  | { success: true; nodesGenerated: number; idleGenerated: boolean }
  | { success: false; error: string };

/**
 * Main API: generate videos for all nodes + idle in parallel.
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
  const totalCost = 5;

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
    const idlePrompt = `${graph.prompt}. The character sits quietly, listening. Subtle natural movements — blinking, slight breathing. No speaking.`;

    // Run all node videos + idle video in parallel (no graph updates yet)
    const nodePromises = graph.nodes.map((node) =>
      generateStoryVideo({
        imageUrl,
        prompt: `${graph.prompt}. Scene: ${node.script}`,
        storyId,
        nodeId: node.id,
        duration: 6,
        updateGraph: false,
      }).then((result) => ({ node, result }))
    );

    const idlePromise = generateStoryVideo({
      imageUrl,
      prompt: idlePrompt,
      storyId,
      isIdleVideo: true,
      duration: 6,
      updateGraph: false,
    });

    const [nodeResults, idleResult] = await Promise.all([
      Promise.all(nodePromises),
      idlePromise,
    ]);

    const failedNode = nodeResults.find((r) => !r.result.success);
    if (failedNode && failedNode.result.success === false) {
      const err = failedNode.result.error;
      console.error("[generateStoryVideos] node failed", {
        nodeId: failedNode.node.id,
        error: err,
      });
      await incrementStoryCredits(storyId, totalCost);
      return {
        success: false,
        error: `Node "${failedNode.node.title}": ${err}`,
      };
    }

    if (!idleResult.success) {
      const err = idleResult.error;
      console.error("[generateStoryVideos] idle failed", { error: err });
      await incrementStoryCredits(storyId, totalCost);
      return {
        success: false,
        error: `Idle video: ${err}`,
      };
    }

    // Single graph update with all video URLs
    const currentGraph = await getStoryData(storyId);
    if (!currentGraph) {
      await incrementStoryCredits(storyId, totalCost);
      return { success: false, error: "Story not found during update." };
    }

    const nodeIdsToUrl = new Map(
      nodeResults.map((r) => [
        r.node.id,
        (r.result as { success: true; videoUrl: string }).videoUrl,
      ])
    );
    const updatedNodes = currentGraph.nodes.map((node) => {
      const url = nodeIdsToUrl.get(node.id);
      return url ? { ...node, videoUrl: url } : node;
    });
    await setStoryData(storyId, {
      ...currentGraph,
      nodes: updatedNodes,
      idleVideoUrl: idleResult.videoUrl,
    });

    console.log("[generateStoryVideos] complete", {
      storyId,
      nodesGenerated: nodeResults.length,
      idleGenerated: true,
    });

    return {
      success: true,
      nodesGenerated: nodeResults.length,
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
