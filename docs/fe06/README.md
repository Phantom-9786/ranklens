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

16 automated tests and production build passed. CI passed after the current-model correction. Tests include split UTF-8/SSE chunks, truncated streams, cancellation, multi-turn routing, safe provider errors, thinking-to-text handoff, stopped partial preservation, immediate Stop → Send, saved history and scroll-up behavior. Provider streams are mocked only in tests.

Real-model browser validation passed on the deployed feature preview. See the live check record below. A build or mocked test alone is not evidence of a working live model conversation.

## Live integration progress

The owner supplied the Vercel Gemini secret. Its Preview scope was added without revealing or changing the secret value. The first model configuration returned a safe model-unavailable error. Google's current model documentation limits Gemini 2.5 access for new projects, so the server default was updated to gemini-3.5-flash-lite with minimal thinking. A real deployed conversation then returned a substantive audit response. Model documentation: https://ai.google.dev/gemini-api/docs/models .

The latest test suite has 16 passing tests, including safe provider error categorization. Public preview access may be protected by Vercel Authentication; the stable production app will be checked before submission.

## Real-model browser checks — 27 October 2026

- A real Gemini response described sample findings and answered follow-up questions. No public mock/deterministic model was used.
- Thinking was visible before text. A follow-up was stopped while Stop was still visible and only partial text had arrived. The stopped partial remained in the conversation.
- The next send succeeded with the partial/history intact. Gemini continued in context and referenced Studio North's sample profile (24 pages, score 82).
- During the next stream, PageUp released scrolling. With more text present, scrollTop stayed at 690.67 while the bottom reached 1531; Jump to latest remained visible. Clicking Jump moved to 1530.67, restoring bottom pinning.
- At actual CSS width 375px, document width was 360px and composer input font size was 16px. No page-level horizontal overflow occurred.
- Reload restored all six messages, the stopped marker, and the last substantive response.
- Server-side API key was never copied into local source, printed, or sent to the browser. Only names/scopes were inspected in Vercel.

Feature preview: https://ranklens-git-codex-streaming-audit-chat-event-ai-frontend.vercel.app/assistant . Initial model-correction deployment: https://vercel.com/event-ai-frontend/ranklens/J7M9LwoL44opWaYFm43Hv93T9Wfb . Preview URLs may require Vercel login; submit the public stable URL below after production verification.

## Submission links

- Live app: https://ranklens-beta.vercel.app/assistant
- Route: https://github.com/Phantom-9786/ranklens/blob/codex/capstone-skeleton/src/app/api/chat/route.ts
- Client: https://github.com/Phantom-9786/ranklens/blob/codex/capstone-skeleton/src/components/audit-chat.tsx

Audit data remains explicitly labelled as sample fixtures; the AI interaction is real. API quota/availability are controlled by the provider. The app does not crawl websites. Requests use bounded history/output and a timeout; this public assignment demo is not a full authenticated, durable rate-limited service.

## Production rollout

The feature passed real-model checks on its protected branch preview before being fast-forwarded to codex/capstone-skeleton. Vercel production branch tracking and automatic domain assignment were verified. A fresh production-branch documentation commit triggers a distinct production rollout after the same feature commit was deployed on Preview; anonymous public endpoint verification is performed after it is Ready.
