import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateImage } from "../app/actions/_processing/image-generation";
import { generateVideoFromImage } from "../app/actions/_processing/video-generation";
import dating from "../app/data/scenarios/dating.json";
import videoPrompts from "../app/data/scenarios/dating-video-prompts.json";

const VIDEOS_DIR = join(import.meta.dir, "..", "public", "videos", "dating");
const IMAGES_DIR = join(import.meta.dir, "..", "public", "images");
const CHARACTERS_DIR = join(IMAGES_DIR, "characters");
const KEYFRAMES_DIR = join(IMAGES_DIR, "keyframes", "dating");

async function downloadAndSave(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download: ${response.status} ${response.statusText}`
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker())
  );
  return results;
}

async function main() {
  const startTime = Date.now();
  console.log(
    "=== Retry: lose-alcohol keyframe + all terminal node videos (no endframe) ===\n"
  );

  // Load character image
  const characterPath = join(CHARACTERS_DIR, "dating-character.png");
  const characterBuffer = await readFile(characterPath);
  const characterDataUri = `data:image/png;base64,${characterBuffer.toString("base64")}`;

  // ── Step 1: Regenerate lose-alcohol keyframe ──
  console.log("Step 1: Regenerating lose-alcohol keyframe...");
  const rawPrompt = videoPrompts.nodes["lose-alcohol"] ?? "";
  const imagePrompt = rawPrompt.replace(/She says:\s*'[^']*'/g, "").trim();
  const prompt = `${dating.prompt}. ${imagePrompt} Photorealistic still photograph. Absolutely no text, no subtitles, no words, no letters, no captions, no writing anywhere on screen.`;

  const kfResult = await generateImage({
    prompt,
    referenceImages: [characterDataUri],
    aspectRatio: "16:9",
    outputFormat: "png",
  });

  await downloadAndSave(
    kfResult.imageUrl,
    join(KEYFRAMES_DIR, "lose-alcohol-keyframe.png")
  );
  console.log(
    `  ✅ lose-alcohol keyframe regenerated (${((Date.now() - startTime) / 1000).toFixed(1)}s)\n`
  );

  // ── Step 2: Regenerate all 6 terminal node videos WITHOUT endframe ──
  const terminalNodes = dating.nodes.filter((n) => n.options.length === 0);
  console.log(
    `Step 2: Regenerating ${terminalNodes.length} terminal node videos (no endframe, 5 concurrent)...\n`
  );

  let done = 0;
  const failed: string[] = [];

  const tasks = terminalNodes.map((node) => async () => {
    const nodeStart = Date.now();
    try {
      // Load keyframe from disk
      const kfPath = join(KEYFRAMES_DIR, `${node.id}-keyframe.png`);
      const kfBuf = await readFile(kfPath);
      const kfDataUri = `data:image/png;base64,${kfBuf.toString("base64")}`;

      const nodeVideoPrompt =
        videoPrompts.nodes[node.id as keyof typeof videoPrompts.nodes] ??
        "Young woman at café table. No text, no subtitles, no words on screen.";

      const result = await generateVideoFromImage({
        imageUrl: kfDataUri,
        prompt: `${dating.prompt}. ${nodeVideoPrompt}`,
        duration: 12,
      });

      await downloadAndSave(
        result.videoUrl,
        join(VIDEOS_DIR, `${node.id}-main.mp4`)
      );
      done++;
      console.log(
        `  ✅ [${done}/${terminalNodes.length}] "${node.title}" — ${((Date.now() - nodeStart) / 1000).toFixed(1)}s`
      );
    } catch (err) {
      done++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `  ❌ [${done}/${terminalNodes.length}] "${node.title}" — ${msg}`
      );
      failed.push(node.title);
    }
  });

  await runWithConcurrency(tasks, 5);

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== Complete (${totalTime} min) ===`);
  console.log(
    `  Videos: ${done - failed.length}/${terminalNodes.length} terminal nodes`
  );
  if (failed.length > 0) {
    console.log(`  Failed: ${failed.join(", ")}`);
  }
}

main().catch(console.error);
