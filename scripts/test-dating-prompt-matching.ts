import dating from "../app/data/scenarios/dating.json";
import videoPrompts from "../app/data/scenarios/dating-video-prompts.json";

let passed = 0;
let failed = 0;

console.log("=== Verifying Dating Video Prompt ↔ Script Matching ===\n");

for (const node of dating.nodes) {
  const prompt = videoPrompts.nodes[node.id as keyof typeof videoPrompts.nodes];
  if (!prompt) {
    console.error(`❌ MISSING PROMPT: Node "${node.id}" (${node.title}) has no video prompt`);
    failed++;
    continue;
  }

  const scriptMatch = node.script.match(/(?:She says|then says|says|She asks):\s*'([^']+(?:'+[^']*)*?)'/);
  if (!scriptMatch) {
    console.error(`❌ NO DIALOGUE IN SCRIPT: Node "${node.id}" script doesn't contain dialogue pattern`);
    failed++;
    continue;
  }
  const scriptDialogue = scriptMatch[1].trim();

  const promptMatch = prompt.match(/She says:\s*'([^']+(?:'+[^']*)*?)'/);
  if (!promptMatch) {
    console.error(`❌ NO DIALOGUE IN PROMPT: Node "${node.id}" (${node.title}) video prompt is missing dialogue`);
    failed++;
    continue;
  }
  const promptDialogue = promptMatch[1].trim();

  if (scriptDialogue === promptDialogue) {
    console.log(`✅ ${node.id}: dialogue matches`);
    passed++;
  } else {
    console.error(`❌ MISMATCH: Node "${node.id}" (${node.title})`);
    console.error(`   Script:  "${scriptDialogue}"`);
    console.error(`   Prompt:  "${promptDialogue}"`);
    failed++;
  }
}

const nodeIds = new Set(dating.nodes.map((n) => n.id));
for (const promptId of Object.keys(videoPrompts.nodes)) {
  if (!nodeIds.has(promptId)) {
    console.error(`❌ ORPHAN PROMPT: "${promptId}" has no matching node`);
    failed++;
  }
}

if (videoPrompts.idlePrompt.includes("She says")) {
  console.error(`❌ IDLE PROMPT contains dialogue — idle should have NO speaking`);
  failed++;
} else {
  console.log(`✅ Idle prompt: no dialogue (correct)`);
  passed++;
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
