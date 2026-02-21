import { notFound } from "next/navigation";
import { demoGraphs } from "@/lib/demo-graph";
import { PlayClient } from "./_play-client";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const graph = demoGraphs[id];
  if (!graph) {
    return notFound();
  }
  return <PlayClient graph={graph} id={id} />;
}
