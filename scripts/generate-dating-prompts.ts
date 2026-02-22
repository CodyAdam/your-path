import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import dating from "../app/data/scenarios/dating.json";

const anthropic = new Anthropic();

async function generateVideoPrompts() {
  console.log("=== Generating Dating Video Prompts via Claude ===\n");

  const systemPrompt = `You are a video prompt engineer for an AI video generation model (Seedance by ByteDance).
You write concise visual descriptions for short video clips. Your prompts describe ONLY visual actions, body language, facial expressions, and camera movements — never dialogue text or subtitles.

CRITICAL CONTEXT — Camera perspective:
- The camera IS the date partner (first-person POV of someone on a first date)
- The person ON SCREEN is a YOUNG WOMAN — she is the one sitting across the table at a cozy café
- She speaks directly to the camera as if talking to her date sitting in front of her
- Warm, intimate café lighting. Casual, relaxed atmosphere.

Rules:
- Describe what the woman DOES: body language, facial expressions, gestures, posture changes
- Include subtle emotional cues matching the scene tone (playful, curious, disappointed, warm, cold)
- IMPORTANT: Include the dialogue she speaks. Add "She says: '...'" with the exact lines from the node's script field. This ensures the video model generates matching lip movements.
- For the idle prompt: she must NOT speak at all — mouth closed, lips together, just listening, maybe sipping her drink or nodding slightly.
- Always end with: "No text, no subtitles, no words on screen."
- Keep the body language description to 2-3 sentences, then append the dialogue`;

  const nodesPayload = dating.nodes.map((node) => ({
    id: node.id,
    title: node.title,
    script: node.script,
    isTerminal: node.options.length === 0,
  }));

  const userPrompt = `Generate a video prompt for EACH node in this first date scenario.

The person on screen is a YOUNG WOMAN on a first date at a cozy café. She speaks directly to camera (the viewer is her date).

For non-terminal nodes: she is having conversation, asking questions, reacting to her date's responses — show her speaking, gesturing, expressing emotions. Include the exact dialogue from the node's "script" field using "She says: '...'"
For terminal nodes: the date is ending — match the tone:
  - Success (node-14-win): warm, genuine smile, happy energy, clearly wants to see the date again
  - Failure (lose-*): various levels of disappointment, discomfort, or polite exit — match the specific reason (disrespect, flexing, alcohol concern, victim mentality, killed the vibe)
  Include the exact dialogue from the node's "script" field.

Also generate ONE idle prompt for when she is LISTENING to her date's response — she sits quietly, mouth closed, lips together, no speaking, no lip movement, no talking at all. Maybe she nods slightly, sips her drink, or plays with her hair. Attentive, interested body language. Waiting for the date to finish talking.

Nodes:
${JSON.stringify(nodesPayload, null, 2)}

Respond in this exact JSON format:
{
  "idlePrompt": "...",
  "nodes": {
    "node-id": "prompt text here",
    ...
  }
}`;

  console.log("Calling Claude...\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = response.content[0];
  if (text.type !== "text") {
    throw new Error("Unexpected response type");
  }

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  const prompts = JSON.parse(jsonMatch[0]) as {
    idlePrompt: string;
    nodes: Record<string, string>;
  };

  const missing = dating.nodes.filter((n) => !prompts.nodes[n.id]);
  if (missing.length > 0) {
    console.warn(
      `Warning: missing prompts for: ${missing.map((n) => n.id).join(", ")}`
    );
  }

  console.log("Generated prompts:\n");
  console.log(`Idle: ${prompts.idlePrompt}\n`);
  for (const node of dating.nodes) {
    const prompt = prompts.nodes[node.id] ?? "(missing)";
    console.log(`[${node.id}] ${node.title}`);
    console.log(`  ${prompt}\n`);
  }

  const outputPath = join(
    import.meta.dir,
    "..",
    "app",
    "data",
    "scenarios",
    "dating-video-prompts.json"
  );
  await writeFile(outputPath, JSON.stringify(prompts, null, 2));
  console.log(`\nSaved to ${outputPath}`);
}

generateVideoPrompts().catch(console.error);
