# RankLens project context

## Goal and stage

RankLens is a FlyRank Frontend AI Engineering capstone: an SEO audit dashboard for small website owners. FE-01 is preserved on codex/ranklens-setup. FE-04 uses a standalone React workflow exercise in workflow-drill/.

## Planned stack

React, TypeScript (strict mode), Vite, standard CSS, Vitest, React Testing Library, and Playwright. Use npm and commit package-lock.json when scaffolding begins.

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

## Rules learned in FE-04

- Audit website URLs must be trimmed and parsed with URL, allow only HTTP/HTTPS, require a hostname, and reject nonempty username/password; test credential-bearing and unsafe-scheme inputs.
- Persist audit preferences under a versioned key. Validate parsed storage field types and values before restoring; test corrupt JSON, blocked reads, and failed writes. Failed writes must never display success.
- Maximum pages must be an integer from 1 through 500. Test blank, 0, 501, fractional, and both boundary values before accepting settings changes.
- Invalid settings fields must expose aria-invalid and reference their inline error via aria-describedby; submission must focus the first invalid field. Test focus and error association, and clear stale success when any setting changes.
