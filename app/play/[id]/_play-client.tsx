"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { selectPath } from "@/app/actions/select-path";
import { PlayCameraPreview } from "@/components/PlayCameraPreview";
import { PlaySpeechInput } from "@/components/PlaySpeechInput";
import { Button } from "@/components/ui/button";
import type { GraphStructure } from "@/lib/graph-structure";

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

  const [history, setHistory] = useState<string[]>([]);

  const selectPathMutation = useMutation({
    mutationFn: ({ userInput: input }: { userInput: string; script: string }) =>
      selectPath(graphId, currentNodeId ?? "", input, history),
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
      });
    },
    [currentNodeId, currentNode?.script, selectPathMutation]
  );

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

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center">
      <PlayCameraPreview />
      <Link className="absolute top-4 left-4 z-10" href="/">
        <Button disabled={isPending} variant="ghost">
          <ArrowLeft className="h-5 w-5" />
          Back
        </Button>
      </Link>
      <main className="flex max-w-3xl flex-col items-center justify-center gap-4 p-10">
        <div className="border p-10">{currentNode?.script}</div>
        {hasOptions && (
          <PlaySpeechInput
            disabled={isPending}
            onTranscribed={handleTranscribed}
          />
        )}
        <div className="mt-20 flex flex-col gap-2" key={currentNodeId}>
          {hasOptions &&
            currentNode?.options.map((option) => (
              <Button
                disabled
                key={`${option.condition}-${option.nodeId}`}
                type="button"
              >
                {option.condition}
              </Button>
            ))}
          {currentNode?.options.length === 0 && (
            <>
              The end...
              <Button
                disabled={isPending}
                onClick={() => setCurrentNodeId(graph.startNodeId)}
                type="button"
              >
                Retry
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
