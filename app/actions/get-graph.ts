"use server";

import { demoGraphs } from "@/lib/demo-graph";

// biome-ignore lint/suspicious/useAwait: need for use server
export async function getGraph(graphId: string) {
  return demoGraphs[graphId] ?? undefined;
}
