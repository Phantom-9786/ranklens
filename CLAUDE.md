# RankLens project context

## Goal and stage

RankLens is a FlyRank Frontend AI Engineering capstone: an SEO audit dashboard for small website owners. The root application is the FE-05 Next.js skeleton on codex/capstone-skeleton. FE-01 and FE-04 are preserved on their submitted branches; workflow-drill/ holds the earlier exercise.

## Planned stack

Next.js App Router, React, TypeScript (strict mode), Tailwind CSS 4 and shared design tokens. Use npm with the committed root lockfile. Server Components by default; Client Components only for active navigation and error recovery. Future meaningful tests may use Vitest/Testing Library and Playwright.

## Development conventions

- Keep components small and use descriptive TypeScript types; avoid `any`.
- Use semantic HTML, explicit form labels, visible focus, and keyboard support.
- Support mobile and desktop layouts. Provide loading, empty, success, and error states.
- Treat audit results and external content as untrusted input.
- Keep secrets out of source and browser bundles; future AI provider calls belong on a server.
- Clearly label fixture data and generated suggestions. Do not claim a real audit occurred when using sample data.
- Review generated code, explain assumptions, and verify behavior before committing.
- Use Conventional Commits, such as `feat: add audit filters`, `fix: restore keyboard focus`, and `docs: explain setup`.
- Run relevant checks after implementation; never claim unrun tests passed.
- Ask before introducing paid services or destructive operations.

## Scope for later assignments

Start with fixture-based findings, severity filters, and an actionable report. Later add deployment, tests, accessibility checks, and a server-backed AI explanation feature as required by subsequent briefs.

## Current validation

For the FE-04 exercise, run npm ci, npm run dev, npm run build, and npm test inside workflow-drill/. Round one contains 3 feature tests; round two contains 25. Do not claim an empty test run verifies behavior.

For FE-05, run npm ci, npm run build and npm start at the repository root. Check every SPEC.md route and /api/health. Verify the layout at actual CSS widths 375px and 1280px. Keep .env.local, .vercel and .next ignored. No secret is required by the skeleton. Every fixture report must be labelled as sample data; new-audit controls remain disabled until connected functionality exists.

FE-06 adds /assistant and /api/chat. Run npm test and npm run build at root. AI config/prompt live in src/lib/ai-config.ts; GOOGLE_GENERATIVE_AI_API_KEY is server-only. Do not create a fake production model or stream fixture text as a real AI response. Stop must preserve partial text and allow an immediate new send; old request cleanup cannot reset a newer generation. Respect scroll-up while streaming and render incomplete model text as plain text rather than raw HTML/markdown. Protocol/provider mocks belong only in tests. Never print API keys or raw provider errors.

## Rules learned in FE-04

- Audit website URLs must be trimmed and parsed with URL, allow only HTTP/HTTPS, require a hostname, and reject nonempty username/password; test credential-bearing and unsafe-scheme inputs.
- Persist audit preferences under a versioned key. Validate parsed storage field types and values before restoring; test corrupt JSON, blocked reads, and failed writes. Failed writes must never display success.
- Maximum pages must be an integer from 1 through 500. Test blank, 0, 501, fractional, and both boundary values before accepting settings changes.
- Invalid settings fields must expose aria-invalid and reference their inline error via aria-describedby; submission must focus the first invalid field. Test focus and error association, and clear stale success when any setting changes.
