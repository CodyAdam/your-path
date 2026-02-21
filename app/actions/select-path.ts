"use server";

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getGraph } from "./get-graph";

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
}

const model = google("gemini-3-flash-preview");

export async function selectPath(
  graphId: string,
  nodeId: string,
  userInput: string,
  history: string[]
) {
  const graph = await getGraph(graphId);
  if (!graph) {
    throw new Error("Graph not found");
  }
  const currentNode = graph.nodes.find((node) => node.id === nodeId);
  if (!currentNode) {
    throw new Error("Node not found");
  }

  const optionsText = currentNode.options
    .map(
      (opt, i) =>
        `  ${i + 1}. Condition: "${opt.condition}" → next node: ${opt.nodeId}`
    )
    .join("\n");

  const response = await generateText({
    model,
    system: `You are a path selector for a branching scenario graph. Your job is to choose the next node based on how well the user's response matches each option's condition.

## Scenario
- **Graph:** ${graph.title}
- **Context:** ${graph.prompt}

## Current node
- **ID:** ${currentNode.id}
- **Title:** ${currentNode.title}
- **Script (what was just said in the scenario):** "${currentNode.script}"

## Available branches (pick exactly one)
${optionsText}
${currentNode.fallbackNodeId ? `- **Fallback:** If no condition fits well, use node: ${currentNode.fallbackNodeId}` : ""}

## Conversation so far
${history.length ? history.join("\n") : "(none yet)"}

## Your task
1. Interpret the user's latest response in the context of this scenario and the script that was just said.
2. Match it to the **single best** option by semantic fit (e.g. "clear / confident response" vs "vague response", "polite, normal" vs "rude / disrespectful", "non-alcoholic / asks preferences" vs "orders alcohol casually").
3. Reply with **only** the chosen next node ID (e.g. \`NODE_02_MOTIVATION\` or \`LOSE_RESPECT\`), no explanation, no quotes, no extra text.`,
    messages: [
      {
        role: "user",
        content: userInput,
      },
    ],
    output: Output.object({
      schema: z.object({
        nodeId: z.string().describe("The ID of the next node to visit."),
      }),
    }),
  });
  const outputId = response.output.nodeId;
  const outputOption = currentNode.options.find(
    (option) => option.nodeId === outputId
  );
  const foundNode = graph.nodes.find((node) => node.id === outputId);
  if (!(foundNode && outputOption)) {
    throw new Error("Node not found");
  }
  return {
    newNode: foundNode,
    selectedOption: outputOption,
  };
}
