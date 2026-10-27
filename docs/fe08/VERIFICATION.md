# Checkpoint 1 verification

2026-10-27: 33 automated tests across seven files pass. Next.js production build and strict TypeScript compilation pass. Tests exercise a real useChat transport adapter using controlled HTTP streams, including truncated replies, synchronous route throws, rate limits, malformed tool results, safety refusals, double Retry, and retry after restoring a failed conversation.

The feature is preserved on codex/checkpoint-one; production continues on codex/capstone-skeleton. See FAILURE-INVENTORY.md for the complete checklist and clearly labelled local sabotage procedure. Browser evidence and final live verification are recorded below after execution. Physical iPhone Safari is not available; no claim of real-device testing is made.

## Final public verification

Deployment 904e572 is Ready and GitHub CI passes. Anonymous HTTP checks completed both studio-north → output-available → finish and missing-report → output-error → finish. The public browser recovered its failed lookup through Retry, rendered the 82/100 report card, and returned to idle. The conversation contained exactly two messages (one question and one replaced reply), no error card, and no Stop button after completion. The browser console reported no errors or warnings during the final check.

An actual public interrupted connection and a timeout were observed during testing and rendered recoverable error cards. A redundant post-tool model-summary call was removed after this revealed unnecessary latency: the report card now completes the lookup in one model step. Follow-ups retain the report result in context.

## Browser sabotage results

- Network before first token: connection drop preserved the question and showed Retry; retrying contacted real Gemini, returned the score card and explanation, and kept two visible messages.
- Mid-stream cut: a real socket cut after labelled test text preserved that text and showed Retry; retrying returned a real one-sentence Gemini answer and replaced the incomplete reply.
- HTTP 429: an 8-second Retry-After value disabled Retry and counted down; Retry re-enabled afterward without an automatic request.
- Malformed tool payload: runtime validation produced a concise error and Retry rather than dumping Zod data or crashing.
- Mid-stream API error: a typed error event preserved partial text and rendered the intended recovery card.
- First run: useful click-to-fill examples appeared; blank submission is covered by the automated regression. Real provider latency also exercised the 8-second wait/Stop guidance; a timeout rendered recovery correctly.

Responsive checks used actual CSS widths approximately 374–376px (browser zoom caused integer rounding), a reduced 450px-high viewport, and desktop layout. Phone input computed to 16px, Retry was approximately 44px tall, the composer remained in document flow, and the document had no horizontal overflow. This verifies responsive layout, not a physical Safari keyboard or WebKit behavior. No CLS metric is claimed.

See [screenshot index](SCREENSHOTS.md). Local proxy fault-injection images are labelled and separate from the public happy-path evidence; none is a fabricated completion response.
