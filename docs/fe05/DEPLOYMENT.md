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

Production deployment and Git-push preview automation have both been observed successfully. Use the URLs below; never submit localhost as the live preview URL.

## Initial production deployment observed

On 27 October 2026, Vercel reported “Deployed to Production” for the existing GitHub repository and codex/capstone-skeleton branch. Public domain: https://ranklens-beta.vercel.app . Initial immutable deployment: https://ranklens-r22ps04lb-event-ai-frontend.vercel.app . Framework Next.js, root ./, npm ci, npm run build. NEXT_PUBLIC_APP_NAME=RankLens was configured for Production and Preview; this is display text, not a credential.

The owner completed GitHub and Vercel email verification. Only RankLens was added to the existing selected-repositories GitHub App installation, preserving the prior EventAI selection.

The documentation change was pushed on codex/deploy-check to verify a real Git-triggered preview. Vercel automatically built commit b69b72d and reported Ready in the Preview environment in 12 seconds. No manual redeploy was used for this check.

## Verified URLs and automation

- Public stable app: https://ranklens-beta.vercel.app
- Git-connected branch preview: https://ranklens-git-codex-deploy-check-event-ai-frontend.vercel.app
- Immutable preview deployment: https://ranklens-cxpy55z2y-event-ai-frontend.vercel.app
- Preview build details: https://vercel.com/event-ai-frontend/ranklens/CGHKCPGb6HuW1ZLgGhk2DmuNMMHg
- GitHub commit status: Vercel success, “Deployment has completed”, for b69b72d.
- GitHub Actions build also passed: https://github.com/Phantom-9786/ranklens/actions/runs/40494726414
- Anonymous requests to both the stable app and branch preview returned HTTP 200; no access protection setting was changed.

Live overview, audit library, new-audit placeholder, sample report, settings, health page, and health API returned HTTP 200. Unknown report returned 404. The live health API returned ok:true and real Phantom-9786/ranklens fields. One transient transport reset while checking settings was retried successfully.

Vercel displayed two non-blocking warnings from its npm cache-dir environment option, once during installation and once during build. The application compiled successfully; there were no build errors and the dependency audit reported zero vulnerabilities.
