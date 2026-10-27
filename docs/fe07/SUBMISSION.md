# FE-07 submission

Deliverable links (one per line):

https://ranklens-beta.vercel.app/assistant
https://github.com/Phantom-9786/ranklens/blob/codex/audit-tool-results/src/lib/audit-tools.ts

Notes:

Extended RankLens with a server-side get_audit_report tool using Zod input/output schemas and an execute function. Ask “Show the studio-north report” to see a real Gemini tool call returning a labelled sample score card and findings list. Ask “Look up the missing-report report” to exercise a real lookup failure with a recovery card. Typed parts render input-streaming, input-available, output-available, and output-error states. The README documents the tool contract. This is a read-only sample-library lookup, not a live website crawl.

Files: optional; the two links provide the requested deployed app and tool-definition file. Save the submission and check for the portal’s Submitted status. Saving these instructions in Git does not submit the portal form.
