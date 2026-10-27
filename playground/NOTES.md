# FE-03: Custom patterns compared with shadcn/ui

## Scope and authorship

This is an AI-assisted reference implementation. The custom components were built directly in React/TypeScript without component libraries, then committed as `748fa20` before installing the shadcn components. Codex implemented and reviewed the code; this document does not claim the learner manually wrote it. Because the brief explicitly asks for a by-hand exercise, the learner should study and recreate the patterns themselves rather than represent this reference as unaided work.

## Sources used

- [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [W3C tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [W3C disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
- [shadcn Vite installation](https://ui.shadcn.com/docs/installation/vite)
- [shadcn Dialog](https://ui.shadcn.com/docs/components/dialog)
- [shadcn Tabs](https://ui.shadcn.com/docs/components/tabs)

## What the custom components handle

`src/components/Modal.tsx` uses the native dialog element with showModal(), which makes the surrounding document inert. aria-modal alone would not do that. It names/describes the dialog, initially focuses the title, explicitly wraps Tab/Shift+Tab, handles native Escape cancellation, locks body scrolling while open, and restores opener focus/previous scroll styling on close. Its trigger and close controls are real buttons.

`src/components/Tabs.tsx` implements a horizontal, left-to-right, automatic-activation tablist. The selected tab has tabIndex=0; the others have -1. Left/Right wrap; Home/End select the edges; Up/Down retain browser scrolling. Each tab/panel pair has unique linked IDs. Inactive panels are hidden, and the visible panel is keyboard focusable because its first meaningful content is static text.

`src/components/Disclosure.tsx` uses a native button with aria-expanded and aria-controls. Enter/Space work without duplicating browser button keyboard behavior. hidden removes collapsed content and its link from keyboard navigation.

## Concrete gaps found by reading generated and installed source

### 1. Dialog lifecycle and composition

In `src/components/ui/dialog.tsx`, DialogContent creates a DialogPortal, overlay and Radix Content, while DialogTrigger and DialogClose forward primitive props. It supports asChild composition and controlled state through the primitive root. My custom Modal bundles its own trigger and internal open state and offers no controlled-open or focus-lifecycle API.

I also read `node_modules/@radix-ui/react-dialog/dist/index.mjs`: Radix uses FocusScope, outside-pointer handling, hideOthers(), and onOpenAutoFocus/onCloseAutoFocus callbacks. The custom exercise relies on browser-native modal inertness and a small Tab boundary handler. It does not offer these customization hooks or a reusable policy for portaled/nested interactive layers. This is a concrete production-composition gap, not evidence that aria-modal by itself traps focus. Both demos satisfy their basic single-dialog keyboard flow.

### 2. Tab orientation, direction and disabled items

The generated `src/components/ui/tabs.tsx` forwards orientation and primitive props. The installed `node_modules/@radix-ui/react-tabs/dist/index.mjs` passes orientation and direction into RovingFocusGroup and marks disabled items non-focusable. My custom Tabs has only horizontal automatic activation and no disabled/RTL/vertical props.

The comparison demo demonstrates this gap: shadcn tabs are vertical and skip an Unavailable tab. Browser keyboard testing moved from First to Last with Down while skipping Unavailable. This requires different key mapping and candidate filtering than my modulo-based horizontal handler.

### 3. Manual activation is distinct from focus

Radix exposes activationMode; my implementation selects on focus unconditionally. In the shadcn manual demo, Down focused Last while First remained selected; Enter then selected Last. My custom version cannot represent that separation. This matters when switching panels triggers expensive loading: automatically activating on every arrow can make navigation slow. Local custom panels are immediate, so automatic activation is appropriate for this exercise.

## Verification and real limits

Ten Vitest/Testing Library tests pass. They check modal naming, initial focus, both wrap directions, cancellation/return focus, scroll restoration, tab sequence, arrow/Home/End behavior, unique IDs, empty tabs and disclosure keyboard toggling. The jsdom tests shim showModal/close; they do not prove native inertness or native Escape behavior, so those were supplemented with a real browser keyboard-only sequence. See KEYBOARD-CHECKS.md.

TypeScript compilation and the Vite production build pass. Component props use specific types and ReactNode/ComponentProps; there are no any escapes in their source. Vite emits non-blocking module-directive warnings for shadcn/Radix use-client directives, which are not used as a server/client boundary in this browser-only app. A build pass is not a full screen-reader or WCAG audit. The custom trap is designed for the fixed exercise content, not arbitrary dynamic menus, hidden ancestors, nested portals, or complex focus recovery when its opener is removed.

## Installation record

The official shadcn 4.22.2 CLI generated dialog.tsx and tabs.tsx. Its generated dialog also imports button.tsx, so that was generated with the CLI too. lucide-react and class-variance-authority were installed for those generated imports; the CLI added cn and radix-ui. The initial npx invocation failed because it propagated this machine's npm allow-scripts configuration into a nested install. Running the already downloaded CLI directly with Node succeeded without changing the global npm configuration or suppressing security checks.
