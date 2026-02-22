"use server";

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { graphStructure } from "@/lib/graph-structure";
import {
  getStoryCredits,
  incrementStoryCredits,
  setStoryData,
} from "@/lib/redis";

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
}

const model = google("gemini-3-flash-preview");

const STORY_CREDITS_COST = 1;

export type GenerateGraphResult = { success: true } | { error: string };

export async function generateGraph(
  storyId: string,
  prompt: string
): Promise<GenerateGraphResult> {
  const credits = await getStoryCredits(storyId);
  if (credits < STORY_CREDITS_COST) {
    return { error: "Not enough credits. Purchase more to generate a story." };
  }

  await incrementStoryCredits(storyId, -STORY_CREDITS_COST);

  try {
    const { output } = await generateText({
      model,
      system: `You generate branching scenario graphs for interactive video stories. Given a user's story idea (prompt), output a single JSON object that matches the required schema.

Rules:
- id: use a short kebab slug (e.g. "coffee-date"). It will be overwritten by the app.
- title: a short, clear title for the scenario.
- prompt: copy the user's story prompt exactly; it will be overwritten by the app.
- startNodeId: must be the id of the first node the user will see (e.g. the first node in the nodes array).
- nodes: array of scenario nodes. Each node has:
  - id: unique string (e.g. "node-01", "welcome", "bad-ending").
  - title: short label for this step.
  - script: what the character says or what happens in this segment; can include dialogue in quotes.
  - options: array of { condition: string, nodeId: string }. condition describes when this branch is chosen (e.g. "User agrees politely"); nodeId is the id of the next node.
  - fallbackNodeId (optional): next node id when no option matches well.
- Ensure every nodeId in options and fallbackNodeId refers to an existing node id in the graph.
- Create a coherent branching story: at least one start node, several branches, and some end nodes (nodes with no options or only pointing to end states).
- Keep the graph small enough to be manageable: roughly 5–15 nodes.`,
      prompt: `Generate a branching scenario graph for this story idea:\n\n${prompt.trim()}`,
      output: Output.object({
        schema: graphStructure,
      }),
    });

    const graph = graphStructure.parse(output);
    await setStoryData(storyId, {
      ...graph,
      id: storyId,
      prompt: prompt.trim(),
      startNodeId: (graph.startNodeId || graph.nodes[0]?.id) ?? "start",
    });

    return { success: true };
  } catch (err) {
    await incrementStoryCredits(storyId, STORY_CREDITS_COST);
    const message =
      err instanceof Error ? err.message : "Story generation failed.";
    return { error: message };
  }
}
