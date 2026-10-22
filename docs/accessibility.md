# Accessibility Specification (`docs/ACCESSIBILITY.md`)

> **Implementation Status:** Specified (Not Yet Implemented). Defines mandatory WCAG 2.1 Level AA and keyboard accessibility requirements for MindRail Studio.

An interactive visual canvas cannot rely exclusively on dragging with a mouse or trackpad. MindRail Studio is architected so that **every canvas, workspace, and dialog workflow has a complete, deterministic keyboard and assistive-technology equivalent**.

## 1. Semantic HTML Requirements

- **Landmarks:** Every screen must expose clear structural landmarks:
  - `<header role="banner">` for the Top Studio Header.
  - `<nav aria-label="Workspace Creation Tools">` for the Left Palette.
  - `<main id="main-content" aria-label="Workspace Canvas">` for the primary workspace area.
  - `<aside aria-label="Node Property Inspector">` for the Right Inspector Panel.
- **Skip Link:** Include a visually hidden **"Skip to Canvas / Main Content"** link as the first focusable element in the DOM that becomes visible on `:focus`.
- **Native Controls:** Use `<button type="button">` for all actions, `<a href="...">` for route navigation, and native `<input>`, `<select>`, `<textarea>`, and `<dialog>` elements. Never attach `onClick` handlers to non-interactive `<div>` or `<span>` elements without proper `role`, `tabIndex={0}`, and `onKeyDown` (`Enter`/`Space`) handling.

## 2. Keyboard Navigation & Canvas Keyboard Contract

All interactive regions must be reachable and operable via keyboard alone, with zero keyboard traps.

### 2.1 Global & Workspace Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Ctrl/Cmd + K` | Open Command Palette (search any action, node, or route) | Global |
| `?` (when not typing in an input) | Open Keyboard Shortcuts Reference Modal | Global |
| `N` | Create a new default node at viewport center and select it | Canvas Editor |
| `C` | Start keyboard connection mode from the currently selected node | Canvas Editor |
| `Tab` / `Shift + Tab` (inside Canvas region) | Cycle focus sequentially through canvas nodes in logical spatial/creation order | Canvas Editor |
| `ArrowUp / Down / Left / Right` | Move selected node(s) by `16px` (grid step) | Selected Node(s) |
| `Shift + ArrowUp / Down / Left / Right` | Move selected node(s) by `64px` (coarse step) | Selected Node(s) |
| `Alt + ArrowUp / Down / Left / Right` | Move selected node(s) by `1px` (fine step) | Selected Node(s) |
| `Enter` or `F2` (on focused node) | Open/focus the Node Title or Inspector Panel for editing | Selected Node |
| `Delete` or `Backspace` (when not in input) | Delete selected node(s) or selected edge(s) | Canvas Editor |
| `Ctrl/Cmd + D` | Duplicate selected node(s) | Canvas Editor |
| `Ctrl/Cmd + A` | Select all unlocked nodes on the canvas | Canvas Editor |
| `Ctrl/Cmd + Z` | Undo last action | Canvas Editor |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo last undone action | Canvas Editor |
| `Ctrl/Cmd + S` | Trigger immediate local save to `IndexedDB` | Canvas Editor |
| `=` / `+` and `-` | Zoom in / Zoom out on canvas | Canvas Editor |
| `Ctrl/Cmd + 0` | Reset canvas zoom to `100%` | Canvas Editor |
| `Shift + 1` | Fit all canvas nodes into viewport | Canvas Editor |
| `Escape` | Cancel pending connection, close active modal/popover, or clear selection | Global |

### 2.2 Accessible Alternatives for Pointer Canvas Interactions

Because traditional infinite canvases fail accessibility audits by rendering onto an opaque `<canvas>` element or requiring pointer drag-and-drop, MindRail Studio mandates three non-pointer mechanisms:

1. **DOM-Backed Hybrid Canvas Nodes:** Each node on the canvas is a real, focusable HTML container (`role="group"` or `<article>`) with an accessible name (`aria-label="Service Node: Auth API, connected to 2 nodes"`).
2. **Keyboard Connection Mode (`C`):**
   - Selecting Node A and pressing `C` enters **Connect Mode**.
   - An ARIA live region announces: `"Connect mode active from [Node A Title]. Use Tab or Arrow keys to choose a target node and press Enter to connect, or Escape to cancel."`
   - Pressing `Enter` on target Node B creates the connection without any mouse dragging.
3. **Structured Outline / List Companion View:**
   - Every workspace includes a toggleable **Outline / Card List View** that presents all nodes and their connections as a standard hierarchical HTML list/table. Screen-reader and mobile users can create nodes, edit properties, and manage connections entirely within this structured view while changes synchronize live with the 2D canvas.

## 3. Visible Focus Indicators

- Never suppress focus outlines (`outline: none`) without providing a high-contrast replacement on `:focus-visible`.
- All interactive controls and canvas nodes must display a minimum `2px solid var(--mr-border-focus)` (`#5E9EFF`) outline with `2px` offset (`outline-offset: 2px`), achieving at least `3.0:1` contrast against adjacent dark surfaces.

## 4. Accessible Names, Labels & Screen-Reader Feedback

- **Form Controls:** Every input in the Node Inspector, Project Library search bar, and Settings screen must have an explicit `<label htmlFor="...">` element.
- **Icon-Only Controls:** Toolbar buttons (Undo, Redo, Zoom In, Zoom Out, Fit View, Collapse Sidebar, Copy Code) must have descriptive `aria-label` attributes (e.g., `aria-label="Undo last change (Ctrl+Z)"`). Decorative SVG icons inside buttons must set `aria-hidden="true"` and `focusable="false"`.
- **ARIA Live Announcements (`aria-live`):**
  - Provide a polite live region (`<div aria-live="polite" aria-atomic="true" className="sr-only">`) for non-disruptive status updates: node created, node deleted, connection created, undo/redo executed, project saved locally, study timer completed.
  - Provide an assertive live region (`role="alert"`) for critical errors: `IndexedDB` storage quota exceeded, invalid `.mindrail.json` file import.

## 5. Dialog Focus Management

All modals (Import Project, Create from Template, Delete Confirmation, Flashcard Study Mode, Keyboard Shortcuts Reference) must:

1. Use the native `<dialog>` element (`showModal()`) or a verified focus-trap container with `role="dialog"` and `aria-modal="true"`.
2. Reference the modal title via `aria-labelledby` and summary text via `aria-describedby`.
3. Move initial keyboard focus to the primary safe interactive element inside the dialog upon opening.
4. Trap `Tab` and `Shift + Tab` strictly inside the open dialog.
5. Close cleanly on `Escape` (unless an active destructive confirmation requires explicit choice, in which case `Escape` maps to `Cancel`).
6. Restore focus to the exact trigger button that opened the dialog upon closing.

## 6. Form Validation and Error Messaging

- Never rely on browser-default native tooltips alone.
- When an input is invalid (e.g., empty required project title, negative video scene duration, malformed JSON import), set `aria-invalid="true"` on the input and associate the visible error message via `aria-describedby="<error-id>"`.

## 7. Color Contrast & Non-Color Status Indicators

- **Text Contrast:** Normal text (`< 18pt` / `< 14pt bold`) must maintain at least `4.5:1` contrast against its background surface. Large text and UI graphical boundaries must maintain at least `3.0:1` contrast (verified in [docs/DESIGN\_SYSTEM.md](https://www.google.com/search?q=DESIGN_SYSTEM.md)).
- **Non-Color Redundancy:** Never convey meaning through color alone:
  - *Node Categories & Workspaces:* Pair semantic colors with distinct icons and visible text badges (`Service`, `Bug`, `Scene 01`, `Mastered`).
  - *Save Status:* Pair status dot color with explicit text (`Saved locally`, `Unsaved changes`, `Save failed`) and distinct icons (checkmark, spinner, warning triangle).
  - *Connections:* Support dashed/dotted line patterns and text labels on edges in addition to stroke color.

## 8. Reduced Motion & Touch Target Considerations

- **Reduced Motion:** Respect `@media (prefers-reduced-motion: reduce)` and the in-app Reduced Motion toggle. Replace animated zoom/pan camera flights (`Fit to View`) with instant viewport jumps when reduced motion is active.
- **Touch Targets:** On mobile and tablet viewports (or coarse pointers `@media (pointer: coarse)`), all interactive buttons, node selection handles, and connection ports must provide a minimum hit target of **`44px × 44px`** (WCAG 2.5.5 / 2.5.8 alignment).

## 9. Accessibility Testing Requirements

Accessibility is verified through both automated and manual checks documented in [docs/TESTING\_STRATEGY.md](https://www.google.com/search?q=TESTING_STRATEGY.md):

1. **Automated Component & E2E Checks:** Run `vitest-axe` / `@axe-core/playwright` against every primary route (`#/`, `#/projects`, `#/templates`, `#/workspace/developer/:id`, `#/workspace/video/:id`, `#/workspace/student/:id`, `#/settings`) with zero serious or critical violations allowed.
2. **Manual Keyboard-Only Walkthrough:** Complete the core user flows (create project, add two nodes, connect them, edit inspector fields, undo/redo, export `.mindrail.json`) with the mouse/trackpad unplugged or untouched.
