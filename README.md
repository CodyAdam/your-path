# YourPath

**Agentic, end-to-end AI** turns a single story idea into a full immersive experience. One prompt drives the whole pipeline: the AI generates the world (scenarios, media, voice) and, when you play, interprets your voice and context to choose the path. No hand-authored scripts or assets required—you create, edit, and play inside one AI-native workflow.

### Creation: AI builds the experience

From your prompt, the system generates the entire story layer:

- **Scenarios** — Branching narrative graph: nodes, dialogue, choices, and conditions.
- **Images** — Key art and scene imagery (e.g. start image, node art).
- **Videos** — Per-node or key-moment clips; **idle transitions** for waiting states.
- **Voice & music** — Character voice and ambient audio where supported.

You can then **edit** the graph in a visual editor—tweak nodes, scripts, and branches—so the experience stays authorable while staying AI-generated at the core.

### Play: AI runs the experience

When someone plays, the AI closes the loop:

- **Speech-to-text** — Your spoken replies are transcribed in real time.
- **Pathway selection** — An AI decides the next branch from multiple signals: what you said, conversation history, and (optionally) real-time **camera-based emotion** (face). So the story responds to both your words and your presence.

The result: **one idea → one generated world → one responsive playthrough**, with creation and play both driven by the same agentic pipeline.

---

## Main tech

| Area | Tech |
|------|------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Data & state** | TanStack React Query, Upstash Redis (story data, credits) |
| **Graph editor** | React Flow (`@xyflow/react`) |
| **Storage** | Vercel Blob (generated images) |
| **Payments** | Stripe (checkout, webhooks) |
| **Face & emotion (play)** | MediaPipe Tasks Vision (face detection), ONNX Runtime Web (browser emotion model) |
| **Runtime** | Bun |

---

## AI tech (models & providers)

| Provider | Model / product | Use in app |
|----------|------------------|------------|
| **Google (AI SDK)** | `gemini-3-flash-preview` | Story graph generation from prompt; path selection (picking next node from user reply + optional emotion). |
| **Google (AI SDK)** | `gemini-2.5-flash-image` | Start image for a new story. |
| **ElevenLabs** | Scribe v2 | Speech-to-text for voice input during play. |
| **Anthropic** | `claude-sonnet-4-20250514` | Scripts only: video/dating prompt generation (e.g. `scripts/generate-video-prompts.ts`, `scripts/generate-dating-prompts.ts`). |
| **FAL.ai** | `fal-ai/nano-banana`, `fal-ai/nano-banana/edit` | Image generation in scripts. |
| **FAL.ai** | `fal-ai/bytedance/seedance/v1.5/pro/image-to-video` | Image-to-video in scripts. |
| **On-device (browser)** | MediaPipe Blaze Face (face detector) | Face detection for play camera. |
| **On-device (browser)** | Custom ONNX emotion model (`emotion_model_web.onnx`) | 8-class emotion scores from face crop, passed as context to path selection. |

**Summary:** The main app uses **Google (Gemini)** for story generation and path selection, **ElevenLabs** for STT, and **MediaPipe + ONNX** for face/emotion in the browser. **Anthropic** and **FAL.ai** are used in standalone scripts (prompts, image/video generation), not in the core request path.

---

## Getting started

```bash
bun install
cp .env.example .env
# Add your API keys and config (see below)
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Purpose |
|----------|---------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini: graph generation, path selection, start image. |
| `ELEVENLABS_API_KEY` | ElevenLabs Scribe (speech-to-text). |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis: story data and credits. |
| `NEXT_PUBLIC_APP_URL` | Base URL (e.g. Stripe redirects, edit/play links). |
| `FAL_AI_API_KEY` | FAL.ai (only if running image/video scripts). |
| `STRIPE_*` | Stripe checkout and webhooks (see `app/actions/stripe-checkout.ts`, `app/api/webhooks/stripe/`). |

---

## Project structure

```
app/
├── actions/              # Server actions
│   ├── generate-graph.ts # Story + start image (Gemini)
│   ├── select-path.ts    # Next-node selection (Gemini + optional emotion)
│   ├── get-graph.ts      # Load story from Redis
│   ├── analyse-audio.ts  # STT + speech-emotion (parallel)
│   ├── stripe-checkout.ts
│   └── _processing/      # Audio pipelines (speech-to-text, speech-emotion)
├── edit/[id]/            # Graph editor (React Flow)
├── play/[id]/            # Play experience (voice, camera, branch selection)
├── api/webhooks/stripe/
├── providers.tsx         # React Query, etc.
└── page.tsx              # Home: create story, list stories

components/               # UI and play (GraphFlow, PlayCameraPreview, PlaySpeechInput, etc.)
lib/                      # Redis, graph schema, emotion recognition (ONNX), demo graph
scripts/                  # Standalone: image/video generation (FAL), prompt generation (Claude)
```

---

## License

Private. See repository for terms.
