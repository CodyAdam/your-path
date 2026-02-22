"use client";

import { useMutation } from "@tanstack/react-query";
import { LucidePhoneOff, LucideRotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { selectPath } from "@/app/actions/select-path";
import { EmotionVisualizer } from "@/components/emotion-visualizer";
import { PlayCameraPreview } from "@/components/PlayCameraPreview";
import { PlaySpeechInput } from "@/components/PlaySpeechInput";
import { Button } from "@/components/ui/button";
import {
  type EmotionScores,
  formatEmotionContextForPrompt,
} from "@/lib/emotion-recognition";
import type { GraphStructure } from "@/lib/graph-structure";

type VideoPhase = "main" | "idle";

export function PlayClient({
  graph,
  id: graphId,
}: {
  graph: GraphStructure;
  id: string;
}) {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(
    graph.startNodeId
  );
  const currentNode = useMemo(() => {
    return graph.nodes.find((node) => node.id === currentNodeId);
  }, [currentNodeId, graph.nodes]);

  const [videoPhase, setVideoPhase] = useState<VideoPhase>("main");
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const idleVideoRef = useRef<HTMLVideoElement>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [emotionScores, setEmotionScores] = useState<EmotionScores>(() =>
    Array.from({ length: 8 }, () => 0)
  );

  const hasMainVideo = Boolean(currentNode?.videoUrl?.trim());
  const hasIdleVideo = Boolean(graph.idleVideoUrl?.trim());
  const showScriptFallback = !hasMainVideo;

  const selectPathMutation = useMutation({
    mutationFn: ({
      userInput: input,
      script: _script,
      emotionContext,
    }: {
      userInput: string;
      script: string;
      emotionContext?: string;
    }) => {
      if (emotionContext) {
        console.log(
          `%cEmotion: ${emotionContext}`,
          "font-size:11px; color: #828282;"
        );
      }
      return selectPath(
        graphId,
        currentNodeId ?? "",
        input,
        history,
        emotionContext ?? undefined
      );
    },
    onSuccess: (nextNode, { script, userInput: input }) => {
      console.log(
        `%c${nextNode.selectedOption.condition}`,
        "color: #e4937c; font-weight: bold; font-size: 2rem;"
      );
      console.log(
        `%c${nextNode.newNode.script}`,
        "color: #eb5025; font-weight: bold; font-size: 2rem;"
      );
      setHistory((prev) => [...prev, `Assistant: ${script}`, `User: ${input}`]);
      setVideoPhase("main");
      setCurrentNodeId(nextNode.newNode.id);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to select path");
    },
  });

  const handleTranscribed = useCallback(
    (transcript: string) => {
      if (!(currentNodeId && transcript.trim())) {
        return;
      }
      selectPathMutation.mutate({
        userInput: transcript.trim(),
        script: currentNode?.script ?? "",
        emotionContext: formatEmotionContextForPrompt(emotionScores),
      });
    },
    [currentNodeId, currentNode?.script, emotionScores, selectPathMutation]
  );

  // Play main video when in main phase and we have a main video (re-run when node changes so new src plays)
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentNodeId intentionally triggers re-play when node changes
  useEffect(() => {
    if (videoPhase !== "main" || !hasMainVideo) {
      return;
    }
    const el = mainVideoRef.current;
    if (!el) {
      return;
    }
    el.currentTime = 0;
    el.play().catch(() => undefined);
  }, [videoPhase, hasMainVideo, currentNodeId]);

  // Play idle video when in idle phase
  useEffect(() => {
    if (videoPhase !== "idle" || !hasIdleVideo) {
      return;
    }
    const el = idleVideoRef.current;
    if (!el) {
      return;
    }
    el.currentTime = 0;
    el.play().catch(() => undefined);
  }, [videoPhase, hasIdleVideo]);

  // Preload idle video as soon as we have an idle URL so it’s ready when main ends
  useEffect(() => {
    if (!hasIdleVideo) {
      return;
    }
    const el = idleVideoRef.current;
    if (el) {
      el.load();
    }
  }, [hasIdleVideo]);

  const handleMainVideoEnded = useCallback(() => {
    if (hasIdleVideo) {
      setVideoPhase("idle");
    }
  }, [hasIdleVideo]);

  useEffect(() => {
    if (currentNode?.toast) {
      const { message, type } = currentNode.toast;
      if (type === "positive") {
        toast.success(message);
      } else if (type === "negative") {
        toast.error(message);
      } else {
        toast(message);
      }
    }
  }, [currentNode]);

  const isPending = selectPathMutation.isPending;
  const hasOptions = (currentNode?.options.length ?? 0) > 0;

  const showingMainVideo = videoPhase === "main" && hasMainVideo;
  const showingIdleVideo = videoPhase === "idle" && hasIdleVideo;
  const showingScriptFallback = showScriptFallback;
  const endingNodeFinishedPlaying =
    videoPhase === "idle" && currentNode?.options.length === 0;

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        {hasMainVideo && (
          <div
            className="absolute inset-0 transition-opacity duration-300 ease-in-out"
            style={{
              opacity: showingMainVideo ? 1 : 0,
              zIndex: showingMainVideo ? 1 : 0,
              pointerEvents: showingMainVideo ? "auto" : "none",
            }}
          >
            <video
              className="h-full w-full object-cover"
              key={currentNode?.videoUrl}
              muted={false}
              onEnded={handleMainVideoEnded}
              playsInline
              ref={mainVideoRef}
              src={currentNode?.videoUrl}
            />
          </div>
        )}
        {hasIdleVideo && (
          <div
            className="absolute inset-0 transition-opacity duration-300 ease-in-out"
            style={{
              opacity: showingIdleVideo && !endingNodeFinishedPlaying ? 1 : 0,
              zIndex: showingIdleVideo && !endingNodeFinishedPlaying ? 1 : 0,
              pointerEvents:
                showingIdleVideo && !endingNodeFinishedPlaying
                  ? "auto"
                  : "none",
            }}
          >
            <video
              className="h-full w-full object-cover"
              key="idle"
              loop
              muted={false}
              playsInline
              preload="auto"
              ref={idleVideoRef}
              src={graph.idleVideoUrl}
            />
          </div>
        )}
        {showingScriptFallback && (
          <div className="max-w-3xl border border-white/20 bg-black/60 p-10 text-white">
            {currentNode?.script}
          </div>
        )}
      </div>
      <Image
        alt="vignette"
        className="absolute inset-0 opacity-50"
        fill
        src="/images/vignette.png"
      />
      <div className="absolute bottom-4 left-4 flex w-1/4 flex-col gap-2 rounded-3xl bg-black/40">
        <EmotionVisualizer scores={emotionScores} />
        <div className="overflow-hidden rounded-3xl">
          <PlayCameraPreview onEmotionScores={setEmotionScores} />
        </div>
      </div>

      {endingNodeFinishedPlaying && (
        <div className="fade-in absolute z-10 flex max-w-3xl animate-in flex-col items-center justify-center gap-4 bg-black p-10 text-white duration-1000">
          <div
            className="mt-20 flex flex-col items-center gap-6"
            key={currentNodeId}
          >
            <h1 className="font-bold text-2xl">The end...</h1>
            <div className="flex gap-3">
              <Link href="/">
                <Button
                  className="h-14 gap-4 rounded-full px-4! text-lg"
                  variant="destructive"
                >
                  <LucidePhoneOff className="size-6" />
                  Disconnect
                </Button>
              </Link>
              <Button
                className="h-14 gap-4 rounded-full px-4! text-lg"
                disabled={isPending}
                onClick={() => {
                  setVideoPhase("main");
                  setCurrentNodeId(graph.startNodeId);
                }}
                type="button"
                variant="secondary"
              >
                <LucideRotateCcw className="size-6" />
              </Button>
            </div>
          </div>
        </div>
      )}
      {hasOptions && (
        <PlaySpeechInput
          disabled={isPending}
          onTranscribed={handleTranscribed}
        />
      )}
    </div>
  );
}
