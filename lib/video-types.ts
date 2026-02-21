export type NodeVideoStatus =
  | { status: "pending" }
  | { status: "generating"; phase: "main" | "idle" }
  | { status: "completed"; mainVideoUrl: string; idleVideoUrl: string }
  | { status: "completed"; mainVideoUrl: string }
  | { status: "error"; error: string };

export type VideoGenerationState = Record<string, NodeVideoStatus>;
