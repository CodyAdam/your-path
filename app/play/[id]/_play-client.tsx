"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { GraphStructure } from "@/lib/graph-structure";

export function PlayClient({
  graph,
  id: _id,
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

  const [userInput, setUserInput] = useState<string>("");

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

  const handleSubmit = () => {
    toast.info("Not implemented yet");
  };
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center">
      <Link className="absolute top-4 left-4" href="/">
        <Button variant={"ghost"}>
          <ArrowLeft className="h-5 w-5" />
          Back
        </Button>
      </Link>
      <main className="flex max-w-3xl flex-col items-center justify-center gap-4 p-10">
        <div className="border p-10">{currentNode?.script}</div>
        <Textarea
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your response here..."
          value={userInput}
        />
        <Button onClick={handleSubmit} type="button">
          Submit
        </Button>
        <div className="mt-20 flex flex-col gap-2" key={currentNodeId}>
          {currentNode?.options.map((option) => (
            <Button
              key={`${option.condition}-${option.nodeId}`}
              onClick={() => setCurrentNodeId(option.nodeId)}
              type="button"
            >
              {option.condition}
            </Button>
          ))}
          {currentNode?.options.length === 0 && (
            <>
              The end...
              <Button
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
