# Interaction Lab — FE-03 accessibility playground

Standalone React/TypeScript practice folder. It is not a route or feature of the RankLens capstone.

## Run

```sh
cd playground
npm ci
npm run dev
npm test
npm run build
```

The dev command prints a local URL. Node.js 24 was used. Ten meaningful keyboard/semantics tests pass; production build includes strict TypeScript checking.

## Deliverables

- `src/components/Modal.tsx`: custom native modal, explicit focus wrap/return.
- `src/components/Tabs.tsx`: custom horizontal tabs, arrows/Home/End and roving focus.
- `src/components/Disclosure.tsx`: custom button-controlled disclosure.
- `src/components/ui/`: actual shadcn CLI-generated dialog, tabs and supporting button source.
- [NOTES.md](NOTES.md): source-based comparison with three concrete gaps.
- [KEYBOARD-CHECKS.md](KEYBOARD-CHECKS.md): observed real-browser keyboard sequence and limitations.

The custom components import React only; library primitives are confined to the separate comparison. Build warnings about use-client module directives are expected in a browser-only Vite application and do not fail compilation.

## Authorship

This repository contains an AI-assisted reference, not proof of unaided manual work. The brief asks the learner to build these by hand: read, understand and recreate the patterns yourself before representing that requirement as completed. Start with useId/ARIA relationships, the single tab stop, and the modal open/close/focus lifecycle.
