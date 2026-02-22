"use client";

import { EMOTION_NAMES, type EmotionScores } from "@/lib/emotion-recognition";

export function EmotionVisualizer({ scores }: { scores: EmotionScores }) {
  return (
    <div className="flex w-full flex-col gap-1 p-4">
      {EMOTION_NAMES.map((name, i) => {
        const pct = Math.round((scores[i] ?? 0) * 100);
        return (
          <div
            className="flex items-center gap-2"
            key={name}
            title={`${name}: ${pct}%`}
          >
            <div className="min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-700/80">
              <div
                className="h-1 rounded-full bg-emerald-100"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right font-medium text-[10px] text-zinc-300 tabular-nums">
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
