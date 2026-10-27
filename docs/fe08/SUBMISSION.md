# Checkpoint 1 / FE-08

Deliverable links (one per line):

https://ranklens-beta.vercel.app/assistant
https://github.com/Phantom-9786/ranklens/tree/codex/checkpoint-one/docs/fe08

Notes:

Checkpoint 1 extends RankLens with AI SDK useChat/regenerate recovery, a working per-message Retry, preserved partial replies, rate-limit countdowns, pending skeletons, useful empty states, and route error boundaries. The failure inventory and evidence folder document happy-path behavior and deliberate mid-stream/network/API failures. Retry replaces only the failed assistant reply and prevents duplicate requests. Report data is labelled as sample data; Gemini generation and server-side tool execution are real. Responsive checks cover phone and desktop widths; physical iPhone Safari validation remains outstanding.

Files: select screenshots/01-happy-path.png, screenshots/04-midstream-cut.png, and screenshots/06-rate-limit.png. Local fault-injection images are explicitly labelled; they use the production UI through a localhost proxy, not a fake production model. Optional 05-retry-recovered.png shows successful recovery. Then use the Portal’s Save submission action and confirm Submitted. This repository document does not submit the portal form.
