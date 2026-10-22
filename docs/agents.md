# AI Coding Agent Instructions (`AGENTS.md`)

This document establishes repository-wide rules, architectural boundaries, and quality standards for all AI coding agents working on **MindRail Studio**.

Before writing code, modifying configuration, or updating docs, inspect the relevant specification files listed below.

## 1. Product Goals and Non-Negotiable Constraints

MindRail Studio is a **local-first visual productivity and creation platform** featuring a **Shared Visual Canvas** and three specialized workspaces (**Developer**, **Video Creator**, and **Student**).

Every line of code and documentation must respect five non-negotiable constraints:

1. **Zero-Cost Development & Operation:** Do not introduce paid libraries, commercial SDKs, paid fonts, or services requiring API keys or billing accounts.
2. **Zero Backend:** The application is 100% client-side. Never introduce custom backend servers, cloud databases, REST/GraphQL backend endpoints, mandatory authentication, or remote session state.
3. **Local-First Architecture:** All project state persists locally in the user's browser via `IndexedDB` (for structured project documents) and `localStorage` (for lightweight UI preferences), supplemented by user-initiated `.mindrail.json` file import/export. Never silently transmit user data over the network.
4. **Premium Dark Craftsmanship:** Follow [docs/DESIGN\_SYSTEM.md](https://www.google.com/search?q=docs/DESIGN_SYSTEM.md) and [docs/ACCESSIBILITY.md](https://www.google.com/search?q=docs/ACCESSIBILITY.md). Use CSS variables for all design tokens, maintain WCAG AA contrast ratios, support full keyboard navigation, and respect `prefers-reduced-motion`.
5. **Strict Truthfulness:** Never claim a feature is implemented, a test passed, a build succeeded, or a bug is fixed unless you have actually executed the verification command and inspected the result.

## 2. Source-of-Truth Documentation

Always consult the canonical specification before implementing or changing behavior:

| Domain | Canonical Document |
| :--- | :--- |
| Strategic Vision & Non-Goals | [docs/PRODUCT\_BRIEF.md](https://www.google.com/search?q=docs/PRODUCT_BRIEF.md) |
| Functional Requirements & Acceptance Criteria | [docs/PRD.md](https://www.google.com/search?q=docs/PRD.md) |
| Routes, Views & Navigation Structure | [docs/INFORMATION\_ARCHITECTURE.md](https://www.google.com/search?q=docs/INFORMATION_ARCHITECTURE.md) |
| Step-by-Step User Journeys & Error Flows | [docs/UX\_FLOWS.md](https://www.google.com/search?q=docs/UX_FLOWS.md) |
| Visual Tokens, Typography & Component Specs | [docs/DESIGN\_SYSTEM.md](https://www.google.com/search?q=docs/DESIGN_SYSTEM.md) |
| Keyboard Navigation, ARIA & WCAG AA Rules | [docs/ACCESSIBILITY.md](https://www.google.com/search?q=docs/ACCESSIBILITY.md) |
| System Layers, Folder Layout & Data Flow | [docs/ARCHITECTURE.md](https://www.google.com/search?q=docs/ARCHITECTURE.md) |
| Project, Node, Edge & Template TypeScript Schema | [docs/DATA\_MODEL.md](https://www.google.com/search?q=docs/DATA_MODEL.md) |
| IndexedDB Storage, Quotas & Privacy Guarantees | [docs/LOCAL\_FIRST\_AND\_PRIVACY.md](https://www.google.com/search?q=docs/LOCAL_FIRST_AND_PRIVACY.md) |
| `.mindrail.json` Format, Validation & Migrations | [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=docs/IMPORT_EXPORT_SPEC.md) |
| Editor State, Selection, Undo/Redo & Autosave | [docs/STATE\_MANAGEMENT.md](https://www.google.com/search?q=docs/STATE_MANAGEMENT.md) |
| Unit, Integration, A11y & E2E Testing | [docs/TESTING\_STRATEGY.md](https://www.google.com/search?q=docs/TESTING_STRATEGY.md) |
| Frame Budgets, Bundle Limits & Profiling | [docs/PERFORMANCE.md](https://www.google.com/search?q=docs/PERFORMANCE.md) |
| Static Build & Hosting Configuration | [docs/DEPLOYMENT.md](https://www.google.com/search?q=docs/DEPLOYMENT.md) |
| Phased Execution Order & Definitions of Done | [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=docs/IMPLEMENTATION_PLAN.md) |
| Licensing Constraints & Open Decisions | [docs/LICENSING.md](https://www.google.com/search?q=docs/LICENSING.md) |

## 3. Architecture Boundaries

Respect the unidirectional dependency flow defined in [docs/ARCHITECTURE.md](https://www.google.com/search?q=docs/ARCHITECTURE.md):

- **`src/domain/` (Pure Data & Validation):** Contains canonical TypeScript types, node/edge factories, referential integrity checks, and schema validators. Must have **zero** dependencies on React, DOM APIs, or `IndexedDB`.
- **`src/persistence/` (Local Storage Adapter):** Wraps `IndexedDB` and `localStorage`. Depends on `src/domain/`, never on React components.
- **`src/import-export/` (Serialization & Sanitization):** Parses, validates, migrates, and serializes `.mindrail.json` files and SVG/PNG/Markdown exports. Treats all external files as untrusted input.
- **`src/state/` (State & History Engine):** Manages document reducer, undo/redo command stack, transient viewport/selection state, and debounced autosave triggers.
- **`src/canvas/` (Shared Visual Canvas):** Renders the pan/zoom viewport, node containers, connection SVG paths, selection marquee, and keyboard handlers. Workspace-agnostic.
- **`src/workspaces/` (Workspace Plugins):** Defines specialized node renderers, inspectors, toolbars, and starter templates for `developer`, `video`, and `student` workspaces on top of the shared canvas contract.
- **`src/design-system/` (UI Primitives):** Reusable accessible UI components (`Button`, `Dialog`, `Popover`, `Toolbar`, `Toast`, `Input`) styled with CSS tokens.

## 4. Coding Conventions & TypeScript Requirements

- **Strict TypeScript:** Compile with `"strict": true`, `"noUncheckedIndexedAccess": true`, and `"exactOptionalPropertyTypes": true`.
- **No `any`:** Never use `any` or unsafe type assertions (`as unknown as T`) to silence compiler errors. Use discriminated unions and runtime type guards for unknown input (especially file imports and `IndexedDB` reads).
- **Deterministic IDs:** Use `crypto.randomUUID()` (or a deterministic test stub) for entity identifiers.
- **Immutability:** Treat all project, node, and edge state updates as immutable transformations so undo/redo snapshots remain corruption-free.
- **Modular Styles:** Use semantic CSS custom properties (`--mr-color-*`, `--mr-space-*`, `--mr-font-*`) defined in [docs/DESIGN\_SYSTEM.md](https://www.google.com/search?q=docs/DESIGN_SYSTEM.md). Never hardcode magic hex colors inside component files.

## 5. Component Design & Accessibility Principles

- **Semantic HTML First:** Use native `<button>`, `<input>`, `<dialog>`, `<nav>`, `<main>`, and `<section>` elements instead of clickable `<div>` elements.
- **No Mouse-Only Interactions:** Every canvas operation (creating nodes, selecting nodes, moving nodes on the grid, connecting nodes, editing properties, deleting nodes, zooming, panning) must have a complete keyboard equivalent as specified in [docs/ACCESSIBILITY.md](https://www.google.com/search?q=docs/ACCESSIBILITY.md).
- **Focus Management:** Maintain high-visibility focus rings (`:focus-visible`), trap focus properly inside modal dialogs, and restore focus to the trigger element when dialogs close.
- **Explicit States:** Every view and asynchronous operation must render explicit loading, empty, error, and success states. Never leave blank screens or silent failures.

## 6. Error Handling, Data Persistence & Import/Export Safety

- **Untrusted Input:** Treat every imported `.mindrail.json` file and every raw `IndexedDB` payload as untrusted. Validate against [docs/DATA\_MODEL.md](https://www.google.com/search?q=docs/DATA_MODEL.md) and [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=docs/IMPORT_EXPORT_SPEC.md) before mutating active application state.
- **Never Overwrite on Failed Import:** If an imported file fails parsing, schema validation, or integrity checks, preserve the user's current project untouched and display an actionable error report.
- **XSS Prevention:** Never render node titles, descriptions, code snippets, or imported metadata using `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, or `new Function()`.
- **Storage Quota Resilience:** Catch `QuotaExceededError` and `DOMException` during `IndexedDB` and `localStorage` writes. Notify the user immediately with an option to export their current project as `.mindrail.json` so zero work is lost.

## 7. Performance Constraints

- Keep transient pointer-move state (node drag deltas, pan offsets, marquee coordinates) isolated from full project history snapshots until pointer release (`pointerup`).
- Maintain smooth 60fps target responsiveness on canvases with up to 200 nodes and 300 connections by memoizing node components and culling off-screen decorations when needed.
- Schedule `IndexedDB` autosaves asynchronously (debounced, e.g., 800ms–1500ms after edit completion) with a synchronous `beforeunload` warning when unsaved changes exist.

## 8. Dependency Selection & Prohibited Services

- **Minimize Dependencies:** Prefer standard Web APIs (`IndexedDB`, `crypto.randomUUID`, `FileReader`, `Blob`, `URL.createObjectURL`, CSS variables, native `<dialog>`) over external npm packages whenever feasible.
- **License Gate:** Only add packages with permissive open-source licenses (`MIT`, `ISC`, `BSD-2-Clause`, `BSD-3-Clause`, `Apache-2.0`). Never install GPL/AGPL or commercial-only packages without explicit approval documented in [docs/LICENSING.md](https://www.google.com/search?q=docs/LICENSING.md).
- **Prohibited Dependencies:**
  - Backend BaaS SDKs (Firebase, Supabase, AWS Amplify, Clerk, Auth0)
  - Paid AI or cloud API SDKs (OpenAI, Anthropic SDK, commercial cloud rendering APIs)
  - Telemetry/analytics trackers (Google Analytics, Mixpanel, PostHog cloud, Sentry cloud)
  - Heavy UI frameworks that override the custom design system (Material UI, Ant Design, Bootstrap)

## 9. Testing & Verification Expectations

- Write unit tests for all domain logic, schema validators, migrations, and undo/redo reducers.
- Write round-trip tests verifying that any valid `Project` exported to `.mindrail.json` and re-imported produces an equivalent normalized `Project`.
- Verify keyboard accessibility and ARIA roles in component tests.
- **Honest Reporting:** Always run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` (once initialized in Phase 0) and report the actual terminal output. If a check cannot be run, explicitly state why.

## 10. Keeping Documentation Synchronized

Documentation is part of the codebase:

- When completing a phase or task in [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=docs/IMPLEMENTATION_PLAN.md), update the feature status table in [`README.md`](README.md), [docs/PRD.md](https://www.google.com/search?q=docs/PRD.md), and [`CHANGELOG.md`](CHANGELOG.md).
- When modifying any persisted field in `Project`, `CanvasNode`, or `CanvasEdge`, update [docs/DATA\_MODEL.md](https://www.google.com/search?q=docs/DATA_MODEL.md) and [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=docs/IMPORT_EXPORT_SPEC.md) in the same commit/change.
- When making a significant architectural trade-off, record a new ADR in `docs/decisions/`.
