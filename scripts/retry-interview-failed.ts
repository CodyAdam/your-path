import { generateImage } from "../app/actions/_processing/image-generation";
import { generateVideoFromImage } from "../app/actions/_processing/video-generation";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { execSync, execFileSync } from "node:child_process";
import interview from "../app/data/scenarios/interview.json";

const VIDEOS_DIR = join(import.meta.dir, "..", "public", "videos");
const IMAGES_DIR = join(import.meta.dir, "..", "public", "images");
const CHARACTERS_DIR = join(IMAGES_DIR, "characters");
const KEYFRAMES_DIR = join(IMAGES_DIR, "keyframes", "interview");
const LASTFRAMES_DIR = join(IMAGES_DIR, "lastframes", "interview");

async function downloadAndSave(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
}

function extractLastFrame(videoPath: string, outputPath: string): void {
  execSync(
    `ffmpeg -y -sseof -0.1 -i "${videoPath}" -frames:v 1 -q:v 2 "${outputPath}"`,
    { stdio: "pipe" },
  );
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
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
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  );
  return results;
}

// ── Detect what's missing ──

function fileExists(path: string): boolean {
  try {
    execFileSync("test", ["-f", path]);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const startTime = Date.now();
  console.log("=== Retry Failed Interview Items ===\n");

  await mkdir(KEYFRAMES_DIR, { recursive: true });
  await mkdir(LASTFRAMES_DIR, { recursive: true });
  await mkdir(VIDEOS_DIR, { recursive: true });

  // Load character image URL — re-read from disk
  const characterPath = join(CHARACTERS_DIR, "interview-character.jpg");
  const characterBuffer = await readFile(characterPath);
  const characterBase64 = characterBuffer.toString("base64");
  const characterDataUri = `data:image/jpeg;base64,${characterBase64}`;

  // ── Step 1: Find missing keyframes ──
  const missingKeyframes = interview.nodes.filter((node) => {
    const path = join(KEYFRAMES_DIR, `${node.id}-keyframe.jpg`);
    return !fileExists(path);
  });

  if (missingKeyframes.length > 0) {
    console.log(`Step 1: Regenerating ${missingKeyframes.length} missing keyframes...\n`);

    const keyframeTasks = missingKeyframes.map((node) => async () => {
      const isTerminal = node.options.length === 0;
      const mood = isTerminal
        ? node.title.toLowerCase().includes("success") ||
          node.title.toLowerCase().includes("closing")
          ? "warm smile, positive energy"
          : "polite but distant expression, closing the conversation"
        : "engaged, attentive, professional expression";

      const prompt = `${interview.prompt}. ${mood}. No text, no subtitles, no words on screen.`;

      try {
        const result = await generateImage({
          prompt,
          referenceImages: [characterDataUri],
          aspectRatio: "16:9",
          outputFormat: "jpg",
        });

        const fileName = `${node.id}-keyframe.jpg`;
        await downloadAndSave(result.imageUrl, join(KEYFRAMES_DIR, fileName));
        console.log(`  ✅ "${node.title}" keyframe regenerated`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ "${node.title}" keyframe failed again: ${msg}`);
      }
    });

    await runWithConcurrency(keyframeTasks, 5);
    console.log();
  } else {
    console.log("Step 1: All keyframes present, skipping.\n");
  }

  // ── Step 2: Find missing idle videos ──
  const nonTerminalNodes = interview.nodes.filter((n) => n.options.length > 0);
  const missingIdle = nonTerminalNodes.filter((node) => {
    const path = join(VIDEOS_DIR, `node-${node.id}-idle.mp4`);
    return !fileExists(path);
  });

  if (missingIdle.length === 0) {
    console.log("Step 2: All idle videos present, nothing to retry.\n");
    return;
  }

  console.log(
    `Step 2: Generating ${missingIdle.length} missing idle videos (5 concurrent)...\n`,
  );

  const idleBasePrompt = `The character sits quietly, listening attentively. Mouth closed, lips together, not speaking. She does not talk. Subtle natural movements — blinking, slight breathing, gentle head tilt. Waiting for a response. No talking, no lip movement, no mouth movement. No text, no subtitles, no words on screen.`;

  let done = 0;
  const failed: string[] = [];

  const idleTasks = missingIdle.map((node) => async () => {
    const mainVideoPath = join(VIDEOS_DIR, `node-${node.id}-main.mp4`);
    const lastFramePath = join(LASTFRAMES_DIR, `${node.id}-lastframe.jpg`);

    try {
      // Extract last frame from main video
      extractLastFrame(mainVideoPath, lastFramePath);

      // Convert to base64 data URI for Replicate
      const lastFrameBuffer = await readFile(lastFramePath);
      const base64 = lastFrameBuffer.toString("base64");
      const lastFrameDataUri = `data:image/jpeg;base64,${base64}`;

      const idleStart = Date.now();
      const idleResult = await generateVideoFromImage({
        imageUrl: lastFrameDataUri,
        prompt: idleBasePrompt,
        duration: 12,
        cameraFixed: true,
      });

      const idleFileName = `node-${node.id}-idle.mp4`;
      await downloadAndSave(idleResult.videoUrl, join(VIDEOS_DIR, idleFileName));

      done++;
      const elapsed = ((Date.now() - idleStart) / 1000).toFixed(1);
      console.log(
        `  ✅ [${done}/${missingIdle.length}] "${node.title}" idle — ${elapsed}s`,
      );
    } catch (err) {
      done++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `  ❌ [${done}/${missingIdle.length}] "${node.title}" idle failed: ${msg}`,
      );
      failed.push(node.title);
    }
  });

  await runWithConcurrency(idleTasks, 5);

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== Retry Complete (${totalTime} min) ===`);
  console.log(`  Idle videos: ${done - failed.length}/${missingIdle.length} succeeded`);
  if (failed.length > 0) {
    console.log(`  Still failed: ${failed.join(", ")}`);
  }
}

main().catch(console.error);
