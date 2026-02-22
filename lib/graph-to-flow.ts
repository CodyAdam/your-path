import type { Edge, Node } from "@xyflow/react";
import type { GraphNode, GraphStructure } from "./graph-structure";
import { truncate } from "./utils";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 120;
const HORIZONTAL_GAP = 260;
const VERTICAL_GAP = 400;

export type NodeType = Node<GraphNode & { isStart: boolean }>;
export interface StoryImageNodeData extends Record<string, unknown> {
  imageUrl?: string;
}
export type FlowNode = NodeType | Node<StoryImageNodeData>;

/**
 * Converts a GraphStructure into React Flow nodes and edges with a simple
 * layered layout (BFS from startNodeId). Nodes are placed by level (y) and
 * index within level (x).
 */

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ok
export function graphToFlow(graph: GraphStructure): {
  nodes: FlowNode[];
  edges: Edge[];
} {
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const startId = graph.startNodeId;

  // BFS to assign each node a level (layer)
  const levelByNodeId = new Map<string, number>();
  const queue: { id: string; level: number }[] = [{ id: startId, level: 0 }];
  levelByNodeId.set(startId, 0);

  while (queue.length > 0) {
    const { id, level } = queue.shift() ?? { id: "", level: 0 };
    const node = nodeById.get(id);
    if (!node) {
      continue;
    }
    for (const opt of node.options) {
      if (!levelByNodeId.has(opt.nodeId)) {
        levelByNodeId.set(opt.nodeId, level + 1);
        queue.push({ id: opt.nodeId, level: level + 1 });
      }
    }
    if (node.fallbackNodeId && !levelByNodeId.has(node.fallbackNodeId)) {
      levelByNodeId.set(node.fallbackNodeId, level + 1);
      queue.push({ id: node.fallbackNodeId, level: level + 1 });
    }
  }

  // Nodes not reached by BFS (e.g. only from fallback) get max level + 1
  let maxLevel = -1;
  for (const n of graph.nodes) {
    const l = levelByNodeId.get(n.id) ?? -1;
    if (l >= 0) {
      maxLevel = Math.max(maxLevel, l);
    }
  }
  for (const n of graph.nodes) {
    if (!levelByNodeId.has(n.id)) {
      levelByNodeId.set(n.id, maxLevel + 1);
    }
  }

  // Group node ids by level
  const byLevel = new Map<number, string[]>();
  for (const n of graph.nodes) {
    const level = levelByNodeId.get(n.id) ?? 0;
    if (!byLevel.has(level)) {
      byLevel.set(level, []);
    }
    const ids = byLevel.get(level);
    if (ids) {
      ids.push(n.id);
    }
  }

  const nodes: FlowNode[] = [];
  const level0Ids = byLevel.get(0) ?? [];
  const startIndex = level0Ids.indexOf(startId);
  const level0Width =
    level0Ids.length * NODE_WIDTH + (level0Ids.length - 1) * HORIZONTAL_GAP;
  const level0StartX = -level0Width / 2 + NODE_WIDTH / 2;
  const storyImageX = level0StartX + startIndex * (NODE_WIDTH + HORIZONTAL_GAP);
  const storyImageY = -(NODE_HEIGHT + VERTICAL_GAP);

  nodes.push({
    id: "story-image",
    type: "storyImage",
    position: { x: storyImageX, y: storyImageY },
    data: { imageUrl: graph.startImageUrl },
  } as Node<StoryImageNodeData>);

  for (const [level, ids] of byLevel.entries()) {
    const levelWidth =
      ids.length * NODE_WIDTH + (ids.length - 1) * HORIZONTAL_GAP;
    const startX = -levelWidth / 2 + NODE_WIDTH / 2;
    ids.forEach((id, i) => {
      const node = nodeById.get(id);
      if (!node) {
        return;
      }
      const x = startX + i * (NODE_WIDTH + HORIZONTAL_GAP);
      const y = level * (NODE_HEIGHT + VERTICAL_GAP);
      nodes.push({
        id: node.id,
        type: "scenario",
        position: { x, y },
        data: {
          ...node,
          isStart: node.id === startId,
        },
      });
    });
  }

  const edgeSet = new Set<string>();
  const edges: Edge[] = [];
  edgeSet.add("story-image-start");
  edges.push({
    id: "story-image-start",
    source: "story-image",
    target: startId,
    type: "default",
  });
  for (const node of graph.nodes) {
    for (let i = 0; i < node.options.length; i++) {
      const opt = node.options[i];
      const edgeId = `${node.id}-${opt.nodeId}-${i}`;
      if (edgeSet.has(edgeId)) {
        continue;
      }
      const isFallback = opt.nodeId === node.fallbackNodeId;
      edgeSet.add(edgeId);
      edges.push({
        id: edgeId,
        source: node.id,
        target: opt.nodeId,
        label: `${truncate(opt.condition)}${isFallback ? " (fallback)" : ""}`,
        type: "default",
      });
    }
  }

  return { nodes, edges };
}
