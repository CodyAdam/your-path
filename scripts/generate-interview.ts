import { generateImage } from "../app/actions/_processing/image-generation";
import { generateVideoFromImage } from "../app/actions/_processing/video-generation";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "node:child_process";
import interview from "../app/data/scenarios/interview.json";
import videoPrompts from "../app/data/scenarios/interview-video-prompts.json";

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
  // Use ffmpeg to grab the last frame
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

async function main() {
  const startTime = Date.now();
  console.log("=== Interview Video Generation Pipeline ===\n");

  await mkdir(CHARACTERS_DIR, { recursive: true });
  await mkdir(KEYFRAMES_DIR, { recursive: true });
  await mkdir(LASTFRAMES_DIR, { recursive: true });
  await mkdir(VIDEOS_DIR, { recursive: true });

  // ── Step 1: Generate character reference image ──
  console.log("Step 1: Generating character reference image...");
  const characterResult = await generateImage({
    prompt: `${interview.prompt}. Portrait of the interviewer character, facing the camera, professional and approachable expression.`,
    aspectRatio: "16:9",
    outputFormat: "jpg",
  });

  const characterPath = join(CHARACTERS_DIR, "interview-character.jpg");
  await downloadAndSave(characterResult.imageUrl, characterPath);
  const characterUrl = characterResult.imageUrl;
  console.log(`  ✅ Character saved (${((Date.now() - startTime) / 1000).toFixed(1)}s)\n`);

  // ── Step 2: Generate per-node keyframe images (parallel) ──
  console.log(
    `Step 2: Generating ${interview.nodes.length} keyframe images (5 concurrent)...\n`,
  );

  const keyframeUrls: Record<string, string> = {};
  let kfDone = 0;

  const keyframeTasks = interview.nodes.map((node) => async () => {
    const nodePrompt = videoPrompts.nodes[node.id as keyof typeof videoPrompts.nodes];
    const prompt = `${interview.prompt}. ${nodePrompt ?? "Professional interviewer at desk. No text, no subtitles, no words on screen."}`;

    try {
      const result = await generateImage({
        prompt,
        referenceImages: [characterUrl],
        aspectRatio: "16:9",
        outputFormat: "jpg",
      });

      const fileName = `${node.id}-keyframe.jpg`;
      await downloadAndSave(result.imageUrl, join(KEYFRAMES_DIR, fileName));
      keyframeUrls[node.id] = result.imageUrl;
      kfDone++;
      console.log(
        `  ✅ [${kfDone}/${interview.nodes.length}] "${node.title}" keyframe`,
      );
    } catch (err) {
      keyframeUrls[node.id] = characterUrl;
      kfDone++;
      console.error(
        `  ⚠️ [${kfDone}/${interview.nodes.length}] "${node.title}" keyframe failed, using character image`,
      );
    }
  });

  await runWithConcurrency(keyframeTasks, 5);
  console.log(
    `\n  Keyframes done (${((Date.now() - startTime) / 1000 / 60).toFixed(1)} min)\n`,
  );

  // ── Step 3: Generate videos per node (parallel across nodes, sequential within node) ──
  // For each node:
  //   1. Generate main video from keyframe
  //   2. Extract last frame of main video
  //   3. Generate idle video from that last frame (smooth transition)
  // This is sequential WITHIN a node but parallel ACROSS nodes.

  const idleBasePrompt = videoPrompts.idlePrompt;

  const totalNodes = interview.nodes.length;
  let nodesDone = 0;
  const failed: string[] = [];

  const perNodeTasks = interview.nodes.map((node) => async () => {
    const isTerminal = node.options.length === 0;
    const keyframeUrl = keyframeUrls[node.id] ?? characterUrl;
    const nodeStart = Date.now();

    // 3a. Generate main video from keyframe
    try {
      const nodeVideoPrompt = videoPrompts.nodes[node.id as keyof typeof videoPrompts.nodes]
        ?? "Professional interviewer at desk. No text, no subtitles, no words on screen.";

      const mainResult = await generateVideoFromImage({
        imageUrl: keyframeUrl,
        prompt: `${interview.prompt}. ${nodeVideoPrompt}`,
        duration: 5,
      });

      const mainFileName = `node-${node.id}-main.mp4`;
      const mainPath = join(VIDEOS_DIR, mainFileName);
      await downloadAndSave(mainResult.videoUrl, mainPath);

      const mainElapsed = ((Date.now() - nodeStart) / 1000).toFixed(1);
      console.log(
        `  ✅ "${node.title}" main — ${mainElapsed}s`,
      );

      // 3b. For non-terminal nodes: extract last frame → generate idle video
      if (!isTerminal) {
        const lastFramePath = join(LASTFRAMES_DIR, `${node.id}-lastframe.jpg`);
        extractLastFrame(mainPath, lastFramePath);

        // Upload last frame to get a URL for Replicate
        // Since Replicate needs a URL, we re-upload the last frame via nanobanana as a pass-through
        // Actually simpler: just use the local file as a data URI won't work with Replicate.
        // We need to host it. Let's use the last frame file and convert to base64 data URI.
        const { readFile } = await import("node:fs/promises");
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

        const idleElapsed = ((Date.now() - idleStart) / 1000).toFixed(1);
        console.log(
          `  ✅ "${node.title}" idle — ${idleElapsed}s (from last frame)`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ "${node.title}" — ${msg}`);
      failed.push(node.title);
    }

    nodesDone++;
    const nodeElapsed = ((Date.now() - nodeStart) / 1000).toFixed(1);
    console.log(
      `  [${nodesDone}/${totalNodes}] "${node.title}" complete (${nodeElapsed}s)\n`,
    );
  });

  console.log(
    `Step 3: Generating videos for ${totalNodes} nodes (5 nodes concurrent, main→idle sequential per node)...\n`,
  );

  await runWithConcurrency(perNodeTasks, 5);

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`=== Complete (${totalTime} min) ===`);
  console.log(`  Images: 1 character + ${interview.nodes.length} keyframes`);
  console.log(`  Nodes: ${nodesDone - failed.length}/${totalNodes} succeeded`);
  if (failed.length > 0) {
    console.log(`  Failed: ${failed.join(", ")}`);
  }
}

main().catch(console.error);
