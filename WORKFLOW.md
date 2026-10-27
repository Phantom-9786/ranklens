# FE-04: vague versus precise prompting

## Experiment

I compared two independent Codex subagent sessions building RankLens audit settings from the same React/TypeScript starter, commit `f45cf14`. Round one received one sentence; round two received file references, behavioral examples, accessibility constraints, and an explore–plan–code–test instruction. Neither session saw the other's implementation. The branches are `codex/workflow-vague` and `codex/workflow-precise`. This exercise is settings-only; neither version performs an SEO audit.

## Correctness and specific differences

In `workflow-drill/src/App.tsx`, round one's `save()` checks the URL scheme and whether its hostname contains a dot. I caught a concrete AI mistake: this accepts `https://user:pass@example.com`, then writes the credential-bearing URL into local storage. Round two's `validate()` explicitly rejects `url.username` and `url.password`; its parameterized tests cover those cases. Round one's dot requirement also excludes localhost without explaining that policy.

Round one saves preferences but never reads them back. Round two adds `restore()`, validates parsed storage as unknown data, checks field types and values, and falls back safely after malformed JSON or blocked reads. Both versions catch failed writes and avoid claiming an audit ran. These shared strengths matter: the vague result was not deliberately weakened.

The versions also differ in scope. Round one invented frequency and optional checks and offers only three page-limit choices. Round two follows the specified URL, integer 1–500 page limit, and subdomain checkbox. Its tests cover blank, zero, fractional, excessive, and boundary inputs. This is evidence that explicit requirements constrain output, not proof that vague prompts always fail.

## Accessibility and edge cases

Both outputs have labels, keyboard-operable native controls, status feedback, and URL-error focus. However, round one's URL `aria-describedby` points only to help text; its actual error is not associated with that input. Round two links inline errors through `aria-describedby`, sets `aria-invalid`, and focuses the first invalid field through refs. Its tests verify error associations and focus. Automated DOM checks do not establish complete accessibility or visual quality.

## Verification and review effort

I reran both suites and production builds: round one passed 3 tests; round two passed 25. Both dev servers had HTTP-200 smoke checks. The precise session caught and removed an accidental empty CSS import and recovered from attempting `npm ci` before a lockfile existed. Its measured implementation/testing/review interval was 2m36s, including 21 seconds of final review. Round one's total elapsed time was not recorded, so no honest end-to-end speed comparison is possible. Its narrower tests required additional source review to identify credential and restore gaps. Detailed records preserve those timing limits. The learned rules now require credential rejection, validated persistence, and accessible validation tests.
