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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateGraph } from "@/app/actions/generate-graph";
import { stripeCheckout } from "@/app/actions/stripe-checkout";
import type { GraphStructure } from "@/lib/graph-structure";
import { graphToFlow, type NodeType } from "@/lib/graph-to-flow";
import { cn } from "@/lib/utils";
import { ScenarioNode } from "./ScenarioNode";
import { StoryGenerationModal } from "./StoryGenerationModal";
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

const nodeTypes = { scenario: ScenarioNode };

interface GraphFlowProps {
  className?: string;
  graph: GraphStructure;
  remainingCredits: number;
  storyId?: string;
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

  const handleStorySubmit = async (prompt: string) => {
    if (!storyId) {
      toast.error("Missing story. Please open this page from the editor.");
      return;
    }
    const result = await generateGraph(storyId, prompt);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  };

  const handleVideosGenerate = async () => {
    // TODO: mutation for video generation
  };

  return (
    <div className={cn(className, "relative")}>
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <Button onClick={handleGenerateStory} variant={"default"}>
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
        onSubmit={handleStorySubmit}
        open={showStoryGenerationModal}
      />
      <VideoGenerationModal
        creditCost={VIDEO_CREDITS}
        nodeCount={graph.nodes.length}
        onGenerate={handleVideosGenerate}
        onOpenChange={setShowVideosGenerationModal}
        open={showVideosGenerationModal}
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
          setSelectedNode(node);
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
