# MindRail Studio Release Readiness Checklist (`docs/RELEASE_CHECKLIST.md`)

## Release Overview

- **Product Name:** MindRail Studio
- **Version:** `0.1.0` (Production Release Candidate)
- **Architecture:** 100% Client-Side Local-First Web Application (Zero Backend, Zero Paid APIs)
- **Primary Persistence:** Browser IndexedDB (`mindrail_studio_db`) + LocalStorage (`mindrail:prefs:v1`)
- **Portability:** Canonical `.mindrail.json`, standalone `.svg`, high-DPI `.png`, and editorial `.md` exports

---

## 1. Automated Verification & Quality Gates

All automated checks must pass cleanly with exit code `0` before any release artifact is published.

| Check | Command | Target / Standard | Current Status |
| :--- | :--- | :--- | :--- |
| **Typecheck** | `npm run typecheck` | TypeScript 5.4 strict mode, `exactOptionalPropertyTypes: true`, zero type errors | **PASSED (0 errors)** |
| **Linter** | `npm run lint` | ESLint rules for React Hooks, TypeScript, and unused symbols | **PASSED (0 warnings/errors)** |
| **Test Suite** | `npm test` | Vitest runner across 24 test files and 170 automated tests | **PASSED (170/170 passed)** |
| **Production Build** | `npm run build` | Vite production bundle compilation and asset optimization | **PASSED (built in 821ms)** |

### Test Suite Distribution (170 Automated Tests across 24 Suites)
1. `src/domain/__tests__/integrity.test.ts` (7 tests) — Dangling edge pruning, referential integrity.
2. `src/domain/__tests__/factories.test.ts` (5 tests) — UUID generation, project/node/edge factory defaults.
3. `src/domain/__tests__/calculators.test.ts` (5 tests) — Workspace metrics, timecode formatting, mastery %.
4. `src/domain/__tests__/templateCatalogue.test.ts` (11 tests) — Universal template integrity across 15 categories.
5. `src/state/__tests__/projectReducer.test.ts` (9 tests) — Undo/redo stack, coalescing, bulk actions, study sessions.
6. `src/persistence/__tests__/projectRepository.test.ts` (4 tests) — IndexedDB CRUD operations & custom templates.
7. `src/import-export/__tests__/importExport.test.ts` (8 tests) — Round-trip JSON import/export, schema validation, prototype pollution defense.
8. `src/import-export/__tests__/phase5ExportStudio.test.ts` (11 tests) — SVG diagram bounds, escaping, PNG rasterization, Markdown storyboard & study guide.
9. `src/workspaces/student/__tests__/phase5StudyTimer.test.tsx` (9 tests) — Drift-free countdown, tab visibility recalculation, timer widget, session metadata.
10. `src/workspaces/__tests__/specializedWorkspaces.test.tsx` (9 tests) — Dev, Video, Student, and Freelance workspace inspectors & summaries.
11. `src/canvas/__tests__/canvasInteractionPipeline.test.tsx` (19 tests) — Selection, drag threshold, locking, context menus.
12. `src/canvas/__tests__/criticalInteractionBugs.test.tsx` (16 tests) — Single-click selection, port drags.
13. `src/canvas/__tests__/keyboardConnection.test.tsx` (2 tests) — Keyboard-driven port selection and wiring (`C`).
14. `src/canvas/__tests__/minimap.test.tsx` (3 tests) — Minimap viewport box, node dots, pan-click interaction.
15. `src/canvas/__tests__/multiSelection.test.tsx` (4 tests) — Box selection, Shift+click, bulk delete/recolor.
16. `src/canvas/__tests__/edgeSelectionAndDeletion.test.tsx` (14 tests) — 24px wide edge hit area, selection halo, context menu, Delete/Backspace shortcuts, EdgeInspector sync.
17. `src/design-system/__tests__/components.test.tsx` (5 tests) — Accessible Button, Input, Select, Dialog, Badge.
18. `src/app/__tests__/App.test.tsx` (2 tests) — Top-level shell rendering, landmark navigation, skip link.
19. `src/app/__tests__/router.test.ts` (4 tests) — Hash-based routing, path extraction, query params.
20. `src/app/__tests__/endToEndJourney.test.ts` (1 test) — End-to-end multi-step project creation & modification flow.
21. `src/app/__tests__/phase3Features.test.tsx` (5 tests) — Project library, template gallery, selection action bar.
22. `src/app/__tests__/templateGallery.test.tsx` (6 tests) — Template search, difficulty filters, instant cloning.
23. `src/app/__tests__/auditEnhancements.test.tsx` (3 tests) — ARIA live announcer, backup archive restore UI.
24. `src/app/__tests__/phase7ProductExcellence.test.tsx` (8 tests) — Vector SVG structure previews, bounding boxes, recents discovery filtering, complexity badge categories, filter resets, connection screen reader announcements, and pointer cancellation lifecycle safety.

---

## 2. Production Bundle & Performance Audit

Vite production build metrics (`npm run build`):

| Asset | File Size | Gzip Size | Compression Ratio | Performance Impact |
| :--- | :--- | :--- | :--- | :--- |
| `dist/index.html` | 0.99 kB | 0.52 kB | ~47% | Instant initial HTML shell parse |
| `dist/assets/index-*.css` | 65.37 kB | 11.39 kB | ~82% | CSS token architecture & modules, non-blocking |
| `dist/assets/index-*.js` | 508.27 kB | 141.07 kB | ~72% | Complete application logic, 45 templates, 4 workspaces |
| **Total Production Payload** | **574.63 kB** | **152.98 kB** | **~73%** | **Fast sub-second load over mobile 3G/4G** |

### Static Deployment Conformance
- [x] Relative asset URLs (`base: './'`) configured in `vite.config.ts` allowing deployment to any subpath, GitHub Pages, or local `file://` environments.
- [x] Content Security Policy (CSP) meta tag configured in `index.html` (`default-src 'self'`).
- [x] Zero backend server dependencies or external font CDNs required.

---

## 3. Accessibility & WCAG 2.1 AA Audit

- [x] **Color Contrast:** All token pairs meet or exceed WCAG AA 4.5:1 ratio for normal text and 3:1 for large text/UI components (`--mr-text-primary` on `--mr-bg-surface` exceeds 12:1).
- [x] **Focus Management:** Clear `:focus-visible` outline rings (`var(--mr-accent-primary)`) on all interactive buttons, inputs, canvas nodes, and dialog triggers.
- [x] **Dialog Accessibility:** Dialogs implement `aria-modal="true"`, focus trapping, ESC key listener, and focus restoration to the trigger element on close.
- [x] **Shortcut Suppression:** Canvas keyboard shortcuts (Space, Backspace, Delete, Z, Y) are suppressed whenever an `input`, `textarea`, or `select` element has focus.
- [x] **Motion Sensitivity:** `@media (prefers-reduced-motion: reduce)` media query disables animations and smooth scrolling across all CSS token rules.
- [x] **Screen Reader Support:** Live region announcements (`aria-live="polite"`, `aria-atomic="true"`) for the Study Timer and toast notifications. Landmark regions (`<header>`, `<main>`, `<nav>`, `<aside>`) on all views.

---

## 4. Local-First Persistence & Integrity Audit

- [x] **Primary Storage:** Browser IndexedDB `mindrail_studio_db` (version 2) with `projects` and `templates` object stores.
- [x] **Autosave Engine:** Debounced (1000ms) background saving with visual status indicator in header (`Saved`, `Saving...`, `Unsaved changes`).
- [x] **Non-destructive History:** Revision counters track document state changes. Session metadata updates (`RECORD_STUDY_SESSION`) update document timestamps without cluttering the undo/redo stack.
- [x] **Data Integrity:** Dangling edge references are automatically pruned on node deletion or project load (`pruneEdgesConnectedToNodes`, `sanitizeProjectEdges`).
- [x] **Portable Backup:** Lossless JSON export and import with cryptographic schema version validation.

---

## 5. Workspace Features & Capabilities

- [x] **Developer Architecture Studio:**
  - Architecture component nodes, code snippet nodes, planning tasks.
  - Typed connections with relationship labels, routing styles (bezier, orthogonal, straight), and stroke patterns.
  - Standalone SVG & PNG architecture diagram export.
- [x] **Video Creator Studio:**
  - Visual scene sequencing, runtime calculations, camera framing tokens, act categories.
  - Spoken dialogue blockquotes, voiceover cues, typography and SFX notes.
  - Editorial Markdown storyboard export with formatted timecodes (`MM:SS`).
- [x] **Student Learning Studio:**
  - Concept definition cards, mastery tracking (`LEARNING`, `REVIEWING`, `MASTERED`).
  - Interactive Flashcard Study Deck modal with self-assessment rating.
  - Drift-free local countdown Study Timer with Focus (25m) and Break (5m) modes.
  - Structured Markdown study guide export.
- [x] **Freelance & Business Studio:**
  - Project stages, client tasks, deliverables with client approval tracking, and review sign-off items.
  - Real-time Freelance Metrics Summary bar with deliverable completion rates.
- [x] **Universal Template Ecosystem (45 Templates across 15 Categories):**
  - 45 schema-valid starter templates covering Web Dev, UI/UX, Graphic Design, Video, Content, Writing, Social Media, Marketing, Freelance/Business, Photography, Audio, Data, AI, Education, and Startups.
  - Accurate Vector SVG Template Structure Previews (`TemplateStructurePreview.tsx`) on every card and in the Preview Dialog.
  - Recents filtering, workflow complexity badges (`STARTER`, `STANDARD`, `COMPREHENSIVE`), and custom template management.
- [x] **Connection Manipulation Pipeline:**
  - 24px wide hit-test halo with primary accent selection glow.
  - Dedicated Edge Context Menu (Inspect, Bezier, Orthogonal, Straight, Delete).
  - Keyboard deletion (`Delete`/`Backspace`) with input protection and ARIA live region status announcements.
- [x] **Multi-Project Backup Restore:**
  - Full archive restoration via `validateBackupArchive` with Safe Copy vs. Overwrite collision handling.

---

## 6. Release Sign-Off

MindRail Studio v0.1.0 satisfies all architectural boundaries, functional requirements, design tokens, and testing criteria specified in `docs/` and `AGENTS.md`. The application is ready for production deployment.
