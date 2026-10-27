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

See [SPEC.md](SPEC.md) for the screen inventory and staged scope. All audit findings are fixtures, not real crawl results. AI explanations and real audit execution are future milestones.

## Architecture

Next.js 16 App Router, strict TypeScript, React 19, Tailwind CSS 4 and shared design tokens in src/app/globals.css. Layouts/pages render as Server Components. Active navigation and error recovery are the only Client Components at this stage.

## Environment and secrets

Copy .env.example to .env.local only when configuring overrides. No secret is required for this skeleton. NEXT_PUBLIC_APP_NAME is optional display text, never a secret. Real environment files, .next, .vercel, and node_modules are ignored. Future AI provider keys must stay server-only in the hosting environment.

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
