import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import interview from "../app/data/scenarios/interview.json";

const anthropic = new Anthropic();

async function generateVideoPrompts() {
  console.log("=== Generating Video Prompts via Claude ===\n");

  const systemPrompt = `You are a video prompt engineer for an AI video generation model (Seedance by ByteDance).
You write concise visual descriptions for short video clips. Your prompts describe ONLY visual actions, body language, facial expressions, and camera movements — never dialogue text or subtitles.

CRITICAL CONTEXT — Camera perspective:
- The camera IS the job candidate (first-person POV of someone being interviewed)
- The person ON SCREEN is the INTERVIEWER — she is the one CONDUCTING the interview, ASKING the questions, EVALUATING the candidate
- She sits across from the camera, speaking TO the camera as if talking to the candidate sitting in front of her
- She is in a position of authority — she decides whether the candidate gets the job

Rules:
- Describe what the interviewer DOES: body language, facial expressions, gestures, posture changes
- Include subtle emotional cues that show how she's evaluating the candidate (impressed, skeptical, concerned, satisfied)
- IMPORTANT: Include the dialogue the interviewer speaks. Add "She says: '...'" with the exact lines from the node's script field. This ensures the video model generates matching lip movements.
- For the idle prompt: she must NOT speak at all — mouth closed, lips together, just listening.
- Always end with: "No text, no subtitles, no words on screen."
- Keep the body language description to 2-3 sentences, then append the dialogue`;

  const nodesPayload = interview.nodes.map((node) => ({
    id: node.id,
    title: node.title,
    script: node.script,
    isTerminal: node.options.length === 0,
  }));

  const userPrompt = `Generate a video prompt for EACH node in this interview scenario.

The person on screen is the INTERVIEWER — she is conducting the interview and evaluating the candidate (who is the camera/viewer). She speaks directly to camera.

For non-terminal nodes: she is asking the candidate a question or responding to their previous answer — show her speaking, gesturing, evaluating. Include the exact dialogue from the node's "script" field using "She says: '...'"
For terminal nodes: she is wrapping up the interview and delivering her verdict to the candidate — match the tone:
  - Success: warm, impressed, clearly signaling the candidate did well
  - Failure: polite but firm, professionally ending the interview, signaling the candidate didn't make it
  - Neutral: professional, non-committal, keeping options open
  Include the exact dialogue from the node's "script" field.

Also generate ONE idle prompt for when the interviewer is LISTENING to the candidate's response — she sits silently, mouth closed, lips together, no speaking, no lip movement, no talking at all, attentive body language, waiting for the candidate to finish talking.

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
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = response.content[0];
  if (text.type !== "text") {
    throw new Error("Unexpected response type");
  }

  // Extract JSON from response (might be wrapped in markdown code block)
  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  const prompts = JSON.parse(jsonMatch[0]) as {
    idlePrompt: string;
    nodes: Record<string, string>;
  };

  // Validate all nodes have prompts
  const missing = interview.nodes.filter((n) => !prompts.nodes[n.id]);
  if (missing.length > 0) {
    console.warn(
      `Warning: missing prompts for: ${missing.map((n) => n.id).join(", ")}`
    );
  }

  console.log("Generated prompts:\n");
  console.log(`Idle: ${prompts.idlePrompt}\n`);
  for (const node of interview.nodes) {
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
    "interview-video-prompts.json"
  );
  await writeFile(outputPath, JSON.stringify(prompts, null, 2));
  console.log(`\nSaved to ${outputPath}`);
}

generateVideoPrompts().catch(console.error);
