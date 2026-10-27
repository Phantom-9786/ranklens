# FE-04 evidence and reproduction

## Branches

- [Round one: vague prompt](https://github.com/Phantom-9786/ranklens/tree/codex/workflow-vague)
- [Round two: precise prompt](https://github.com/Phantom-9786/ranklens/tree/codex/workflow-precise)
- [Compare feature branches](https://github.com/Phantom-9786/ranklens/compare/codex/workflow-vague...codex/workflow-precise)

GitHub's compare page uses a merge-base view. For the exact final-tree comparison, use the two-ref git diff below.

## Run either version

From the repository root, select one branch, then:

```powershell
git switch codex/workflow-vague
# Or: git switch codex/workflow-precise
cd workflow-drill
npm ci
npm run dev
```

Open the local URL printed by Vite. Stop the server with Ctrl+C before switching branches. Branches may use different localStorage keys; the vague version does not restore stored preferences.

```powershell
npm test
npm run build
```

## Compare exact trees

From the repository root:

```powershell
git diff codex/workflow-vague codex/workflow-precise -- workflow-drill/src
```

- Vague feature commit: `353de5e`.
- Precise feature commit: `c73160a`.
- Shared starter: `f45cf14`.
- Round one: 3 passing tests; round two: 25 passing tests. Both production builds pass.
- Both dev server requests returned HTTP 200; no browser visual or complete accessibility audit is claimed.

## Session independence

The repository owner authorized separate subagents. Each round ran with no parent chat history, from the same starter, in a separate D: drive worktree. The coordinator prepared tooling only, reviewed results afterward, and preserved the vague implementation without fixing its shortcomings. Existing project rules remained visible in both rounds; this was a vague feature prompt, not a context-free model experiment. See round1-record.md and round2-record.md for actual commands and timing limitations, and prompts.md for the feature instructions.

## Submission notes

Completed the FE-04 AI-assisted workflow drill using two independent Codex sessions. Both runnable feature branches are pushed. WORKFLOW.md compares concrete validation, persistence, accessibility, and review differences and identifies a credential-handling mistake in round one. CLAUDE.md includes four concrete learned rules. This is a local settings demo, not a deployed capstone or real SEO audit.
