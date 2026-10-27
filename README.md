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

FE-01: repository and AI-assisted development workflow setup. Application scaffolding and deployment will follow in the capstone skeleton assignment.

## Getting started

Clone this repository and open it in your editor. Read [CLAUDE.md](CLAUDE.md) for the planned stack and development conventions.

This setup stage contains documentation only: there is no `package.json`, no dependency installation step, and no development server yet. Node.js and Git are installed and checked; their recorded versions are in the [FE-01 submission guide](docs/fe-01-submission.md). Runnable setup commands will be added alongside the application scaffold.

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
