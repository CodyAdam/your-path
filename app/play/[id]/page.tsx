import { notFound } from "next/navigation";
import { getGraph } from "@/app/actions/get-graph";
import { PlayClient } from "./_play-client";
import { WaitForPermissions } from "./_wait-for-permissions";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const graph = await getGraph(id);
  if (!graph) {
    return notFound();
  }
  return (
    <WaitForPermissions>
      <PlayClient graph={graph} id={id} />
    </WaitForPermissions>
  );
}
