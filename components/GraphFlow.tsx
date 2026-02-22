"use client";

import {
  Background,
  Controls,
  type DefaultEdgeOptions,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateGraph } from "@/app/actions/generate-graph";
import { generateStoryVideos } from "@/app/actions/generate-story-videos";
import { stripeCheckout } from "@/app/actions/stripe-checkout";
import type { GraphStructure } from "@/lib/graph-structure";
import { graphToFlow, type NodeType } from "@/lib/graph-to-flow";
import { cn } from "@/lib/utils";
import { ScenarioNode } from "./ScenarioNode";
import { StoryGenerationModal } from "./StoryGenerationModal";
import { StoryImageNode } from "./StoryImageNode";
import { StripeModal } from "./StripeModal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Textarea } from "./ui/textarea";
import { VideoGenerationModal } from "./VideoGenerationModal";

const nodeTypes = { scenario: ScenarioNode, storyImage: StoryImageNode };

interface GraphFlowProps {
  className?: string;
  graph: GraphStructure;
  remainingCredits: number;
  storyId: string;
}

export function GraphFlow({
  graph,
  className,
  storyId,
  remainingCredits,
}: GraphFlowProps) {
  const router = useRouter();
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => graphToFlow(graph),
    [graph]
  );

  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showStoryGenerationModal, setShowStoryGenerationModal] =
    useState(false);
  const [showVideosGenerationModal, setShowVideosGenerationModal] =
    useState(false);

  const defaultEdgeOptions = useMemo(
    () =>
      ({
        type: "default",
        labelStyle: { fontSize: 10 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      }) satisfies DefaultEdgeOptions,
    []
  );

  const STORY_CREDITS = 1;
  const VIDEO_CREDITS = 5;

  const handleGenerateStory = () => {
    if (remainingCredits >= STORY_CREDITS) {
      setShowStoryGenerationModal(true);
    } else {
      setShowStripeModal(true);
    }
  };

  const handleGenerateVideos = () => {
    if (remainingCredits >= VIDEO_CREDITS) {
      setShowVideosGenerationModal(true);
    } else {
      setShowStripeModal(true);
    }
  };

  const generateStory = useMutation({
    mutationFn: (prompt: string) => generateGraph(storyId, prompt),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleVideosGenerate = useMutation({
    mutationFn: () => generateStoryVideos(storyId),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className={cn(className, "relative")}>
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <Button
          disabled={generateStory.isPending}
          onClick={handleGenerateStory}
          variant={"default"}
        >
          {generateStory.isPending && (
            <Loader2 className="size-5 animate-spin" />
          )}
          Generate Story ({STORY_CREDITS} credit{STORY_CREDITS !== 1 ? "s" : ""}
          )
        </Button>
        <Button onClick={handleGenerateVideos} variant={"default"}>
          Generate Videos ({VIDEO_CREDITS} credits)
        </Button>
      </div>
      <StripeModal
        description={
          <>
            <p>You don&apos;t have enough credits for this action.</p>
            <p>
              Purchasing <strong>$5</strong> (10 credits) will add credits to
              your account. Continue?
            </p>
          </>
        }
        onOpenChange={setShowStripeModal}
        onPay={() =>
          stripeCheckout({
            storyId,
          })
        }
        open={showStripeModal}
        title="More credits needed"
      />
      <StoryGenerationModal
        creditCost={STORY_CREDITS}
        initialPrompt={graph.prompt}
        onOpenChange={setShowStoryGenerationModal}
        onSubmit={generateStory.mutate}
        open={showStoryGenerationModal}
        submitting={generateStory.isPending}
      />
      <VideoGenerationModal
        creditCost={VIDEO_CREDITS}
        nodeCount={graph.nodes.length}
        onGenerate={handleVideosGenerate.mutate}
        onOpenChange={setShowVideosGenerationModal}
        open={showVideosGenerationModal}
        submitting={handleVideosGenerate.isPending}
      />
      <Sheet
        onOpenChange={(open) => setSelectedNode(open ? selectedNode : null)}
        open={selectedNode !== null}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Node data</SheetTitle>
            <SheetDescription>Edit the node details here.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4">
            <div className="space-y-2">
              <Label>ID</Label>
              <Input defaultValue={selectedNode?.id} />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input defaultValue={selectedNode?.data.title} />
            </div>
            <div className="mb-8 space-y-2">
              <Label>Script</Label>
              <Textarea defaultValue={selectedNode?.data.script} />
            </div>
            {selectedNode?.data.options.map((option, i) => (
              <div
                className="space-y-2"
                key={`${option.condition}-${option.nodeId}`}
              >
                <Label>Option {i + 1}</Label>
                <Input defaultValue={option.nodeId} />
                <Input defaultValue={option.condition} />
              </div>
            ))}
            {selectedNode?.data.fallbackNodeId && (
              <div className="space-y-2">
                <Label>Fallback Node</Label>
                <Input defaultValue={selectedNode?.data.fallbackNodeId} />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <ReactFlow
        defaultEdgeOptions={defaultEdgeOptions}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        maxZoom={1.5}
        minZoom={0.2}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          if (node.type === "storyImage") {
            return;
          }
          setSelectedNode(node as NodeType);
        }}
        onNodesChange={onNodesChange}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          className="text-zinc-300 dark:text-zinc-600"
          gap={16}
          patternClassName="dark:fill-zinc-900"
          size={1}
        />
        <Controls className="border-zinc-200 bg-zinc-800 shadow-md dark:border-zinc-700 dark:bg-zinc-800" />
        <MiniMap
          className="border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          maskColor="rgb(240 240 245 / 0.7)"
          nodeStrokeWidth={2}
        />
      </ReactFlow>
    </div>
  );
}
