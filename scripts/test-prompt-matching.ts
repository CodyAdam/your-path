import interview from "../app/data/scenarios/interview.json";
import videoPrompts from "../app/data/scenarios/interview-video-prompts.json";

let passed = 0;
let failed = 0;

console.log("=== Verifying Video Prompt ↔ Script Matching ===\n");

// Test 1: Every node in interview.json has a corresponding video prompt
for (const node of interview.nodes) {
  const prompt = videoPrompts.nodes[node.id as keyof typeof videoPrompts.nodes];
  if (!prompt) {
    console.error(`❌ MISSING PROMPT: Node "${node.id}" (${node.title}) has no video prompt`);
    failed++;
    continue;
  }

  // Extract the dialogue from the script field (various patterns like "She says:", "then says:", etc.)
  const scriptMatch = node.script.match(/(?:She says|then says|says):\s*'([^']+(?:'+[^']*)*?)'/);
  if (!scriptMatch) {
    console.error(`❌ NO DIALOGUE IN SCRIPT: Node "${node.id}" script doesn't contain dialogue pattern`);
    failed++;
    continue;
  }
  const scriptDialogue = scriptMatch[1].trim();

  // Check if the video prompt contains this same dialogue
  const promptMatch = prompt.match(/She says:\s*'([^']+(?:'+[^']*)*?)'/);
  if (!promptMatch) {
    console.error(`❌ NO DIALOGUE IN PROMPT: Node "${node.id}" (${node.title}) video prompt is missing "She says: '...'" dialogue`);
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

// Test 2: No extra prompts for nodes that don't exist
const nodeIds = new Set(interview.nodes.map((n) => n.id));
for (const promptId of Object.keys(videoPrompts.nodes)) {
  if (!nodeIds.has(promptId)) {
    console.error(`❌ ORPHAN PROMPT: Video prompt "${promptId}" has no matching node in interview.json`);
    failed++;
  }
}

// Test 3: Idle prompt should NOT contain "She says"
if (videoPrompts.idlePrompt.includes("She says")) {
  console.error(`❌ IDLE PROMPT contains dialogue — idle should have NO speaking`);
  failed++;
} else {
  console.log(`✅ Idle prompt: no dialogue (correct — she listens silently)`);
  passed++;
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
