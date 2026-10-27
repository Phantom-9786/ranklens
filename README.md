# RankLens

A planned SEO audit dashboard for small website owners, built as my FlyRank Frontend AI Engineering capstone.

## Problem

Website owners need a clear way to understand SEO issues and decide which fixes to tackle first. RankLens will present audit findings with severity, plain-language explanations, and actionable next steps.

## Planned stack

- React and TypeScript with Vite
- CSS for responsive layouts and accessible components
- Vitest and React Testing Library for meaningful component tests
- Playwright for critical user journeys

## Status

FE-04: two runnable, independently generated audit-settings forms on separate branches. FE-01 remains preserved on `codex/ranklens-setup`. The main capstone dashboard and deployment will follow in later assignments.

## Getting started

Clone this repository and open it in your editor. Read [CLAUDE.md](CLAUDE.md) for the planned stack and development conventions.

Select `codex/workflow-vague` or `codex/workflow-precise`, then run:

```sh
cd workflow-drill
npm ci
npm run dev
```

Open the URL printed by Vite. Run `npm test` for feature tests and `npm run build` for the TypeScript check and production build. Node.js 24 was used. The form saves settings in this browser only; it does not crawl websites or run an audit.

## FE-04 workflow comparison

- [Vague branch](https://github.com/Phantom-9786/ranklens/tree/codex/workflow-vague): original one-sentence prompt output, 3 tests.
- [Precise branch](https://github.com/Phantom-9786/ranklens/tree/codex/workflow-precise): explicit requirements, guarded persistence, accessible validation, 25 tests.
- [WORKFLOW.md](WORKFLOW.md): 422-word comparison citing concrete diffs and an AI mistake caught in review.
- [Evidence and reproduction](docs/fe04/README.md): exact prompts, session records, commands, timing limits, and comparison instructions.

## Planned MVP acceptance criteria

- Show clearly labelled sample audit findings for a website.
- Filter findings by severity and display an accurate issue count.
- Explain each issue with an actionable recommendation.
- Provide accessible keyboard navigation and responsive layouts.
- Handle loading, empty, and error states without losing user context.
- Add an AI explanation feature later through a server endpoint, with a useful fallback when unavailable.

These are planned outcomes, not completed application features. A live crawler and real SEO scoring are outside the initial fixture-based MVP.

## AI-assisted development

Codex assisted with repository setup and a README critique. The critique and applied improvement are recorded in the [AI workflow log](docs/ai-workflow.md). Submission evidence and screenshot instructions are in the [FE-01 guide](docs/fe-01-submission.md).

## License

MIT. See [LICENSE](LICENSE).
