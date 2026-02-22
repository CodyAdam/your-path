import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateVideoFromImage } from "../app/actions/_processing/video-generation";

const VIDEOS_DIR = join(import.meta.dir, "..", "public", "videos");
const LASTFRAMES_DIR = join(
  import.meta.dir,
  "..",
  "public",
  "images",
  "lastframes",
  "interview"
);

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

const TARGET_NODES = ["node-02", "node-05", "node-05-skeptical"];

async function main() {
  const startTime = Date.now();
  console.log(
    `=== Regenerating ${TARGET_NODES.length} idle videos (parallel) ===\n`
  );

  await mkdir(LASTFRAMES_DIR, { recursive: true });

  // Idle-only prompt — NO scenario prefix to avoid "she speaks" confusion
  const idlePrompt =
    "A woman sits quietly in an office, listening attentively. Mouth closed, lips together, not speaking, not talking. Subtle natural movements only — blinking, slight breathing, gentle head tilt. She is listening and waiting. No talking, no lip movement, no mouth opening. No text, no subtitles, no words on screen.";
  console.log(`Idle prompt: "${idlePrompt}"\n`);

  let done = 0;
  const failed: string[] = [];

  // Run ALL nodes in parallel
  const tasks = TARGET_NODES.map(async (nodeId) => {
    const mainVideoPath = join(VIDEOS_DIR, `node-${nodeId}-main.mp4`);
    const lastFramePath = join(LASTFRAMES_DIR, `${nodeId}-lastframe.jpg`);

    try {
      extractLastFrame(mainVideoPath, lastFramePath);

      const lastFrameBuffer = await readFile(lastFramePath);
      const base64 = lastFrameBuffer.toString("base64");
      const lastFrameDataUri = `data:image/jpeg;base64,${base64}`;

      const idleStart = Date.now();
      const idleResult = await generateVideoFromImage({
        imageUrl: lastFrameDataUri,
        prompt: idlePrompt,
        duration: 12,
        cameraFixed: true,
      });

      const idleFileName = `node-${nodeId}-idle.mp4`;
      await downloadAndSave(
        idleResult.videoUrl,
        join(VIDEOS_DIR, idleFileName)
      );

      done++;
      const elapsed = ((Date.now() - idleStart) / 1000).toFixed(1);
      console.log(
        `  ✅ [${done}/${TARGET_NODES.length}] ${nodeId} idle — ${elapsed}s`
      );
    } catch (err) {
      done++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `  ❌ [${done}/${TARGET_NODES.length}] ${nodeId} idle failed: ${msg}`
      );
      failed.push(nodeId);
    }
  });

  await Promise.all(tasks);

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(
    `\n=== Done (${totalTime} min) — ${done - failed.length}/${TARGET_NODES.length} succeeded ===`
  );
  if (failed.length > 0) {
    console.log(`  Failed: ${failed.join(", ")}`);
  }
}

main().catch(console.error);
