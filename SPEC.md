# RankLens — capstone specification

## Audience and problem

Small website owners need to understand SEO findings and prioritize understandable improvements without navigating a large technical tool. RankLens presents website reports with severity, explanations, and actionable next steps.

## Staged scope

FE-05 delivers a deployed, routed Next.js foundation with labelled sample fixtures, shared layout/navigation, Tailwind/design tokens, a server-fetched health page, and safe environment configuration. Subsequent milestones add real interactions, a server-backed AI explanation route, tests, accessibility/performance improvements, and the final deployable capstone. A production crawler is not promised at this stage.

## Screens and routes

| Screen | Route | FE-05 state |
| --- | --- | --- |
| Overview | `/` | Sample summary, charts, project links |
| Audit library | `/audits` | Three clearly labelled sample reports |
| New audit | `/audits/new` | Disabled configuration placeholder; no network crawl |
| Report detail | `/audits/[id]` | Fixture report; unknown IDs return 404 |
| Workspace settings | `/settings` | Read-only defaults; editor planned |
| Audit assistant | `/assistant` | FE-06 live Gemini streaming conversation over fixture reports |
| Conversation API | `/api/chat` | Server-only AI SDK streamText, typed SSE, abort and timeout |
| System health | `/health` | Server-rendered public GitHub API data, failure fallback |
| Health API | `/api/health` | Real JSON fetch result; 200 or 503 |

## Architecture and boundaries

Next.js App Router, strict TypeScript, Tailwind CSS 4. Layouts and pages are Server Components; active navigation and error recovery are Client Components. Fixture data is isolated in src/lib/fixtures.ts. No credentials or user accounts are required. Future AI provider keys remain server-only; no provider secret may use NEXT_PUBLIC_.

## Acceptance criteria

- Every screen above is reachable through navigation or an in-page link.
- Next production build succeeds and the deployed URL loads publicly.
- Layout is checked at 375px and 1280px without page-level horizontal overflow.
- Health page displays actual fetched repository fields or an honest upstream error.
- Sample findings are never described as real scans.
- Git-connected hosting builds subsequent pushes; record a real deployment result rather than assuming integration is enabled.

Continue using the same RankLens repository and deployed app through later capstone milestones. Prior FE-01 and FE-04 branches remain preserved; FocusBoard remains the separate React practice assignment.
