import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateImage } from "../app/actions/_processing/image-generation";
import { generateVideoFromImage } from "../app/actions/_processing/video-generation";
import dating from "../app/data/scenarios/dating.json";
import videoPrompts from "../app/data/scenarios/dating-video-prompts.json";

const VIDEOS_DIR = join(import.meta.dir, "..", "public", "videos", "dating");
const IMAGES_DIR = join(import.meta.dir, "..", "public", "images");
const CHARACTERS_DIR = join(IMAGES_DIR, "characters");
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
  console.log("=== Dating Video Generation Pipeline ===\n");

  await mkdir(CHARACTERS_DIR, { recursive: true });
  await mkdir(KEYFRAMES_DIR, { recursive: true });
  await mkdir(LASTFRAMES_DIR, { recursive: true });
  await mkdir(VIDEOS_DIR, { recursive: true });

  // ── Step 1: Generate character reference image ──
  console.log("Step 1: Generating character reference image...");
  const characterResult = await generateImage({
    prompt: `${dating.prompt}. Portrait of the young woman character, facing the camera, calm with a slight ironic smile, warm café lighting.`,
    aspectRatio: "16:9",
    outputFormat: "png",
  });

  const characterPath = join(CHARACTERS_DIR, "dating-character.png");
  await downloadAndSave(characterResult.imageUrl, characterPath);
  const characterUrl = characterResult.imageUrl;
  console.log(
    `  ✅ Character saved (${((Date.now() - startTime) / 1000).toFixed(1)}s)\n`
  );

  // ── Step 2: Generate keyframe images (5 concurrent) ──
  console.log(
    `Step 2: Generating ${dating.nodes.length} keyframe images (5 concurrent)...\n`
  );

  const keyframeUrls: Record<string, string> = {};
  let kfDone = 0;

  const keyframeTasks = dating.nodes.map((node) => async () => {
    const rawPrompt =
      videoPrompts.nodes[node.id as keyof typeof videoPrompts.nodes] ??
      "Young woman at café table.";
    // Strip dialogue from prompt for still images (remove "She says: '...'" parts)
    const imagePrompt = rawPrompt.replace(/She says:\s*'[^']*'/g, "").trim();
    const prompt = `${dating.prompt}. ${imagePrompt} Photorealistic still photograph. Absolutely no text, no subtitles, no words, no letters, no captions, no writing anywhere on screen.`;

    try {
      const result = await generateImage({
        prompt,
        referenceImages: [characterUrl],
        aspectRatio: "16:9",
        outputFormat: "png",
      });

      const fileName = `${node.id}-keyframe.png`;
      await downloadAndSave(result.imageUrl, join(KEYFRAMES_DIR, fileName));
      keyframeUrls[node.id] = result.imageUrl;
      kfDone++;
      console.log(
        `  ✅ [${kfDone}/${dating.nodes.length}] "${node.title}" keyframe`
      );
    } catch (err) {
      keyframeUrls[node.id] = characterUrl;
      kfDone++;
      console.error(
        `  ⚠️ [${kfDone}/${dating.nodes.length}] "${node.title}" keyframe failed, using character image`
      );
    }
  });

  await runWithConcurrency(keyframeTasks, 5);
  console.log(
    `\n  Keyframes done (${((Date.now() - startTime) / 1000 / 60).toFixed(1)} min)\n`
  );

  // ── Step 3: Generate node-01 main video first, then idle from its last frame ──
  const node01 = dating.nodes.find((n) => n.id === "node-01")!;
  const node01Keyframe = keyframeUrls["node-01"] ?? characterUrl;
  const node01Prompt =
    videoPrompts.nodes["node-01" as keyof typeof videoPrompts.nodes] ??
    "Young woman at café table. No text, no subtitles, no words on screen.";

  console.log(
    "Step 3: Generating node-01 main video → extract last frame → shared idle video..."
  );

  const node01Start = Date.now();
  const node01Result = await generateVideoFromImage({
    imageUrl: node01Keyframe,
    prompt: `${dating.prompt}. ${node01Prompt}`,
    duration: 12,
  });

  const node01MainPath = join(VIDEOS_DIR, "node-01-main.mp4");
  await downloadAndSave(node01Result.videoUrl, node01MainPath);
  console.log(
    `  ✅ node-01 main video (${((Date.now() - node01Start) / 1000).toFixed(1)}s)`
  );

  // Extract last frame from node-01
  const lastFramePath = join(LASTFRAMES_DIR, "node-01-lastframe.jpg");
  extractLastFrame(node01MainPath, lastFramePath);
  console.log("  ✅ Extracted last frame from node-01");

  // Generate shared idle from node-01's last frame
  const lastFrameBuffer = await readFile(lastFramePath);
  const base64 = lastFrameBuffer.toString("base64");
  const lastFrameDataUri = `data:image/jpeg;base64,${base64}`;

  const idleStart = Date.now();
  const idleResult = await generateVideoFromImage({
    imageUrl: lastFrameDataUri,
    prompt: videoPrompts.idlePrompt,
    duration: 12,
  });

  const idlePath = join(VIDEOS_DIR, "idle.mp4");
  await downloadAndSave(idleResult.videoUrl, idlePath);
  console.log(
    `  ✅ Shared idle video from node-01 last frame (${((Date.now() - idleStart) / 1000).toFixed(1)}s)\n`
  );

  // ── Step 4: Generate remaining 18 main videos (5 concurrent) ──
  const remainingNodes = dating.nodes.filter((n) => n.id !== "node-01");
  const totalRemaining = remainingNodes.length;
  let nodesDone = 0;
  const failed: string[] = [];

  const perNodeTasks = remainingNodes.map((node) => async () => {
    const keyframeUrl = keyframeUrls[node.id] ?? characterUrl;
    const nodeStart = Date.now();

    try {
      const nodeVideoPrompt =
        videoPrompts.nodes[node.id as keyof typeof videoPrompts.nodes] ??
        "Young woman at café table. No text, no subtitles, no words on screen.";

      const isTerminal = node.options.length === 0;
      const mainResult = await generateVideoFromImage({
        imageUrl: keyframeUrl,
        endImageUrl: isTerminal ? undefined : lastFrameDataUri,
        prompt: `${dating.prompt}. ${nodeVideoPrompt}`,
        duration: 12,
      });

      const mainFileName = `${node.id}-main.mp4`;
      const mainPath = join(VIDEOS_DIR, mainFileName);
      await downloadAndSave(mainResult.videoUrl, mainPath);

      nodesDone++;
      const mainElapsed = ((Date.now() - nodeStart) / 1000).toFixed(1);
      console.log(
        `  ✅ [${nodesDone}/${totalRemaining}] "${node.title}" main — ${mainElapsed}s`
      );
    } catch (err) {
      nodesDone++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `  ❌ [${nodesDone}/${totalRemaining}] "${node.title}" — ${msg}`
      );
      failed.push(node.title);
    }
  });

  console.log(
    `Step 4: Generating ${totalRemaining} remaining main videos (5 concurrent, 12s each)...\n`
  );

  await runWithConcurrency(perNodeTasks, 5);

  const totalSucceeded = nodesDone - failed.length + 1; // +1 for node-01
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== Complete (${totalTime} min) ===`);
  console.log(`  Images: 1 character + ${dating.nodes.length} keyframes`);
  console.log(
    `  Videos: 1 shared idle + ${totalSucceeded}/${dating.nodes.length} main videos`
  );
  if (failed.length > 0) {
    console.log(`  Failed: ${failed.join(", ")}`);
  }
}

main().catch(console.error);
