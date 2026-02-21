import { ChevronLeft, Play } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GraphFlow } from "@/app/components/GraphFlow";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { demoGraphs } from "@/lib/demo-graph";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const graph = demoGraphs[id];
  if (!graph) {
    return notFound();
  }
  return (
    <div className="flex h-screen w-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex shrink-0 items-center gap-4 border-zinc-200 border-b bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/">
          <Button aria-label="Home" type="button">
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>
        </Link>
        <div className="truncate">
          <h1 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
            {graph.title}
          </h1>
          <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
            {graph.prompt}
          </p>
        </div>
        <Link className="ml-auto" href={`/play/${id}`}>
          <Button aria-label="Play" type="button">
            <Play className="h-5 w-5" />
            Play Scenario
          </Button>
        </Link>
        <CopyButton
          label="Copy Play Link"
          value={`${process.env.BASE_URL}/play/${id}`}
        />
      </header>
      <main className="min-h-0 flex-1">
        <GraphFlow className="h-full w-full" graph={graph} />
      </main>
    </div>
  );
}
