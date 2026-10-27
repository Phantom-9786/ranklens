# FE-06 submission

## Deliverable links — one URL per line

```text
https://ranklens-beta.vercel.app/assistant
https://github.com/Phantom-9786/ranklens/blob/codex/capstone-skeleton/src/app/api/chat/route.ts
https://github.com/Phantom-9786/ranklens/blob/codex/capstone-skeleton/src/components/audit-chat.tsx
```

## Notes

Implemented RankLens's central audit-summary interaction as a real Gemini streaming conversation using the AI SDK's streamText. Gemini is used as allowed by the assignment Q&A. The API key remains server-side in Vercel; prompt/model configuration is centralized in src/lib/ai-config.ts.

The client consumes typed SSE events and provides thinking-to-text handoff, distinct messages, Stop with partial-response preservation, multi-turn context, local persistence, scroll-up-aware auto-scroll, Jump to latest, and a mobile-friendly composer. Model output is rendered as plain text to safely handle incomplete markdown.

Sixteen automated tests and production builds pass. Live-model checks verified stopping mid-stream, sending again, contextual follow-ups, scroll-up during generation, and history restoration on reload. The layout was checked at 375px. The underlying audit reports remain clearly labelled sample fixtures; the AI generation is real.

No separate file upload is required by this brief. Save on FlyRank and check for Submitted status; this document does not submit automatically.
