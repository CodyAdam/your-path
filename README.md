# YourPath

AI-driven interactive video game platform built on decision-tree branching narratives. Players navigate scenarios (e.g., behavior interviews) through voice conversation, with real-time AI evaluation of speech content, vocal emotion, and facial expression to determine story branches.

## Tech Stack

- **Next.js 16** (App Router) — fullstack React framework
- **React 19** + **TypeScript**
- **TailwindCSS v4** — styling
- **React Query** — async state management
- **ElevenLabs** — speech-to-text (Scribe v2)
- **Claude API** — LLM decision engine
- **Bun** — package manager & runtime
- **Vercel** — deployment

## Getting Started

```bash
bun install
cp .env.example .env
# Add your API keys to .env
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```
ELEVENLABS_API_KEY=      # ElevenLabs (STT)
ANTHROPIC_API_KEY=       # Claude (LLM decisions)
```

## Project Structure

```
app/
├── actions/              # Server actions (backend logic)
│   ├── analyse-audio.ts  # Audio pipeline: STT + SER in parallel
│   ├── evaluate.ts       # LLM decision engine
│   └── _processing/      # Pluggable audio processors
├── components/           # React components
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── data/scenarios/       # Pre-built scenario JSON files
└── play/[scenarioId]/    # Player game route
```
