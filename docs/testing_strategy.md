# Testing Strategy (`docs/TESTING_STRATEGY.md`)

> **Current Verification Status:** Fully Implemented and Verified (`v0.1.0-release`). 24 test suites passing, 170 automated tests passing, 0 TypeScript compiler errors, 0 ESLint warnings. All tests execute in ~5.6s via `npm test`.

## 1. Testing Philosophy & Toolchain Recommendations

Because MindRail Studio is a local-first application where the browser is both the runtime and the database, testing must prioritize **data integrity, state reducer determinism, import/export safety, and keyboard/pointer accessibility** over brittle snapshot tests.

### Recommended Open-Source Test Stack (To Be Configured in Phase 0)

| Layer | Recommended Tool | License | Purpose |
| :--- | :--- | :--- | :--- |
| **Test Runner & Assertions** | **Vitest** | MIT | Fast Vite-native test execution for unit, schema, persistence, and component tests |
| **DOM & Component Testing** | **React Testing Library (`@testing-library/react`, `@testing-library/user-event`)** | MIT | Interaction testing via accessible queries (`getByRole`, `getByLabelText`) |
| **IndexedDB Test Polyfill** | **`fake-indexeddb`** | Apache-2.0 | Deterministic in-memory `IndexedDB` implementation for fast Node/Vitest persistence tests |
| **Accessibility Auditing** | **`vitest-axe` / `@axe-core/playwright`** | MPL-2.0 / MIT | Automated WCAG 2.1 AA violation checks in component and E2E tests |
| **End-to-End Browser Testing** | **Playwright** | Apache-2.0 | Real browser verification across Chromium, Firefox, and WebKit, including real `IndexedDB` and file download/upload flows |

---

## 2. Test Layers & Required Coverage

### 2.1 Unit & Pure Domain Tests (`src/domain/__tests__/`)
- **Factories (`factories.test.ts`):** Verify `createProject`, `createNode`, and `createEdge` initialize valid defaults, distinct UUIDs, and accurate `schemaVersion: 1`.
- **Referential Integrity (`integrity.test.ts`):**
  - Reject self-loop edges (`sourceNodeId === targetNodeId`).
  - Reject duplicate identical edges between the same source/target ports.
  - Verify deleting a node automatically removes all incident edges.
- **Workspace Calculators (`calculators.test.ts`):**
  - Verify Video Creator duration roll-up (`MM:SS` formatting and cumulative start/end scene timecodes).
  - Verify Student flashcard mastery percentages and checklist completion counts.
  - Verify Developer task status/priority grouping counts.

### 2.2 Data-Model Validation & Security Tests (`src/import-export/__tests__/`)
- **Valid Inputs:** Verify valid Developer, Video Creator, and Student `.mindrail.json` fixtures pass validation cleanly.
- **Malformed & Malicious Inputs:**
  - Reject truncated JSON, binary data, and files exceeding `10 MB`.
  - Verify prototype pollution payloads containing `"__proto__"`, `"constructor"`, and `"prototype"` are stripped or rejected without mutating `Object.prototype`.
  - Reject negative dimensions, `NaN` or `Infinity` coordinates, and out-of-range zoom values.
  - Reject unsupported future `schemaVersion` numbers (e.g., `schemaVersion: 99`).
  - Verify unknown extraneous fields on nodes or projects are stripped during normalization.

### 2.3 Import / Export Round-Trip Tests (`src/import-export/__tests__/roundTrip.test.ts`)
- For each workspace type (`developer`, `video`, `student`), construct a kitchen-sink project containing every supported `WorkspaceNodePayload` variant, edge style, viewport setting, and checklist item:
  1. Serialize the project via `exportProjectJson(project)`.
  2. Parse and validate the resulting string via `validateProjectImport(jsonString)`.
  3. Assert deep structural equality between the original normalized `Project` and the re-imported `Project`.

### 2.4 Local Persistence Tests (`src/persistence/__tests__/`)
- Using `fake-indexeddb`:
  - Create, read, update, list (filtered by `workspaceType`), and delete projects in `mindrail_studio_db`.
  - Verify custom template saving and listing.
  - Simulate a `QuotaExceededError` rejection from `IndexedDB` and verify `projectRepository` returns a typed `StorageQuotaError` result without crashing or corrupting previous data.

### 2.5 Undo / Redo & State Reducer Tests (`src/state/__tests__/`)
- Verify `ADD_NODE`, `MOVE_NODES_COMMIT`, `UPDATE_NODE_PAYLOAD`, `DELETE_NODES`, `ADD_EDGE`, and `DELETE_EDGES` push entries onto `undoStack` and clear `redoStack`.
- Verify `UNDO` restores the exact prior `Project` snapshot and moves the entry to `redoStack`.
- Verify `REDO` reapplies the undone snapshot.
- Verify `undoStack` enforces the `MAX_HISTORY_DEPTH = 50` cap.
- Verify rapid text edits to the same node property within `1000ms` coalesce into a single history step.

### 2.6 Canvas Interaction & Keyboard Accessibility Tests (`src/canvas/__tests__/`)
- **Pointer Interactions:** Test node selection, `Shift + Click` multi-selection, marquee box selection, and node drag commit on `pointerup`.
- **Keyboard Interactions:**
  - Verify `N` creates and selects a node.
  - Verify `ArrowRight` / `ArrowDown` moves the selected node by `16px` (`1px` with `Alt`, `64px` with `Shift`).
  - Verify `C` enters keyboard connection mode, `Tab` selects target node, and `Enter` creates the connecting edge.
  - Verify `Delete` / `Backspace` deletes the selected node and its attached edges.
- **Accessibility Checks:** Run `axe` on rendered views and dialogs; verify focus trapping and `Escape` dismissal on `<dialog>` components.
- **Connection Selection & Deletion (`edgeSelectionAndDeletion.test.tsx`):**
  - Verify pointer clicks on 24px wide edge hit area select the connection and render the selection halo.
  - Verify edge selection opens the `EdgeInspector` with accurate source and target node summaries.
  - Verify `Delete` / `Backspace` removes the selected connection without deleting endpoint nodes.
  - Verify right-clicking an edge opens the `EdgeContextMenu` with Inspect, routing style change, and Delete actions.
  - Verify screen reader announcements via `aria-live="polite"` on edge deletion.

### 2.7 Template Catalogue & Workspace Tests
- **Template Catalogue (`templateCatalogue.test.ts`):** Validates all 45 built-in templates across 15 categories for schema compliance, node count ($\ge 4$), connection count ($\ge 3$), checklist items ($\ge 3$), and non-empty IDs.
- **Specialized Workspaces (`specializedWorkspaces.test.tsx`):** Verifies rendering of Developer, Video Creator, Student, and Freelance node renderers, creation palettes, and metrics bars.
- **Export Studio (`phase5ExportStudio.test.ts`):** Tests SVG diagram export bounds calculation, PNG rasterization canvas rendering, Markdown storyboard dialogue formatting, and study guide structure.
- **Study Timer (`phase5StudyTimer.test.tsx`):** Tests drift-free elapsed calculation, 25m focus / 5m break countdown, pause/resume, and project metadata session recording.
- **Product Excellence & Previews (`phase7ProductExcellence.test.tsx`):** Tests vector SVG structure previews, bounding box calculations, recents discovery filtering, complexity badge categories, filter resets, connection screen reader announcements, and pointer cancellation lifecycle safety.

### 2.8 Responsive UI & End-to-End Tests (`e2e/`)
- **Desktop (`1280×800`):** Full 4-zone studio layout, sidebar collapse/expand, and canvas interactions.
- **Tablet (`820×1180`) & Mobile (`390×844`):** Verify bottom action bar, bottom-sheet Inspector, and synchronized Outline/Card List View.

---

## 3. Acceptance-Test Scenarios for Critical User Journeys

Every release candidate must pass these 6 end-to-end acceptance scenarios:

1. **Scenario AT-01 (Cold Start to Persisted Reload):**
   - Launch `#/`, create a new Developer Workspace project, add 2 architecture nodes (`API Gateway`, `Postgres DB`), connect them with label `SQL`, add a Code Snippet node, wait for `Saved locally` indicator, reload the page (`page.reload()`), and assert all 3 nodes, 1 edge, and code snippet text are rendered accurately.
2. **Scenario AT-02 (Template Instantiation & Video Duration Roll-Up):**
   - Open `#/templates`, instantiate the Video Creator Storyboard template, edit Scene 1 duration to `30s` and Scene 2 duration to `45s`, and assert the workspace header displays `01:15` total duration.
3. **Scenario AT-03 (Student Mind Map, Flashcard Practice & Study Timer):**
   - Create a Student project, add a Root Topic node, press `Tab` to create a connected Child Concept node, create 2 Flashcard nodes, open Flashcard Practice mode, flip both cards (`Space`), rate confidence (`Good`), and assert local mastery metrics update.
4. **Scenario AT-04 (Lossless `.mindrail.json` Export and Re-Import):**
   - Export an active project to `.mindrail.json`, delete the project from `#/projects`, import the downloaded `.mindrail.json` file, and assert all nodes, edges, and settings are restored identically.
5. **Scenario AT-05 (Invalid Import Rejection & Existing Data Protection):**
   - With a valid project open, attempt to import a malformed JSON file and a `schemaVersion: 99` file; assert an actionable error message is displayed inside the Import Modal and the existing open project remains unchanged.
6. **Scenario AT-06 (Keyboard-Only Workflow):**
   - Using only keyboard events (`Tab`, `Enter`, `N`, `Arrow*`, `C`, `Ctrl+Z`, `Ctrl+Shift+Z`), create a project, add two nodes, move one node, connect them, undo, and redo.

---

## 4. Build, Browser Compatibility & Manual Verification Checklist

### Build & Static Analysis Gate
Before any phase in [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=IMPLEMENTATION_PLAN.md) is marked complete, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### Target Browser Compatibility Matrix
- **Chromium (Chrome / Edge):** Latest 2 stable desktop & Android versions.
- **Firefox:** Latest 2 stable desktop versions.
- **WebKit (Safari):** Latest 2 stable macOS & iOS versions.

### Manual Verification Protocol
When automated headless tests pass, perform a brief manual verification in `npm run preview`:
- Confirm dark-theme contrast and focus rings across all views.
- Confirm smooth 60fps feeling when panning and dragging nodes.
- Confirm browser DevTools Network tab shows **zero** unexpected external requests.
- Confirm `Application -> IndexedDB -> mindrail_studio_db` contains the expected project records.
