import { ArrowRight, LucideSplit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { PromptInputProvider } from "@/components/ai-elements/prompt-input";
import LogoLoop, { type LogoItem } from "@/components/LogoLoop";
import PrismaticBurst from "@/components/PrismaticBurst";
import { RiGithubFill } from "@/components/RiGithubFill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { demoGraphs } from "@/lib/demo-graph";
import type { GraphStructure } from "@/lib/graph-structure";
import { listStories } from "@/lib/redis";
import { CreateStory } from "./_create-new";

// Alternative with image sources
const imageLogos: LogoItem[] = [
  {
    src: "https://api.iconify.design/logos:google-gemini.svg",
    alt: "Google Gemini",
    href: "https://gemini.google.com",
  },
  {
    src: "https://11labs-nonprd-15f22c1d.s3.eu-west-3.amazonaws.com/0b9cd3e1-9fad-4a5b-b3a0-c96b0a1f1d2b/elevenlabs-logo-black.svg",
    alt: "ElevenLabs",
    href: "https://elevenlabs.io",
  },
  {
    src: "https://api.iconify.design/logos:stripe.svg",
    alt: "Stripe",
    href: "https://stripe.com",
  },
  {
    src: "/images/hackeuropelogo.svg",
    alt: "hackeurope",
    href: "https://hackeurope.com",
  },
  {
    src: "https://api.iconify.design/logos:vercel.svg",
    alt: "Vercel",
    href: "https://vercel.com",
  },
  {
    src: "https://api.iconify.design/devicon:kaggle-wordmark.svg",
    alt: "Kaggle",
    href: "https://kaggle.com",
  },
  {
    src: "https://brand.umich.edu/assets/brand/style-guide/logo-guidelines/U-M_Logo-Horizontal-Hex.png",
    alt: "University of Michigan",
    href: "https://umich.edu/",
  },
];

export default function Home() {
  return (
    <PromptInputProvider>
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="pointer-events-none absolute top-0 left-0 h-screen w-full">
          <PrismaticBurst
            animationType="rotate3d"
            colors={["#ff007a", "#4d3dff", "#ffffff"]}
            distort={0}
            hoverDampness={0.25}
            intensity={2}
            mixBlendMode="lighten"
            offset={{ x: 0, y: 0 }}
            paused={false}
            rayCount={0}
            speed={0.5}
          />
        </div>
        <main className="flex h-full flex-1 flex-col items-center justify-center gap-8 border-l px-4 py-24">
          <div className="my-12 flex flex-col items-center justify-center gap-4">
            <Badge>Submission for Hackeurope 2026</Badge>
            <h1 className="max-w-2xl text-center font-sans font-semibold text-4xl text-zinc-900 tracking-tight sm:text-5xl dark:text-zinc-50">
              Build your own AI generated interactive stories
            </h1>
          </div>
          <CreateStory />
          <LogoLoop
            ariaLabel="Technology partners"
            className="mt-12 w-full max-w-3xl"
            direction="left"
            fadeOut
            fadeOutColor="#FAFAFA"
            gap={60}
            hoverSpeed={0}
            logoHeight={20}
            logos={imageLogos}
            scaleOnHover
            speed={60}
          />
          <h2 className="mt-40 font-semibold text-2xl text-zinc-900 tracking-tight sm:text-3xl dark:text-zinc-50">
            Try previously created stories
          </h2>
          <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(demoGraphs).map(([key, graph]) => (
              <StoryItem graph={graph} key={key} />
            ))}
            <Suspense
              fallback={
                <>
                  <Skeleton className="h-full min-h-80 w-[326px] rounded-3xl" />
                  <Skeleton className="h-full min-h-80 w-[326px] rounded-3xl" />
                  <Skeleton className="h-full min-h-80 w-[326px] rounded-3xl" />
                  <Skeleton className="h-full min-h-80 w-[326px] rounded-3xl" />
                </>
              }
            >
              <AsyncStoryList />
            </Suspense>
          </div>
          <footer className="mt-20 flex items-center gap-2">
            <Link href="https://github.com/CodyAdam/your-path">
              <Button variant="link">
                <RiGithubFill className="size-5" />
                GitHub
              </Button>
            </Link>
            <Link href="https://codya.dev">
              <Button variant="link">Cody Adam</Button>
            </Link>
            <Link href="https://www.linkedin.com/in/yongkang-zou/">
              <Button variant="link">Yongkang Zou</Button>
            </Link>
            <Link href="https://www.linkedin.com/in/mayy-miled/">
              <Button variant="link">Mayy Miled</Button>
            </Link>
            <Link href="https://www.linkedin.com/in/math%C3%A9o-quatreboeufs-30353225b/">
              <Button variant="link">Mathéo Quatreboeufs</Button>
            </Link>
          </footer>
        </main>
      </div>
    </PromptInputProvider>
  );
}

async function AsyncStoryList() {
  const stories = await listStories();
  return (
    <>
      {stories.map((story) => (
        <StoryItem graph={story} key={story.id} />
      ))}
    </>
  );
}

function StoryItem({ graph }: { graph: GraphStructure }) {
  return (
    <Link className="group h-full" href={`/edit/${graph.id}`}>
      <div className="flex h-full flex-col gap-2 rounded-3xl border bg-card p-3 text-card-foreground">
        <CardHeader className="p-3">
          <CardTitle className="flex items-center gap-2">
            {graph.title}
            <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
          </CardTitle>
          <CardDescription>{graph.prompt}</CardDescription>
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
            <LucideSplit className="size-4" />
            {graph.nodes.length} path{graph.nodes.length !== 1 ? "s" : ""}
          </div>
        </CardHeader>
        {graph.startImageUrl ? (
          <Image
            alt={graph.title}
            className="mt-auto aspect-video rounded-xl object-cover"
            height={300}
            src={graph.startImageUrl}
            width={300}
          />
        ) : (
          <Skeleton className="mt-auto aspect-video rounded-xl" />
        )}
      </div>
    </Link>
  );
}
