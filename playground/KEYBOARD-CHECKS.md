# Keyboard-only browser verification

27 October 2026, actual browser at http://127.0.0.1:5177/. All interaction steps below used key input, not mouse clicks. DOM/accessibility observations were used to verify focus and selection between key sequences.

| Sequence | Observed result |
| --- | --- |
| From initial page: Tab three times, Enter | Custom modal opens; focus is on its titled heading. |
| Shift+Tab from title | Focus moves to last control, Keep exploring. |
| Tab from last control | Focus wraps to Close custom dialog. |
| Escape | Modal closes; focus returns to Open custom dialog. |
| Tab from opener | Focus enters custom tablist on Overview. |
| Left | Focus and selection wrap to Focus, the last tab. |
| Right | Wrap back to Overview. |
| End, then Home | Select/focus last, then first tab. |
| Tab from tablist | Focus moves to the active tabpanel. |
| Tab, Enter | Disclosure trigger receives focus and expands its content. |
| Space | Disclosure collapses; its hidden link is skipped by subsequent Tab. |
| Tab, Enter | shadcn dialog opens, focusing Comparison name. |
| Escape, Tab, Down | Returns to shadcn opener, enters vertical tabs, skips disabled Unavailable, focuses Last while First remains selected. |
| Enter | Last becomes selected and its panel displays. |

Custom modal background controls were absent from the active accessibility tree while open. This supplements the HTML dialog modal behavior; it is not a screen-reader test. Automated tests also exercise reverse wrapping from the first tabbable control, multiple independent tab instances, and disclosure state/ID linkage.

## Learner check

The browser checks above were performed by Codex. Before claiming personal keyboard testing or by-hand implementation, perform the same sequence yourself and explain the difference between roving focus, selection, and activation. No personal check by the learner is claimed yet.

## Regression check after owner feedback

Owner-reported top-left positioning was corrected with explicit native-dialog centering. The browser reported a 1242×625 CSS-pixel viewport and a 510×331.56 dialog, with horizontal/vertical center error below 0.1 pixel. Saved evidence: docs/centered-dialog.png. The full custom-component key sequence above was rerun successfully after the CSS/heading change. The owner personally tried the modal; the remaining regression checks were performed by Codex at their request.
