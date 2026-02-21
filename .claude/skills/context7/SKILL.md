---
name: context7
description: Look up third-party API and library documentation using Context7 MCP tools. Use when integrating with external APIs (Anthropic, Hume AI, Whisper, etc.), checking library usage, or needing up-to-date docs. Triggers on "look up docs", "check API docs", "how does X API work", "context7", "check the docs", or when doing integration work.
---

# Context7 - API & Library Docs Lookup

Look up live documentation for any third-party library or API using Context7 MCP.

## How It Works

1. **Resolve** the library ID: `resolve-library-id(libraryName, query)`
2. **Query** the docs: `query-docs(libraryId, query)`

Max 3 calls per tool per question. Use the best result you have.

## Workflow

```
User: "How do I use Claude API for tool use?"

Step 1: resolve-library-id(libraryName: "anthropic-sdk", query: "tool use")
→ Returns library ID like "/anthropics/anthropic-sdk-typescript"

Step 2: query-docs(libraryId: "/anthropics/anthropic-sdk-typescript", query: "tool use function calling")
→ Returns relevant docs + code examples
```

## YourPath Integration Map

Common libraries used in the YourPath codebase and their likely Context7 names:

| Library | Search Term | Codebase Location |
|---------|-------------|-------------------|
| Anthropic/Claude | `anthropic-sdk` | `packages/backend/src/services/llm.ts` |
| Hume AI | `hume-ai` | `packages/backend/src/services/ser.ts`, `fer.ts` |
| OpenAI Whisper | `openai` | `packages/backend/src/services/` (STT) |
| Express | `express` | `packages/backend/src/` |
| Nuxt 3 | `nuxt` | `packages/frontend/` |
| Vue 3 | `vue` | `packages/frontend/` |
| Zod | `zod` | `packages/shared/src/schemas.ts` |
| face-api.js | `face-api-js` | `packages/frontend/` (client-side FER) |
| MediaRecorder | `web-api` | `packages/frontend/composables/` |

## Tips

- If `resolve-library-id` returns multiple matches, pick the one with the highest Code Snippet count and relevance
- Be specific in queries: "streaming response with tools" > "api usage"
- For Claude API, include the operation: "create message with tools", "streaming", "vision"
- If no good match found, refine the library name (e.g., try `@anthropic-ai/sdk` instead of `anthropic`)

## Example Queries

| Task | resolve-library-id | query-docs |
|------|-------------------|------------|
| Claude evaluation prompt | `anthropic-sdk` | "create message with system prompt" |
| Hume emotion detection | `hume-ai` | "speech emotion recognition API" |
| Nuxt composable | `nuxt` | "custom composable useAsyncData" |
| Vue video element | `vue` | "template refs video element" |
| Zod validation | `zod` | "object schema with discriminated union" |
| Express file upload | `express` | "multipart form data file upload multer" |
