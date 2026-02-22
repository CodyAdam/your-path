"use server";

import { after } from "next/server";
import type { GraphStructure } from "@/lib/graph-structure";
import {
  addVideoGenerating,
  getStoryCredits,
  getStoryData,
  incrementStoryCredits,
  removeVideoGenerating,
  setStoryData,
} from "@/lib/redis";
import { generateStoryVideo } from "./generate-story-video";

export type GenerateStoryVideosResult =
  | { success: true; nodesGenerated: number; idleGenerated: boolean }
  | { success: false; error: string };

/** Claim video slots (nodes + idle) that are not already being generated. */
async function claimVideoSlots(
  storyId: string,
  graph: GraphStructure
): Promise<{
  nodesToRun: GraphStructure["nodes"];
  idleClaimed: boolean;
  claimedCount: number;
}> {
  const nodesToRun: GraphStructure["nodes"] = [];
  for (const node of graph.nodes) {
    const claimed = await addVideoGenerating(storyId, node.id);
    if (claimed) {
      nodesToRun.push(node);
    }
  }
  const idleClaimed = await addVideoGenerating(storyId, "idle");
  const claimedCount = nodesToRun.length + (idleClaimed ? 1 : 0);
  return { nodesToRun, idleClaimed, claimedCount };
}

/** Main API: generate videos for all nodes + idle in parallel. Checks and uses credits; refunds on failure. */
export async function generateStoryVideos(
  storyId: string
): Promise<GenerateStoryVideosResult> {
  console.log("[generateStoryVideos] start", { storyId });

  const graph = await getStoryData(storyId);
  if (!graph) {
    console.log("[generateStoryVideos] no graph found", { storyId });
    return { success: false, error: "Story not found." };
  }

  const credits = await getStoryCredits(storyId);
  const imageUrl = graph.startImageUrl;
  if (!imageUrl?.trim()) {
    return {
      success: false,
      error: "Story has no start image. Generate a story first.",
    };
  }

  const { nodesToRun, idleClaimed, claimedCount } = await claimVideoSlots(
    storyId,
    graph
  );

  if (claimedCount === 0) {
    return {
      success: false,
      error:
        "All videos for this story are already being generated. Wait for them to finish.",
    };
  }

  if (credits < claimedCount) {
    for (const node of nodesToRun) {
      await removeVideoGenerating(storyId, node.id);
    }
    if (idleClaimed) {
      await removeVideoGenerating(storyId, "idle");
    }
    return {
      success: false,
      error: `Not enough credits. Need ${claimedCount} for the remaining videos, have ${credits}.`,
    };
  }

  // Deduct credits for only what we're generating; we will refund on failure
  await incrementStoryCredits(storyId, -claimedCount);
  console.log("[generateStoryVideos] credits deducted, scheduling after()", {
    storyId,
    deducted: claimedCount,
    nodesToRun: nodesToRun.length,
    idleClaimed,
  });

  // Run the long-running generation after the response is sent so the request
  // doesn't time out; the platform keeps the invocation alive until this settles.
  after(async () => {
    try {
      const idlePrompt = `${graph.prompt}. The character sits quietly, listening. Subtle natural movements — blinking, slight breathing. No speaking.`;

      const nodePromises = nodesToRun.map((node) =>
        generateStoryVideo({
          imageUrl,
          prompt: `${graph.prompt}. Scene: ${node.script}`,
          storyId,
          nodeId: node.id,
          duration: 6,
          updateGraph: false,
        }).then((result) => ({ node, result }))
      );

      const idlePromise = idleClaimed
        ? generateStoryVideo({
            imageUrl,
            prompt: idlePrompt,
            storyId,
            isIdleVideo: true,
            duration: 6,
            updateGraph: false,
          })
        : Promise.resolve(null);

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
        await incrementStoryCredits(storyId, claimedCount);
        return;
      }

      if (idleClaimed && idleResult && !idleResult.success) {
        const err = idleResult.error;
        console.error("[generateStoryVideos] idle failed", { error: err });
        await incrementStoryCredits(storyId, claimedCount);
        return;
      }

      const currentGraph = await getStoryData(storyId);
      if (!currentGraph) {
        await incrementStoryCredits(storyId, claimedCount);
        return;
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
        ...(idleClaimed && idleResult && idleResult.success
          ? { idleVideoUrl: idleResult.videoUrl }
          : {}),
      });

      console.log("[generateStoryVideos] complete", {
        storyId,
        nodesGenerated: nodeResults.length,
        idleGenerated: idleClaimed,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[generateStoryVideos] unexpected error", {
        storyId,
        error: message,
      });
      await incrementStoryCredits(storyId, claimedCount);
    }
  });

  return {
    success: true,
    nodesGenerated: nodesToRun.length,
    idleGenerated: idleClaimed,
  };
}
