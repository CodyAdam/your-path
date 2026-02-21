# CLAUDE.md

## Project Overview

**YourPath** — An AI-driven interactive video game platform built on decision-tree branching narratives.

Unlike Berghaintrainer (which uses random outcomes disguised as AI), YourPath makes **real AI-powered decisions** based on:
- **Voice conversation content** (speech-to-text + LLM evaluation)
- **Speech Emotion Recognition** (SER)
- **Facial Emotion Recognition** (FER)

### Two User Types

1. **Admin (Scenario Designer)** — Creates scenarios (e.g., behavior interview), defines decision trees, sets criteria for branching
2. **Player** — Experiences the interactive video, plays a role (e.g., interviewee), navigates the tree toward success/failure

### Version Roadmap

- **V0 (Hackathon MVP)**: 2 pre-designed scenarios, fully playable end-to-end
- **V1**: Admin can create a scenario via a single prompt + max step limit → auto-generates decision tree → admin approves → system generates video for each branch

## Architecture Design

### High-Level Flow

```
┌─────────────────────────────────────────────────────────┐
│                    PLAYER SESSION                        │
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌───────────────────┐  │
│  │ Play     │───▶│ Capture  │───▶│ AI Decision       │  │
│  │ Video    │    │ Response │    │ Engine             │  │
│  │ Node     │    │ (voice + │    │ (LLM + SER + FER) │  │
│  └──────────┘    │  webcam) │    └────────┬──────────┘  │
│       ▲          └──────────┘             │              │
│       │                                   │              │
│       │    ┌──────────────┐               │              │
│       │    │ Idle Loop    │◀──────────────┘              │
│       │    │ (sway anim   │   (while waiting             │
│       │    │  from last   │    for decision)             │
│       │    │  frame)      │                              │
│       │    └──────┬───────┘                              │
│       │           │ decision ready                       │
│       └───────────┘                                      │
│              load next video node                        │
└─────────────────────────────────────────────────────────┘
```

### Graph Structure (Source of Truth: `lib/graph-structure.ts`)

The scenario graph is a **potentially cyclic directed graph** defined with Zod schemas.

```
          ┌──────────────┐
          │  Start Node   │
          └──┬───┬───┬───┘
   condition │   │   │ no match
      met    │   │   ▼
             │   │  [fallback node]
             ▼   ▼
        [Node A] [Node B] ◄─── can loop back
            │       │
            ▼       ▼
      [End Node]  [End Node]   (options = [] → end)
       success      failure
```

**Graph schema** (`lib/graph-structure.ts`):
```typescript
graphStructure {
  title: string
  startImageUrl: string       // image seed for AI video generation
  prompt: string              // scenario description for video generation
  startNodeId: string         // entry point node ID
  nodes: Node[]               // all nodes in the graph
}

Node {
  id: string
  title: string
  script: string              // what the NPC says / shows in this segment
  options: Option[]           // branching paths (empty = end node)
  fallbackNodeId?: string     // default path if no condition matches
}

Option {
  condition: string           // condition text evaluated by LLM against player input
  nodeId: string              // next node if condition is met
}
```

**Key design decisions:**
- **Cyclic graph, not just a tree** — nodes can loop back (e.g., "ask again" if player gives nonsense)
- **Per-branch conditions** — each option has its own `condition` string, evaluated by LLM
- **Fallback path** — `fallbackNodeId` catches unmatched responses instead of breaking
- **Empty options = end node** — no separate `is_terminal` flag needed
- **Conditions reference multimodal input** — condition strings can describe voice, emotion, facial cues (e.g., "player sounds confident and provides a specific example")

### Session Data Model

```typescript
// Runtime types for player sessions (not in graph-structure.ts yet)

interface PlayerSession {
  id: string
  graphTitle: string
  currentNodeId: string
  history: SessionStep[]
  startedAt: number
  status: "in_progress" | "completed"
  result?: "success" | "failure"
}

interface SessionStep {
  nodeId: string
  transcript: string              // STT result
  speechEmotion: string           // SER output
  facialEmotion?: EmotionScores   // FER output
  chosenOptionIndex: number | -1  // -1 = fallback was used
  nextNodeId: string
  timestamp: number
}

interface EmotionScores {
  joy: number
  sadness: number
  anger: number
  surprise: number
  fear: number
  disgust: number
  confidence: number
}
```

## Tech Stack

- **Next.js 16** (App Router) — fullstack React framework, deployed on Vercel
- **React 19** — UI with hooks
- **TypeScript** — everywhere
- **Bun** — package manager & runtime
- **TailwindCSS v4** — styling
- **React Query** (`@tanstack/react-query`) — async state management
- **Zod** — runtime validation & schema definitions
- **ElevenLabs** — STT via Scribe v2 (already integrated)
- **Claude API (Anthropic)** — LLM decision engine for evaluating player responses
- **SER** — speech emotion recognition (stub exists, needs real implementation)
- **FER** — facial emotion recognition (e.g., face-api.js client-side or Hume AI)
- **Next.js Server Actions** — backend logic (no separate server needed)
- **Vercel** — fullstack hosting (frontend + server actions + edge functions)

### Storage (V0)
- **JSON files** in `app/data/scenarios/` — pre-built scenario graphs
- **`public/videos/`** — video assets served statically

## Project Structure

```
your-path/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/
├── .mcp.json
├── .env.example                  # ELEVENLABS_API_KEY
├── .env                          # Local env (git-ignored)
├── package.json                  # Bun + Next.js
├── bun.lock
├── next.config.ts
├── tsconfig.json
├── tailwind / postcss configs
│
├── lib/
│   └── graph-structure.ts        # Zod schemas: graphStructure + nodeSchema ✅
│
├── app/
│   ├── layout.tsx                # Root layout (fonts, providers)
│   ├── providers.tsx             # React Query provider
│   ├── globals.css               # Tailwind styles
│   ├── page.tsx                  # Landing / scenario selection
│   │
│   ├── play/
│   │   └── [scenarioId]/
│   │       └── page.tsx          # Player game view
│   │
│   ├── admin/                    # V1: scenario builder
│   │   └── page.tsx
│   │
│   ├── actions/                  # Server actions (backend logic)
│   │   ├── analyse-audio.ts      # Audio pipeline: STT + SER in parallel ✅
│   │   ├── evaluate.ts           # LLM decision engine (TODO)
│   │   └── _processing/          # Pluggable audio processors
│   │       ├── types.ts          # AudioProcessor type ✅
│   │       ├── speech-to-text.ts # ElevenLabs Scribe v2 ✅
│   │       └── speech-emotion.ts # SER stub (returns "happy") ⚠️
│   │
│   ├── components/
│   │   ├── SpeechToTextDemo.tsx  # Recording + transcript UI ✅
│   │   ├── VideoPlayer.tsx       # Video playback + source swapping (TODO)
│   │   ├── IdleAnimation.tsx     # Canvas sway from last frame (TODO)
│   │   └── ResponseCapture.tsx   # Webcam + mic capture (TODO)
│   │
│   ├── hooks/                    # React hooks
│   │   ├── useGameSession.ts     # Game state machine (TODO)
│   │   ├── useMediaCapture.ts    # Webcam + mic (TODO)
│   │   └── useIdleAnimation.ts   # Last-frame sway (TODO)
│   │
│   ├── types/                    # Additional TypeScript types
│   │   └── session.ts            # PlayerSession, SessionStep, EmotionScores
│   │
│   └── data/
│       └── scenarios/            # V0 pre-built scenario graph JSON files
│           ├── behavior-interview.json
│           └── scenario-2.json
│
├── public/
│   └── videos/                   # V0 pre-recorded video clips
│
└── videos/                       # Raw video assets (git-ignored)
```

## What's Already Built

- ✅ **Graph structure schema** (`lib/graph-structure.ts`) — Zod schemas for scenario graph + nodes with conditions
- ✅ **Audio analysis pipeline** (`app/actions/analyse-audio.ts`) — validates audio, runs STT + SER in parallel
- ✅ **ElevenLabs STT** (`app/actions/_processing/speech-to-text.ts`) — Scribe v2 integration
- ✅ **AudioProcessor type** (`app/actions/_processing/types.ts`) — pluggable processor interface
- ✅ **Recording UI** (`app/components/SpeechToTextDemo.tsx`) — MediaRecorder, upload, transcript display
- ✅ **React Query setup** (`app/providers.tsx`) — QueryClientProvider with stale time config
- ⚠️ **SER stub** (`app/actions/_processing/speech-emotion.ts`) — returns hardcoded "happy", needs real implementation

## Key Implementation Details

### 1. Video Playback + Transition (Core Loop)

Swap `<video>` src on state change (Berghaintrainer pattern, adapted for React):

```typescript
// app/hooks/useGameSession.ts
type GameState = 'playing_video' | 'capturing_response' | 'waiting_decision' | 'transitioning'

// Flow: playing_video → capturing_response → waiting_decision → transitioning → playing_video
```

### 2. Idle Sway Animation (Waiting State)

When waiting for LLM decision, extract last frame from video and apply subtle CSS/Canvas animation:

```typescript
// app/hooks/useIdleAnimation.ts
// 1. Capture last frame of video to canvas via drawImage()
// 2. Apply subtle transform animation (CSS):
//    - Gentle vertical sway (translateY ±2-3px, ~2s cycle)
//    - Slight breathing scale (scale 1.0-1.005, ~3s cycle)
//    - Optional subtle head tilt (rotate ±0.3deg)
// 3. Overlay a "thinking" indicator or subtle ambient animation
```

### 3. AI Decision Engine

```typescript
// app/actions/evaluate.ts (server action)
// Input: { transcript, speechEmotion, facialEmotion, currentNode, conversationHistory }
// Process:
//   1. Build prompt with scenario context + current node script
//   2. Include player's transcript, emotion data as evidence
//   3. For each option in currentNode.options, ask Claude if the condition is met
//   4. Return first matching option's nodeId, or fallbackNodeId if none match
//   5. Return: { nextNodeId: string, matchedOptionIndex: number, reasoning: string }
```

### 4. Audio Processing Pipeline (Already Built)

```typescript
// app/actions/analyse-audio.ts
// 1. Receives FormData with audio blob from client
// 2. Validates: size (25MB max), type (webm/mp3/wav/mp4/m4a)
// 3. Runs in parallel: speechToText(audio) + speechToEmotion(audio)
// 4. Returns: { speechToText: { result }, sentimentAnalysis: { result } }

// AudioProcessor interface (app/actions/_processing/types.ts)
type AudioProcessor = (file: Blob) => Promise<{ result: string }>
```

### 5. V0 Pre-built Scenario Format

Following `lib/graph-structure.ts` schema:

```json
{
  "title": "Tech Company Behavior Interview",
  "startImageUrl": "/videos/interview/thumbnail.jpg",
  "prompt": "A professional job interview setting in a modern office",
  "startNodeId": "intro",
  "nodes": [
    {
      "id": "intro",
      "title": "Opening Question",
      "script": "Welcome! Tell me about a time you led a challenging project.",
      "options": [
        {
          "condition": "Player provides a specific example with clear STAR structure and sounds confident",
          "nodeId": "q2_impressed"
        },
        {
          "condition": "Player gives a vague or generic answer without specifics",
          "nodeId": "q2_skeptical"
        },
        {
          "condition": "Player goes off topic or doesn't answer the question",
          "nodeId": "q2_redirect"
        }
      ],
      "fallbackNodeId": "q2_skeptical"
    },
    {
      "id": "q2_impressed",
      "title": "Impressed Follow-up",
      "script": "That's a great example. How did you handle conflicts within the team?",
      "options": [],
    }
  ]
}
```

## Development

### Setup

```bash
bun install
cp .env.example .env
# Add your ELEVENLABS_API_KEY to .env
bun dev
```

### Commands

```bash
bun dev          # Start dev server (http://localhost:3000)
bun run build    # Build for production
bun start        # Start production server
bun run lint     # ESLint
```

### Environment Variables

```
ELEVENLABS_API_KEY=      # ElevenLabs API key (STT via Scribe v2)
ANTHROPIC_API_KEY=       # Claude API key for LLM decisions (TODO)
HUME_API_KEY=            # (optional) Hume AI for SER/FER
```

## Conventions

- **TypeScript** everywhere — strict types, no `any`
- **Zod schemas** in `lib/` as source of truth for data structures — use `z.infer<>` for types
- **Next.js App Router** — file-based routing in `app/`
- **Server Actions** (`"use server"`) for all backend logic — no separate API server
- **React Query** for client-side async state (mutations for server action calls)
- **TailwindCSS** for styling — utility-first, dark mode support
- **Bun** as package manager — use `bun add`, `bun dev`, etc.
- Component names: PascalCase (e.g., `VideoPlayer.tsx`)
- Hook names: `use` prefix (e.g., `useGameSession.ts`)
- Server action files in `app/actions/`
- Processing modules in `app/actions/_processing/` following `AudioProcessor` interface
- Scenario data as JSON in `app/data/scenarios/` for V0
- Video assets in `public/videos/`
- Keep video files under 10MB per clip for fast loading
- Preload next probable video nodes for smooth transitions

## Important Notes

- **Berghaintrainer reference**: They use Nuxt.js + video src swapping + annyang.js for speech. Their "AI" is actually random. Ours is real.
- **Fullstack Next.js**: No separate backend — server actions handle all server-side logic. Deployed as a single unit on Vercel.
- **Graph schema is source of truth**: `lib/graph-structure.ts` defines the canonical graph/node shape. Use `z.infer<typeof graphStructure>` for types. Don't duplicate these types manually.
- **Browser requirements**: Webcam + mic permissions required.
- **Idle animation**: Use canvas `drawImage()` from last video frame + CSS transforms for sway. Keep it subtle — just enough to avoid a frozen screen.
- **Video preloading**: Preload all children video nodes of current node to minimize transition delay.
- **LLM latency**: Expect 1-3s for Claude API response. Idle animation covers this gap.
- **V0 focus**: Hardcode 2 scenarios, no admin UI needed. All scenario graphs defined in JSON.
- **V1 scope**: Single prompt + max steps → Claude generates graph JSON → admin reviews → approve → trigger video generation per node.
- **ElevenLabs STT**: Already integrated. Uses Scribe v2 model. Requires `ELEVENLABS_API_KEY`.
- **SER stub**: `speech-emotion.ts` currently returns hardcoded "happy" — needs real implementation (Hume AI or open-source model).
