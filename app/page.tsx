import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { demoGraphs } from "@/lib/demo-graph";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex h-full flex-1 flex-col items-center justify-center gap-8 border-l px-4 py-16">
        <h2 className="font-semibold text-2xl text-zinc-900 tracking-tight sm:text-3xl dark:text-zinc-50">
          Scenarios
        </h2>
        <div className="flex flex-col items-center justify-center gap-3 px-4">
          {Object.entries(demoGraphs).map(([key, graph]) => (
            <Link className="group" href={`/edit/${key}`} key={key}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {graph.title}
                    <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </CardTitle>
                  <CardDescription>{graph.prompt}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-center gap-4">
                  <Image
                    alt={graph.title}
                    className="aspect-video rounded-lg object-cover"
                    height={300}
                    src={graph.startImageUrl}
                    width={300}
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
