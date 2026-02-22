"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useMemo } from "react";
import "@xyflow/react/dist/style.css";

import type { GraphStructure } from "@/lib/graph-structure";
import { graphToFlow } from "@/lib/graph-to-flow";
import { ScenarioNode } from "./ScenarioNode";

const nodeTypes = { scenario: ScenarioNode };

interface GraphFlowProps {
  className?: string;
  graph: GraphStructure;
}

export function GraphFlow({ graph, className }: GraphFlowProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => graphToFlow(graph),
    [graph]
  );

  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "default",
      labelStyle: { fontSize: 10 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }),
    []
  );

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
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
        onNodesChange={onNodesChange}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          className="text-zinc-300 dark:text-zinc-600"
          gap={16}
          size={0.5}
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
