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

For the FE-04 exercise, run npm ci, npm run dev, npm run build, and npm test inside workflow-drill/. The common starter has a test harness but no feature tests yet. Do not claim an empty test run verifies behavior.
