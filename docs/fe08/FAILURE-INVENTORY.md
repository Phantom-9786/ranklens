# Checkpoint 1: primary-flow failure inventory

Primary flow: open /assistant → ask about a stored sample report → server-side Gemini tool lookup → structured report card and streamed explanation → follow-up. The model connection is real; report data is explicitly sample data.

| Case | Deliberate behavior | Verification |
| --- | --- | --- |
| Network fails before send | Warm error card names the failed question; Retry sends that question again without adding duplicate messages | Component test + local proxy network mode |
| Connection cut mid-stream | Partial text remains; response marked Incomplete; Retry replaces only the failed assistant reply | Component regression + proxy midstream mode |
| Provider error mid-stream | Safe server error event; partial text retained; manual Retry | Route generator throw + proxy api-error mode |
| Rate limit (429) | Actionable error, Retry-After countdown capped at 120s; no automatic request loop | Fake-clock test + proxy rate-limit mode |
| Empty/whitespace question | Send disabled; submit handler also rejects blank values | Component test |
| Unknown report/no results | Designed lookup error with three valid report IDs and example next question | Real get_audit_report failure; FE-07 workflow retained |
| First run/no conversation | Three click-to-fill example questions; no automatic provider call | Component test |
| Slow response | Reply skeleton, after 8s a reassuring wait/Stop message; bounded 55s client watchdog and 45s server timeout | Fake-clock test + proxy slow mode |
| Missing provider setup/API failure | Specific safe explanation; input controls recover; Retry when configured | Existing missing-key and provider tests |
| Malformed tool result/JSON | Runtime Zod validation, readable recovery card; no schema dump | Route + component tests + proxy malformed-tool mode |
| Empty model output/safety refusal | Explicit explanation with rephrasing/sample-report action instead of blank success | Route tests |
| Route rendering failure | assistant/error.tsx reload action plus sample-reports link; root error boundary retained | Boundary test |
| Reload/storage failure | Validated history, partial text preserved, latest failed reply remains retryable; storage warning if unavailable | Restore/validation tests |
| Double Retry/Stop then Send | Synchronous busy guard; only one active request; older cleanup cannot reset a newer request | Component regression tests |
| Conversation/input limit | Clear validation explanation; New conversation action available; server independently validates | Existing route validation tests |

## Implementation notes

The existing FE-06/FE-07 custom typed SSE transport is retained. It uses a client Error object and explicit per-message retry rather than useChat/regenerate. This is an intentional implementation difference from the brief's suggested hook; the equivalent user-visible behavior is tested directly, and it is not claimed to use useChat. Route failures and async chat failures are separate: error.tsx handles rendering, while chat errors render inline.

Retry reconstructs context up to the original question, omits the failed assistant response, and reuses its existing message ID. It does not resend later turns or duplicate the question in the visible conversation. Retrying intentionally replaces the partial answer with a fresh answer. No retries run automatically.

Mobile fixes use dynamic viewport units, safe-area padding, 16px input text, 44px action targets, contained scrolling, and no fixed-position composer. Responsive browser checks do not substitute for physical iPhone Safari testing; a real device is not available in this environment, so that check must not be reported as passed.

## Repeatable sabotage

Run `node scripts/checkpoint-lab.mjs 5188`. Open `http://127.0.0.1:5188/assistant?checkpoint=network`, then repeat with `midstream`, `api-error`, `rate-limit`, `malformed-tool`, and `slow`. Each page navigation arms one failure; Retry forwards to the real public service. The banner explicitly labels local fault injection. This proxy binds only to 127.0.0.1, forwards no cookies/secrets, and is never deployed as a public application route. Intentional console/network failures during sabotage are expected; happy-path console checks are separate.

Sources: [AI SDK error/retry guidance](https://ai-sdk.dev/docs/ai-sdk-ui/error-handling), [Next.js error boundaries](https://nextjs.org/docs/app/getting-started/error-handling).
