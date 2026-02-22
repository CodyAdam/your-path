/** biome-ignore-all lint/a11y/useMediaCaption: ok */
"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { LucideVideoOff } from "lucide-react";
import { memo } from "react";
import type { NodeType } from "@/lib/graph-to-flow";

function ScenarioNodeComponent(props: NodeProps<NodeType>) {
  const { data, selected } = props;
  const isStart = data?.isStart ?? false;
  const d = data ?? { label: "", script: "" };
  const hasVideo = Boolean(d.videoUrl?.trim());
  const hasOptions = d.options.length > 0;

  return (
    <div
      className={`min-w-[220px] max-w-[280px] rounded-lg border-2 bg-white px-3 py-2 shadow-sm dark:border-zinc-600 dark:bg-zinc-900 ${selected ? "border-violet-500 ring-2 ring-violet-500/20 dark:border-violet-400" : "border-zinc-200 dark:border-zinc-700"}
        ${isStart ? "border-amber-400 ring-2 ring-amber-400/50 dark:border-amber-500" : ""}
      `}
    >
      {!isStart && <Handle position={Position.Top} type="target" />}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            {d.title}
          </span>
          {isStart && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-[10px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              Start
            </span>
          )}
        </div>
        <div className="nodrag aspect-video w-full cursor-default overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
          {hasVideo ? (
            <video
              className="h-full w-full object-cover"
              controls
              playsInline
              preload="metadata"
              src={d.videoUrl}
            />
          ) : (
            <div className="flex aspect-video h-full w-full flex-col items-center justify-center gap-2 px-2 text-center">
              <LucideVideoOff className="size-6 text-zinc-500 dark:text-zinc-400" />
              <p className="font-medium text-[10px] text-zinc-500 dark:text-zinc-400">
                No video for this node
              </p>
            </div>
          )}
        </div>
        <p className="line-clamp-4 text-xs text-zinc-600 leading-snug dark:text-zinc-400">
          {d.script}
        </p>
        {hasOptions && (
          <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
            {d.options.length} path{d.options.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      {hasOptions && <Handle position={Position.Bottom} type="source" />}
    </div>
  );
}

export const ScenarioNode = memo(ScenarioNodeComponent);
