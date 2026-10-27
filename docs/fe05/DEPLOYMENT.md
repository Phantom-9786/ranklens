# FE-05 deployment and verification

## Local implementation verified

- Root Next.js 16.4.3/React 19 application, TypeScript and Tailwind 4.
- Production build passed; overview, audit index, new-audit placeholder, all three sample reports, settings, health and health API returned HTTP 200.
- Unknown report /audits/does-not-exist returned HTTP 404.
- /api/health returned ok:true with actual public GitHub repository fields and a UTC request timestamp. Upstream errors are handled as 503 JSON; the page renders a readable error rather than fabricating data.
- Browser layout checked on every main screen at actual CSS viewport widths 375px and 1280px. Document width never exceeded viewport width. See responsive-checks.json and screenshots/.
- Mobile overview table was subsequently adapted to stacked rows to keep report links visible without horizontal scrolling.
- .env.example contains display configuration only; no secret is required. Environment files, node_modules, .next and .vercel are ignored.

## Vercel configuration

Import Phantom-9786/ranklens, production branch codex/capstone-skeleton, framework Next.js, root directory ./, npm ci, npm run build. The existing account is signed in to Vercel in the available browser. Do not create a duplicate repository or import workflow-drill as the app.

## Deployment evidence

Deployment and Git-push preview verification are pending until a real Vercel result is observed. This record will be updated with the actual URL and build result. Never submit localhost as the live preview URL.

## Initial production deployment observed

On 27 October 2026, Vercel reported “Deployed to Production” for the existing GitHub repository and codex/capstone-skeleton branch. Public domain: https://ranklens-beta.vercel.app . Initial immutable deployment: https://ranklens-r22ps04lb-event-ai-frontend.vercel.app . Framework Next.js, root ./, npm ci, npm run build. NEXT_PUBLIC_APP_NAME=RankLens was configured for Production and Preview; this is display text, not a credential.

The owner completed GitHub and Vercel email verification. Only RankLens was added to the existing selected-repositories GitHub App installation, preserving the prior EventAI selection.

This documentation change is pushed on codex/deploy-check to verify a real Git-triggered preview. Its result will be recorded after Vercel reports a successful build.
