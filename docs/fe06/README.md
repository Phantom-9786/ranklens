# FE-06 streaming audit conversation

The RankLens conversation is available at `/assistant`; the server route is `src/app/api/chat/route.ts`, the client is `src/components/audit-chat.tsx`, and prompt/model settings are centralized in `src/lib/ai-config.ts`.

## Implementation

- Server-only Gemini provider through AI SDK streamText; real provider deltas are paced by the SDK's word-level smoothStream transform, not generated fixtures.
- Typed SSE start/text-delta/finish/error events and an incremental UTF-8 decoder.
- Thinking before the first text, plain-text rendering of incomplete output, distinct user/assistant messages, Stop, follow-up context, local persistence, and a phone-sized composer.
- Scrolling follows new text only while pinned near the bottom; scrolling up releases the pin and exposes Jump to latest.
- Abort signals connect the client, request, SDK and stream. Stopped partial text is preserved. Older request cleanup cannot reset a newer generation.
- Request validation, size/context limits, timeout, missing-configuration handling, and safe provider errors. No API key or raw provider metadata is exposed in responses.

## Configuration

`GOOGLE_GENERATIVE_AI_API_KEY` is a Vercel secret scoped to Production and Preview. The owner entered the value; only the environment scope was inspected and adjusted. A redeploy is required after changing environment values/scopes. The default model is gemini-3.5-flash-lite; GOOGLE_AI_MODEL is an optional server-side override.

## Verification

15 automated tests and production build passed. CI passed on the initial feature commit. Tests include split UTF-8/SSE chunks, truncated streams, cancellation, multi-turn routing, safe provider errors, thinking-to-text handoff, stopped partial preservation, immediate Stop → Send, saved history and scroll-up behavior. Provider streams are mocked only in tests.

Live provider validation will be recorded after the deployment using the newly saved Preview secret scope completes. A build or mocked test alone is not evidence of a working live model conversation.
