"use server";

import { demoGraphs } from "@/lib/demo-graph";
import { getStoryData } from "@/lib/redis";

export async function getGraph(graphId: string) {
  return demoGraphs[graphId] ?? (await getStoryData(graphId));
}
