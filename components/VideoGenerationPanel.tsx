"use client";

import { useCallback, useState } from "react";
import type { z } from "zod";
import { generateVideo } from "@/app/actions/generate-video";
import type { graphStructure } from "@/lib/graph-structure";
import type { NodeVideoStatus, VideoGenerationState } from "@/lib/video-types";

type Graph = z.infer<typeof graphStructure>;

function initState(graph: Graph): VideoGenerationState {
  const state: VideoGenerationState = {};
  for (const node of graph.nodes) {
    state[node.id] = { status: "pending" };
  }
  return state;
}

export function VideoGenerationPanel({ graph }: { graph: Graph }) {
  const [videoState, setVideoState] = useState<VideoGenerationState>(() =>
    initState(graph)
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const setNodeStatus = useCallback(
    (nodeId: string, status: NodeVideoStatus) => {
      setVideoState((prev) => ({ ...prev, [nodeId]: status }));
    },
    []
  );

  const isTerminalNode = useCallback(
    (nodeId: string) => {
      const node = graph.nodes.find((n) => n.id === nodeId);
      return !node || node.options.length === 0;
    },
    [graph]
  );

  const generateSingle = useCallback(
    async (nodeId: string) => {
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node) {
        return;
      }

      const skipIdle = node.options.length === 0;

      setNodeStatus(nodeId, { status: "generating", phase: "main" });

      try {
        const result = await generateVideo({
          nodeId: node.id,
          script: node.script,
          imageUrl: graph.startImageUrl,
          graphPrompt: graph.prompt,
          skipIdle,
        });

        if (result.idleVideoUrl) {
          setNodeStatus(nodeId, {
            status: "completed",
            mainVideoUrl: result.mainVideoUrl,
            idleVideoUrl: result.idleVideoUrl,
          });
        } else {
          setNodeStatus(nodeId, {
            status: "completed",
            mainVideoUrl: result.mainVideoUrl,
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Video generation failed";
        setNodeStatus(nodeId, { status: "error", error: message });
      }
    },
    [graph, setNodeStatus]
  );

  const generateAll = useCallback(async () => {
    setIsGenerating(true);

    for (const node of graph.nodes) {
      const skipIdle = node.options.length === 0;

      setNodeStatus(node.id, { status: "generating", phase: "main" });

      try {
        const result = await generateVideo({
          nodeId: node.id,
          script: node.script,
          imageUrl: graph.startImageUrl,
          graphPrompt: graph.prompt,
          skipIdle,
        });

        if (result.idleVideoUrl) {
          setNodeStatus(node.id, {
            status: "completed",
            mainVideoUrl: result.mainVideoUrl,
            idleVideoUrl: result.idleVideoUrl,
          });
        } else {
          setNodeStatus(node.id, {
            status: "completed",
            mainVideoUrl: result.mainVideoUrl,
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Video generation failed";
        setNodeStatus(node.id, { status: "error", error: message });
      }
    }

    setIsGenerating(false);
  }, [graph, setNodeStatus]);

  const totalNodes = graph.nodes.length;
  const completedCount = Object.values(videoState).filter(
    (s) => s.status === "completed"
  ).length;
  const progressPercent =
    totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;

  return (
    <div className="flex w-full flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
            Video Generation
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {completedCount} / {totalNodes} completed
          </p>
        </div>

        <button
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          disabled={isGenerating}
          onClick={generateAll}
          type="button"
        >
          {isGenerating ? "Generating..." : "Generate All Videos"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Node list */}
      <div className="flex flex-col gap-3">
        {graph.nodes.map((node) => {
          const nodeStatus = videoState[node.id];
          if (!nodeStatus) {
            return null;
          }

          return (
            <div
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
              key={node.id}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                  {node.title}
                </h3>

                {/* Status badge */}
                {nodeStatus.status === "pending" && (
                  <span className="inline-flex items-center rounded-full bg-zinc-200 px-2.5 py-0.5 font-medium text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                    Pending
                  </span>
                )}
                {nodeStatus.status === "generating" && (
                  <span className="inline-flex animate-pulse items-center rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-700 text-xs dark:bg-amber-900/40 dark:text-amber-400">
                    Generating {nodeStatus.phase === "main" ? "main" : "idle"}{" "}
                    video
                  </span>
                )}
                {nodeStatus.status === "completed" && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-700 text-xs dark:bg-green-900/40 dark:text-green-400">
                    Completed
                  </span>
                )}
                {nodeStatus.status === "error" && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-700 text-xs dark:bg-red-900/40 dark:text-red-400">
                    Error
                  </span>
                )}
              </div>

              {/* Video previews */}
              {nodeStatus.status === "completed" && (
                <div className="mt-3 flex flex-col gap-3">
                  <div>
                    <p className="mb-1 font-medium text-xs text-zinc-500 dark:text-zinc-400">
                      Main Video
                    </p>
                    <video
                      className="w-full rounded-lg"
                      controls
                      preload="metadata"
                      src={nodeStatus.mainVideoUrl}
                    />
                  </div>
                  {"idleVideoUrl" in nodeStatus && nodeStatus.idleVideoUrl && (
                    <div>
                      <p className="mb-1 font-medium text-xs text-zinc-500 dark:text-zinc-400">
                        Idle Video (loops while user responds)
                      </p>
                      <video
                        className="w-full rounded-lg"
                        controls
                        loop
                        preload="metadata"
                        src={nodeStatus.idleVideoUrl}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Error message + retry */}
              {nodeStatus.status === "error" && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-red-600 text-sm dark:text-red-400">
                    {nodeStatus.error}
                  </p>
                  <button
                    className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 font-medium text-xs text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    disabled={isGenerating}
                    onClick={() => generateSingle(node.id)}
                    type="button"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
