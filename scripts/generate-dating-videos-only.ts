import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateVideoFromImage } from "../app/actions/_processing/video-generation";
import dating from "../app/data/scenarios/dating.json";
import videoPrompts from "../app/data/scenarios/dating-video-prompts.json";

const VIDEOS_DIR = join(import.meta.dir, "..", "public", "videos", "dating");
const IMAGES_DIR = join(import.meta.dir, "..", "public", "images");
const KEYFRAMES_DIR = join(IMAGES_DIR, "keyframes", "dating");
const LASTFRAMES_DIR = join(IMAGES_DIR, "lastframes", "dating");

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

function extractLastFrame(videoPath: string, outputPath: string): void {
  execSync(
    `ffmpeg -y -sseof -0.1 -i "${videoPath}" -frames:v 1 -q:v 2 "${outputPath}"`,
    { stdio: "pipe" }
  );
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
    "=== Dating Video Generation (videos only, keyframes already done) ===\n"
  );

  await mkdir(LASTFRAMES_DIR, { recursive: true });
  await mkdir(VIDEOS_DIR, { recursive: true });

  // Load keyframe URLs from disk as data URIs
  const keyframeDataUris: Record<string, string> = {};
  for (const node of dating.nodes) {
    const kfPath = join(KEYFRAMES_DIR, `${node.id}-keyframe.png`);
    try {
      const buf = await readFile(kfPath);
      keyframeDataUris[node.id] =
        `data:image/png;base64,${buf.toString("base64")}`;
    } catch {
      console.warn(`  ⚠️ No keyframe for ${node.id}, will use node-01's`);
    }
  }
  const fallbackUri = keyframeDataUris["node-01"];

  // ── Step 1: Generate node-01 main video → extract last frame → shared idle ──
  console.log("Step 1: node-01 main → last frame → shared idle...");

  const node01Start = Date.now();
  const node01Prompt =
    videoPrompts.nodes["node-01" as keyof typeof videoPrompts.nodes] ??
    "Young woman at café table. No text, no subtitles, no words on screen.";

  const node01Result = await generateVideoFromImage({
    imageUrl: keyframeDataUris["node-01"] ?? fallbackUri,
    prompt: `${dating.prompt}. ${node01Prompt}`,
    duration: 12,
  });

  const node01MainPath = join(VIDEOS_DIR, "node-01-main.mp4");
  await downloadAndSave(node01Result.videoUrl, node01MainPath);
  console.log(
    `  ✅ node-01 main (${((Date.now() - node01Start) / 1000).toFixed(1)}s)`
  );

  // Extract last frame
  const lastFramePath = join(LASTFRAMES_DIR, "node-01-lastframe.jpg");
  extractLastFrame(node01MainPath, lastFramePath);
  console.log("  ✅ Extracted last frame");

  // Shared idle from last frame
  const lastFrameBuffer = await readFile(lastFramePath);
  const lastFrameDataUri = `data:image/jpeg;base64,${lastFrameBuffer.toString("base64")}`;

  const idleStart = Date.now();
  const idleResult = await generateVideoFromImage({
    imageUrl: lastFrameDataUri,
    prompt: videoPrompts.idlePrompt,
    duration: 12,
  });

  await downloadAndSave(idleResult.videoUrl, join(VIDEOS_DIR, "idle.mp4"));
  console.log(
    `  ✅ Shared idle (${((Date.now() - idleStart) / 1000).toFixed(1)}s)\n`
  );

  // ── Step 2: Generate remaining 18 main videos (5 concurrent) ──
  const remainingNodes = dating.nodes.filter((n) => n.id !== "node-01");
  let done = 0;
  const failed: string[] = [];

  const tasks = remainingNodes.map((node) => async () => {
    const nodeStart = Date.now();
    try {
      const nodePrompt =
        videoPrompts.nodes[node.id as keyof typeof videoPrompts.nodes] ??
        "Young woman at café table. No text, no subtitles, no words on screen.";

      const isTerminal = node.options.length === 0;
      const result = await generateVideoFromImage({
        imageUrl: keyframeDataUris[node.id] ?? fallbackUri,
        endImageUrl: isTerminal ? undefined : lastFrameDataUri,
        prompt: `${dating.prompt}. ${nodePrompt}`,
        duration: 12,
      });

      await downloadAndSave(
        result.videoUrl,
        join(VIDEOS_DIR, `${node.id}-main.mp4`)
      );
      done++;
      console.log(
        `  ✅ [${done}/${remainingNodes.length}] "${node.title}" — ${((Date.now() - nodeStart) / 1000).toFixed(1)}s`
      );
    } catch (err) {
      done++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `  ❌ [${done}/${remainingNodes.length}] "${node.title}" — ${msg}`
      );
      failed.push(node.title);
    }
  });

  console.log(
    `Step 2: Generating ${remainingNodes.length} main videos (5 concurrent, 12s each)...\n`
  );
  await runWithConcurrency(tasks, 5);

  const totalSucceeded = done - failed.length + 1;
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== Complete (${totalTime} min) ===`);
  console.log(
    `  Videos: 1 idle + ${totalSucceeded}/${dating.nodes.length} main`
  );
  if (failed.length > 0) {
    console.log(`  Failed: ${failed.join(", ")}`);
  }
}

main().catch(console.error);
