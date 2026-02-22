import Link from "next/link";
import { SpeechToTextDemo } from "@/components/SpeechToTextDemo";
import { Button } from "@/components/ui/button";
import { demoGraphs } from "@/lib/demo-graph";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex h-full w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="text-center">
          <h1 className="font-semibold text-2xl text-zinc-900 tracking-tight sm:text-3xl dark:text-zinc-50">
            Speech to text
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Record audio and get a transcription using ElevenLabs Scribe v2.
          </p>
        </div>
        <SpeechToTextDemo />
      </main>
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-8 border-l px-4 py-16">
        <h2 className="font-semibold text-2xl text-zinc-900 tracking-tight sm:text-3xl dark:text-zinc-50">
          Scenarios
        </h2>
        <div className="flex flex-col items-center justify-center gap-3 px-4">
          {Object.entries(demoGraphs).map(([key, graph]) => (
            <Link href={`/edit/${key}`} key={key}>
              <Button>{graph.title}</Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
