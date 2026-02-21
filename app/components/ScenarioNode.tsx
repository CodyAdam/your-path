"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";

export type ScenarioNodeData = {
  label: string;
  script: string;
  isStart?: boolean;
  optionCount?: number;
};

const scriptPreview = (script: string, maxLen = 80) =>
  script.length <= maxLen ? script : script.slice(0, maxLen).trim() + "…";

function ScenarioNodeComponent(props: NodeProps) {
  const { data, selected } = props;
  const d = (data ?? {}) as ScenarioNodeData;
  const preview = scriptPreview(d.script ?? "");

  return (
    <div
      className={`min-w-[220px] max-w-[280px] rounded-lg border-2 bg-white px-3 py-2 shadow-sm dark:border-zinc-600 dark:bg-zinc-900 ${selected ? "border-violet-500 ring-2 ring-violet-500/20 dark:border-violet-400" : "border-zinc-200 dark:border-zinc-700"}
        ${d.isStart ? "border-amber-400 ring-2 ring-amber-400/50 dark:border-amber-500" : ""}
      `}
    >
      <Handle
        className="!w-2 !h-2 !border-2 !bg-white dark:!bg-zinc-800"
        position={Position.Top}
        type="target"
      />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            {d.label}
          </span>
          {d.isStart && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-[10px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              Start
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-xs text-zinc-600 leading-snug dark:text-zinc-400">
          {preview}
        </p>
        {d.optionCount != null && d.optionCount > 0 && (
          <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
            {d.optionCount} path{d.optionCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <Handle
        className="!w-2 !h-2 !border-2 !bg-white dark:!bg-zinc-800"
        position={Position.Bottom}
        type="source"
      />
    </div>
  );
}

export const ScenarioNode = memo(ScenarioNodeComponent);
