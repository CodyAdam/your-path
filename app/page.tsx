import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PromptInputProvider } from "@/components/ai-elements/prompt-input";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoGraphs } from "@/lib/demo-graph";
import { CreateStory } from "./_create-new";

export default function Home() {
  return (
    <PromptInputProvider>
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex h-full flex-1 flex-col items-center justify-center gap-8 border-l px-4 py-24">
          <h1 className="my-12 max-w-2xl text-center font-sans font-semibold text-4xl text-zinc-900 tracking-tight sm:text-5xl dark:text-zinc-50">
            Build your own AI generated interactive stories
          </h1>
          <CreateStory />
          <h2 className="mt-40 font-semibold text-2xl text-zinc-900 tracking-tight sm:text-3xl dark:text-zinc-50">
            Play already created Stories
          </h2>
          <div className="flex flex-wrap justify-center gap-4 px-4">
            {Object.entries(demoGraphs).map(([key, graph]) => (
              <Link className="group" href={`/edit/${key}`} key={key}>
                <div className="flex flex-col gap-2 rounded-3xl border bg-card p-3 text-card-foreground">
                  <CardHeader className="p-3">
                    <CardTitle className="flex items-center gap-2">
                      {graph.title}
                      <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </CardTitle>
                    <CardDescription>{graph.prompt}</CardDescription>
                  </CardHeader>
                  <Image
                    alt={graph.title}
                    className="aspect-video rounded-xl object-cover"
                    height={300}
                    src={graph.startImageUrl}
                    width={300}
                  />
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </PromptInputProvider>
  );
}
