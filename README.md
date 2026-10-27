# RankLens

An SEO audit dashboard capstone for small website owners. **FE-05: Next.js skeleton** with routed screens, labelled sample reports, a server-fetched health page, and Tailwind design tokens.

**Live app:** [ranklens-beta.vercel.app](https://ranklens-beta.vercel.app)

**Streaming AI assistant:** [Open conversation](https://ranklens-beta.vercel.app/assistant) · [FE-06 implementation and live checks](docs/fe06/README.md)

**Git-triggered branch preview:** [codex/deploy-check](https://ranklens-git-codex-deploy-check-event-ai-frontend.vercel.app)

## Run

Node.js 24 was used. From the repository root:

```sh
npm ci
npm run dev
npm run build
npm start
```

The root application is Next.js. The separate workflow-drill/ directory preserves the earlier React practice exercise; Vercel must use the repository root, not that subdirectory.

## Screens

- `/`: sample overview, summary metrics, charts, and report links.
- `/audits`: three sample website reports.
- `/audits/new`: clearly disabled audit-configuration placeholder.
- `/audits/[id]`: sample report detail; unknown identifiers return 404.
- `/settings`: read-only workspace settings placeholder.
- `/assistant`: FE-06 streaming Gemini conversation explaining the sample audit reports.
- `/api/chat`: server-only AI SDK streamText and typed SSE response.
- `/health`: actual server-fetched public GitHub repository data with an error fallback.
- `/api/health`: JSON status, returning HTTP 200 on a successful upstream fetch or 503 on failure.

See [SPEC.md](SPEC.md) for the screen inventory and staged scope. Audit findings are fixtures, not real crawl results. AI explanations and stored-report lookup are available; live audit execution remains a future milestone.

## FE-07: structured report lookup

Live demo: https://ranklens-beta.vercel.app/assistant . Ask “Show the studio-north report” for a successful tool call, or “Look up the missing-report report” for a real failed lookup and recovery card.

Tool definition: [src/lib/audit-tools.ts](src/lib/audit-tools.ts). The server-only `get_audit_report` tool has a Zod `inputSchema` and an `execute` function. Input: `{ auditId: string }`, 1–64 lowercase letters, digits, or hyphens. Available IDs: `studio-north`, `field-notes`, `evergreen`. Unknown IDs throw `REPORT_NOT_FOUND`; no live website fetch occurs.

Return shape: `{ id: string, domain: string, score: number (0–100), pages: positive integer, issues: nonnegative integer, sample: true, findings: Array<{ title: string, detail: string, severity: 'High' | 'Medium' | 'Low', count: nonnegative integer, category: string }> }`. Shared finding examples are illustrative, not an exhaustive breakdown of each report total. Both input and output are runtime validated. [Browser-safe schemas and discriminated tool parts](src/lib/audit-tool-contract.ts) stay separate from server execution.

The AI SDK chooses and executes the tool server-side. One generation step returns the card without an unnecessary second model call; explanatory follow-ups receive the stored result as context. Typed SSE events update one stable card by call ID: dashed request skeleton (`input-streaming`), validated ID/loading panel (`input-available`), score and findings component (`output-available`), warm error panel with valid IDs and recovery instructions (`output-error`). A 200ms entrance and color transition respect reduced-motion preferences. Fast in-memory lookups can make intermediate states brief; they are driven by real SDK events, never fake timers. Stop interrupts the stream and labels unfinished lookups as interrupted. Browser history validates tool parts; successful results are included as untrusted conversation context for follow-ups. This read-only tool needs no action confirmation.

Verification: `npm test` covers tool validation/lookup, all four card states, stable-card updates, storage validation, stream translation, failed execution, and existing chat regressions. `npm run build` compiles strict TypeScript. [FE-07 submission instructions](docs/fe07/SUBMISSION.md).

## FE-08: Checkpoint 1 recovery

The primary /assistant flow now uses AI SDK `useChat` with a typed transport adapter, an Error recovery card, and `regenerate` for retrying only the failed reply. It preserves partial text after interrupted streams, prevents duplicate Retry requests, respects rate-limit waits, provides slow-response guidance and skeletons, validates tool data, and restores retryable failed conversations after reload. Route loading/error boundaries include recovery actions. Dynamic viewport units, safe-area padding, readable inputs, and 44px action targets improve small-screen use.

See the [failure inventory and sabotage instructions](docs/fe08/FAILURE-INVENTORY.md). The local-only proxy deliberately interrupts requests; Retry then contacts the real live Gemini service. Production exposes no fault-injection switch. Physical iPhone Safari testing remains unverified because no real device is available in this environment.

## Architecture

Next.js 16 App Router, strict TypeScript, React 19, Tailwind CSS 4 and shared design tokens in src/app/globals.css. Layouts/pages render as Server Components. Navigation, error recovery, and streaming chat use Client Components; provider calls and tool execution remain on the server.

## Environment and secrets

Copy .env.example to .env.local when configuring local overrides. The sample dashboard needs no secret; the assistant requires server-only GOOGLE_GENERATIVE_AI_API_KEY. NEXT_PUBLIC_APP_NAME is optional display text, never a secret. Real environment files, .next, .vercel, and node_modules are ignored. Set provider credentials in Vercel Production and Preview environments; never commit them or expose them to browser code.

## Deployment

Vercel settings: Framework **Next.js**, Root Directory **./**, Install **npm ci**, Build **npm run build**. Connect the existing Phantom-9786/ranklens GitHub repository and select codex/capstone-skeleton as the production branch. Other pushed branches should receive Git-connected previews.

[Deployment and verification record](docs/fe05/DEPLOYMENT.md) records the successful production deployment, live route checks, and an automatically built preview after pushing codex/deploy-check. Both the stable app and preview returned HTTP 200 without authentication. [Submission text](docs/fe05/SUBMISSION.md) is included for the assignment portal.

## Earlier submissions

- [FE-01 setup branch](https://github.com/Phantom-9786/ranklens/tree/codex/ranklens-setup)
- [FE-04 vague branch](https://github.com/Phantom-9786/ranklens/tree/codex/workflow-vague)
- [FE-04 precise branch and comparison](https://github.com/Phantom-9786/ranklens/tree/codex/workflow-precise)

The Next.js app continues the RankLens capstone. FocusBoard remains a separate standalone assignment.

## License

MIT. See LICENSE.
