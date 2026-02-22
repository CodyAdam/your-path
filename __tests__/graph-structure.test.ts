import { describe, expect, it } from "vitest";
import { graphStructure, nodeSchema } from "@/lib/graph-structure";

describe("nodeSchema", () => {
  it("validates a valid node with options", () => {
    const validNode = {
      id: "node-1",
      title: "Introduction",
      script: "Welcome to the scenario.",
      options: [
        { condition: "User says yes", nodeId: "node-2" },
        { condition: "User says no", nodeId: "node-3" },
      ],
    };
    const result = nodeSchema.safeParse(validNode);
    expect(result.success).toBe(true);
  });

  it("validates an end node with empty options", () => {
    const endNode = {
      id: "node-end",
      title: "Ending",
      script: "Thanks for watching.",
      options: [],
    };
    const result = nodeSchema.safeParse(endNode);
    expect(result.success).toBe(true);
  });

  it("validates a node with optional fallbackNodeId", () => {
    const nodeWithFallback = {
      id: "node-1",
      title: "Decision Point",
      script: "Choose your path.",
      options: [{ condition: "Go left", nodeId: "node-2" }],
      fallbackNodeId: "node-3",
    };
    const result = nodeSchema.safeParse(nodeWithFallback);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fallbackNodeId).toBe("node-3");
    }
  });

  it("accepts a node without fallbackNodeId", () => {
    const nodeWithoutFallback = {
      id: "node-1",
      title: "Simple Node",
      script: "Just a node.",
      options: [],
    };
    const result = nodeSchema.safeParse(nodeWithoutFallback);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fallbackNodeId).toBeUndefined();
    }
  });

  it("fails when id is missing", () => {
    const invalid = {
      title: "No ID",
      script: "Missing id field.",
      options: [],
    };
    const result = nodeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("fails when title is missing", () => {
    const invalid = {
      id: "node-1",
      script: "Missing title.",
      options: [],
    };
    const result = nodeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("fails when script is missing", () => {
    const invalid = {
      id: "node-1",
      title: "No Script",
      options: [],
    };
    const result = nodeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("fails when options is missing", () => {
    const invalid = {
      id: "node-1",
      title: "No Options",
      script: "Missing options array.",
    };
    const result = nodeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("graphStructure", () => {
  const validGraph = {
    title: "Test Scenario",
    startImageUrl: "https://example.com/image.png",
    prompt: "A test scenario about choices.",
    startNodeId: "node-1",
    nodes: [
      {
        id: "node-1",
        title: "Start",
        script: "Welcome.",
        options: [{ condition: "Continue", nodeId: "node-2" }],
      },
      {
        id: "node-2",
        title: "End",
        script: "Goodbye.",
        options: [],
      },
    ],
  };

  it("validates a complete valid graph", () => {
    const result = graphStructure.safeParse(validGraph);
    expect(result.success).toBe(true);
  });

  it("fails when title is missing", () => {
    const { title, ...rest } = validGraph;
    const result = graphStructure.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("fails when startImageUrl is missing", () => {
    const { startImageUrl, ...rest } = validGraph;
    const result = graphStructure.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("fails when prompt is missing", () => {
    const { prompt, ...rest } = validGraph;
    const result = graphStructure.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("fails when startNodeId is missing", () => {
    const { startNodeId, ...rest } = validGraph;
    const result = graphStructure.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("fails when nodes is missing", () => {
    const { nodes, ...rest } = validGraph;
    const result = graphStructure.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("validates a graph with an empty nodes array", () => {
    const graphWithNoNodes = { ...validGraph, nodes: [] };
    const result = graphStructure.safeParse(graphWithNoNodes);
    expect(result.success).toBe(true);
  });
});
