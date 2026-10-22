# Product Requirements Document (PRD): MindRail Studio

> **Implementation Status:** All requirements in this PRD are currently **Specified (Not Yet Implemented)**. The repository is in its pre-code documentation phase (`v0.0.0-spec`). Implementation order is governed by [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=IMPLEMENTATION_PLAN.md).

## 1. Product Overview

**MindRail Studio** is a local-first, browser-based visual productivity and creation platform. It provides a **Shared Visual Canvas** paired with three specialized workspaces—**Developer**, **Video Creator**, and **Student**—allowing users to map architectures, plan video storyboards, and build interactive study systems without accounts, backends, or paid subscriptions.

## 2. Problems Being Solved

1. **Context Switching Between Visual Diagrams and Structured Details:** Users need to see high-level topology (system architecture, video flow, concept hierarchy) while editing deep node-level properties (code snippets, voice-over scripts, flashcards, task checklists) in one place.
2. **Lack of Local-First Ownership:** Users need a creative workspace that works offline after initial load, saves immediately to browser storage (`IndexedDB`), and exports clean, version-controlled `.mindrail.json` files.
3. **Pointer-Only Canvas Lockout:** Most infinite canvas applications cannot be operated with a keyboard or screen reader. MindRail Studio requires accessible keyboard alternatives for all canvas operations.

## 3. User Personas

| Persona | Role & Context | Goals | Pain Points |
| :--- | :--- | :--- | :--- |
| **Alex — Full-Stack Developer** | Independent engineer designing web & local-first systems | Map service/component architectures, attach code snippets and bug/task items to nodes, commit diagrams to Git | Cloud diagram tools require accounts; sticky-note boards lack structured code/task properties |
| **Maya — Video Creator & Editor** | YouTube tech/educational creator producing 8–20 min videos | Structure scripts into scenes, plan visual storyboards, track cumulative duration, and verify shot/SFX checklists | Spreadsheets hide visual flow; doc scripts make duration calculation and shot tracking tedious |
| **Sam — Computer Science Student** | University student studying complex technical subjects | Build visual concept mind maps, review embedded flashcards, track topic mastery, and run focused study timers | Mind maps, flashcard decks, and study checklists live in three disconnected apps |

## 4. Jobs To Be Done (JTBD)

- **JTBD-1 (Shared Canvas):** *When I have a complex set of ideas, I want to arrange typed nodes and connections spatially on a responsive canvas so I can see relationships and hierarchy clearly.*
- **JTBD-2 (Developer):** *When designing or debugging software, I want to link architecture nodes directly to workflow steps, code snippets, technical notes, and actionable bug/task items so my design and implementation plan stay synchronized.*
- **JTBD-3 (Video Creator):** *When planning a video production, I want to sequence storyboard scenes with scripts, voice-over notes, typography cues, shot framing, and scene durations so I know the exact pacing and production checklist before filming or editing.*
- **JTBD-4 (Student):** *When studying a subject, I want to organize concepts in a mind map, practice active recall with node flashcards, and track my revision checklist with a built-in study timer so I retain material effectively.*
- **JTBD-5 (Local Persistence & Portability):** *When working in the browser, I want my progress saved automatically on my device and easily exported to a portable file so I never lose work.*

## 5. Feature Prioritization Matrix (P0 / P1 / P2)

- **P0 (MVP Core — Phases 0, 1, 2, 3, and core Phase 4 slices):** Essential for a complete, usable, local-first product across the shared canvas and three workspaces.
- **P1 (Post-MVP Polish & Extended Workspace Tools — Late Phase 4 & Phase 5):** High-value workflow enhancements, rich exports (SVG/PNG/Markdown), and advanced workspace views.
- **P2 (Future Possibilities — Deferred):** Nice-to-have local productivity aids documented in [docs/ROADMAP.md](https://www.google.com/search?q=ROADMAP.md).

## 6. Functional Requirements & Observable Acceptance Criteria

All requirements below are currently **Not Implemented**.

### 6.1 Shared Visual Canvas (`FR-CANVAS`)

#### FR-CANVAS-01: Node Lifecycle (Create, Edit, Move, Resize, Duplicate, Delete) — **Priority: P0**
- **Description:** Users can create nodes on the canvas, edit their title and properties, drag or keyboard-nudge them to new coordinates, resize them within workspace bounds, duplicate them, and delete them.
- **Acceptance Criteria:**
  - Triggering "Add Node" via toolbar or shortcut (`N`) places a new node at the viewport center with sensible default dimensions and focuses its title or selects it.
  - Dragging a node with a pointer or moving a selected node with Arrow keys (`ArrowUp/Down/Left/Right`, `16px` grid step or `1px` fine step with `Alt`) updates its `(x, y)` coordinates in state.
  - Deleting a node (`Delete` or `Backspace`) removes both the node and any connected edges without leaving dangling edge references.
  - Duplicating a node (`Ctrl/Cmd + D`) creates a new node with a fresh UUID offset by `(24, 24)` pixels copying the source node's properties.

#### FR-CANVAS-02: Connecting Nodes (Edges) — **Priority: P0**
- **Description:** Users can create directed or undirected connections between source and target nodes, label connections, choose routing style (`bezier`, `orthogonal`, `straight`), and delete connections.
- **Acceptance Criteria:**
  - Dragging from a node's output port to another node's input port (or using the keyboard "Connect Node" action `C`) creates a valid `CanvasEdge`.
  - Self-loops (connecting a node to itself) and duplicate identical edges between the same source/target ports are prevented with clear feedback.
  - Selecting an edge allows editing its label, line style (`solid`, `dashed`), and arrow direction, or deleting it with `Delete`/`Backspace`.

#### FR-CANVAS-03: Viewport Zooming, Panning & Fit-to-View — **Priority: P0**
- **Description:** Users can pan across the infinite canvas and zoom smoothly between `15%` (`0.15x`) and `300%` (`3.0x`).
- **Acceptance Criteria:**
  - Spacebar+drag, middle-mouse drag, two-finger trackpad scroll, or keyboard panning (`WASD` / pan controls when canvas background is focused) pans the viewport.
  - Zoom controls (`+`, `-`, `Ctrl/Cmd + Wheel`, `Ctrl/Cmd + 0` reset to `100%`, `Shift + 1` fit all nodes in view) update zoom level smoothly and display the current percentage in the HUD.

#### FR-CANVAS-04: Multi-Selection & Bulk Operations — **Priority: P0**
- **Description:** Users can select multiple nodes/edges via marquee drag or `Shift + Click` to move, align, recolor, or delete them together.
- **Acceptance Criteria:**
  - Dragging a selection box on empty canvas selects all nodes intersecting the box.
  - `Ctrl/Cmd + A` selects all unlocked nodes in the active project.
  - Moving any node in a multi-selection moves all selected nodes by the same delta while preserving relative spacing.
  - Pressing `Escape` clears the current selection.

#### FR-CANVAS-05: Node Property Inspector (Labels, Colors, Categories, Descriptions) — **Priority: P0**
- **Description:** Selecting a single node opens the contextual Inspector panel to edit common properties (title, description, semantic color token, category tag, locked state) and workspace-specific fields.
- **Acceptance Criteria:**
  - Selecting a node displays its current properties in the right-hand Inspector panel within 1 frame.
  - Changing a semantic color role (`neutral`, `accent`, `info`, `success`, `warning`, `danger`, `purple`, `cyan`) updates the node's visual border/header styling immediately and meets WCAG AA text contrast.
  - Locking a node prevents accidental dragging, resizing, or deletion until unlocked.

#### FR-CANVAS-06: Undo and Redo History — **Priority: P0**
- **Description:** Users can undo and redo structural mutations to the project within the active editing session.
- **Acceptance Criteria:**
  - `Ctrl/Cmd + Z` undoes the last committed mutation (node add/move/edit/delete, edge add/edit/delete, bulk operation).
  - `Ctrl/Cmd + Shift + Z` (or `Ctrl/Cmd + Y`) redoes the undone mutation.
  - Dragging a node from point A to point B records a single history entry upon pointer release rather than flooding history with intermediate drag frames.
  - Undo/redo buttons in the toolbar accurately reflect whether history steps are available (`disabled` when stack is empty).

#### FR-CANVAS-07: Reusable Templates — **Priority: P0**
- **Description:** Users can start a project from built-in workspace templates or save their own current project structure as a reusable local template.
- **Acceptance Criteria:**
  - The Template Gallery provides at least 1 starter template per workspace (`Developer`: System Architecture & Task Flow; `Video Creator`: Multi-Scene Storyboard & Shot Plan; `Student`: Concept Mind Map & Flashcard Study Deck).
  - Creating a project from a template deep-clones all template nodes and edges with freshly generated UUIDs and current timestamps.
  - Users can save an existing project as a custom local template stored in `IndexedDB`.

### 6.2 Developer Workspace Requirements (`FR-DEV`)

#### FR-DEV-01: Software Architecture & Workflow Nodes — **Priority: P0**
- **Description:** Specialized node kinds for system architecture (`service`, `database`, `queue`, `client`, `external-api`, `workflow-step`) with environment/tech stack badges and port labels.
- **Acceptance Criteria:**
  - Users in a Developer Workspace can insert architecture nodes and specify service type, protocol/port label on edges (e.g., `HTTPS`, `gRPC`, `SQL`, `Event`), and status (`healthy`, `planned`, `deprecated`).

#### FR-DEV-02: Code Snippet & Technical Note Nodes — **Priority: P0**
- **Description:** Nodes that store formatted code snippets (with language tag and one-click copy) and structured technical notes.
- **Acceptance Criteria:**
  - A Code Snippet node stores `language` (e.g., `typescript`, `python`, `sql`, `json`, `bash`), `filePath` hint, and `code` text rendered in a monospace block with a working "Copy Code" button.
  - Technical Note nodes support structured plain/Markdown text for architectural decisions and specifications.

#### FR-DEV-03: Project Planning Boards & Bug/Task Tracking — **Priority: P0**
- **Description:** Task and bug tracking nodes (`task`, `bug`) with status (`backlog`, `todo`, `in-progress`, `review`, `done`), priority (`low`, `medium`, `high`, `critical`), and checklist subtasks, viewable both on the canvas and in a filterable Board/List companion drawer.
- **Acceptance Criteria:**
  - Users can create `task` and `bug` nodes, link them to the architecture component they affect, toggle their status/priority, and filter nodes on the canvas by task status or priority.

#### FR-DEV-04: Architecture Diagram Exports — **Priority: P1**
- **Description:** Export the Developer Workspace canvas as a standalone `.svg` or `.png` diagram in addition to `.mindrail.json`.
- **Acceptance Criteria:**
  - Clicking "Export Diagram (SVG)" generates a valid, self-contained `.svg` file reflecting current nodes, connections, and dark-theme colors without requiring an external server.

### 6.3 Video Creator Workspace Requirements (`FR-VID`)

#### FR-VID-01: Scene-by-Scene Storyboard & Script Nodes — **Priority: P0**
- **Description:** Specialized `scene` and `script-beat` nodes capturing scene number, visual framing description, spoken script/dialogue, voice-over notes, typography/motion-graphics callouts, and transition/SFX notes.
- **Acceptance Criteria:**
  - Each `scene` node displays its sequence index, framing type (`wide`, `medium`, `close-up`, `screen-recording`, `b-roll`, `motion-graphic`), script text, voice-over cue, on-screen text/typography note, and transition/SFX fields.

#### FR-VID-02: Timeline & Duration Planning — **Priority: P0**
- **Description:** Each storyboard scene includes an estimated duration in seconds (`durationSeconds`), and the workspace automatically calculates total project duration and cumulative scene timestamps along connected scene chains.
- **Acceptance Criteria:**
  - Setting `durationSeconds` on scene nodes automatically updates the workspace's cumulative runtime summary (`MM:SS`) and displays start/end timecodes (`00:00 - 00:45`) on sequenced scenes.

#### FR-VID-03: Shot Lists & Production Checklists — **Priority: P0**
- **Description:** Track shot readiness (`planned`, `filmed`, `edited`) and production checklist items (lighting, audio check, B-roll captured, captions verified, thumbnail drafted).
- **Acceptance Criteria:**
  - Users can toggle shot status and check off production checklist items per scene or project-wide, with progress (`e.g., 8/12 completed`) visible in the workspace header.

#### FR-VID-04: Storyboard Exports — **Priority: P1**
- **Description:** Export storyboard sequences and shot lists as a formatted Markdown production sheet (`.md`) or visual SVG/PNG storyboard overview, alongside `.mindrail.json`.
- **Acceptance Criteria:**
  - Exporting a Storyboard Sheet downloads a complete `.md` or `.svg` file containing ordered scenes, timecodes, scripts, VO notes, and checklist states.

### 6.4 Student Workspace Requirements (`FR-STU`)

#### FR-STU-01: Visual Mind Maps & Topic Notes — **Priority: P0**
- **Description:** Create central topic nodes and child concept nodes with quick keyboard sibling/child branching (`Tab` to create child concept, `Enter` to create sibling concept) and detailed topic notes.
- **Acceptance Criteria:**
  - Selecting a concept node in the Student Workspace and pressing `Tab` creates and connects a child concept node automatically positioned relative to the parent.
  - Each concept node supports rich study summary notes and mastery level tags (`new`, `learning`, `reviewing`, `mastered`).

#### FR-STU-02: Interactive Flashcards — **Priority: P0**
- **Description:** Flashcard nodes (`flashcard`) with `frontPrompt`, `backAnswer`, and local self-rating (`again`, `hard`, `good`, `easy`), plus a focused "Study Deck Mode" modal to flip through flashcards in the project.
- **Acceptance Criteria:**
  - Users can create flashcard nodes on the canvas or launch "Practice Flashcards" to step through all flashcards in the current project, flip cards (`Space`), rate recall confidence (`1`–`4`), and update local mastery counts.

#### FR-STU-03: Revision Checklists, Study Timer & Local Progress Tracking — **Priority: P0**
- **Description:** Built-in configurable focus/break timer (e.g., 25/5 Pomodoro or custom minutes), revision checklist items, and local study session counters stored in the project.
- **Acceptance Criteria:**
  - Users can start, pause, reset, and complete a local study timer inside the Student Workspace without leaving the canvas; completed sessions increment the project's local study time log.
  - Mastery distribution (% of nodes marked `mastered` vs `learning`) and checklist completion % are calculated and displayed locally.

#### FR-STU-04: Notes & Study Plan Exports — **Priority: P1**
- **Description:** Export topic notes, flashcards, and revision checklists as a clean Markdown study guide (`.md`) in addition to `.mindrail.json`.
- **Acceptance Criteria:**
  - Clicking "Export Study Guide (.md)" downloads a structured Markdown file containing all topic notes, Q&A flashcards, and revision checklist items.

### 6.5 Local Persistence Requirements (`FR-PERSIST`) — **Priority: P0**

- **Description:** Persist all projects locally in browser `IndexedDB` and lightweight UI preferences in `localStorage`.
- **Acceptance Criteria:**
  - Creating or editing a project saves changes locally to `IndexedDB` (`mindrail_studio_db`) automatically within 1.5 seconds of inactivity or immediately via `Ctrl/Cmd + S`.
  - Refreshing the browser tab restores the project library and the full state of any saved project (nodes, edges, viewport, workspace metadata).
  - The workspace header displays an explicit save status indicator (`Saved locally`, `Saving...`, `Unsaved changes`, or `Save failed — Export backup`).
  - Simulating an `IndexedDB` write failure or quota error displays a non-destructive error banner with a one-click `.mindrail.json` emergency export button.

### 6.6 Import and Export Requirements (`FR-IO`) — **Priority: P0**

- **Description:** Export projects to `.mindrail.json` and import `.mindrail.json` files safely with full schema validation.
- **Acceptance Criteria:**
  - Exporting a project downloads a valid UTF-8 `.mindrail.json` file matching [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=IMPORT_EXPORT_SPEC.md).
  - Importing a valid `.mindrail.json` file restores all nodes, connections, workspace settings, and metadata.
  - Importing a corrupted, truncated, oversized (>10 MB), or schema-invalid JSON file is rejected with a clear user-facing explanation of the validation error and **never** corrupts or overwrites any existing local project.
  - If an imported project shares the same `id` as an existing local project, the user is prompted to choose between **Import as New Copy** (generating a new project UUID) or **Replace Existing Project**.

## 7. Non-Functional Requirements (`NFR`)

| ID | Category | Requirement | Target / Reference |
| :--- | :--- | :--- | :--- |
| **NFR-01** | **Zero Backend & Privacy** | Zero outbound network requests for project storage, analytics, or telemetry; strict CSP blocking unauthorized external origins | [docs/LOCAL\_FIRST\_AND\_PRIVACY.md](https://www.google.com/search?q=LOCAL_FIRST_AND_PRIVACY.md), [SECURITY.md](https://www.google.com/search?q=../SECURITY.md) |
| **NFR-02** | **Performance** | Initial JS bundle ≤ 180 KB gzipped (target); 60fps interaction target for canvases with 200 nodes and 300 edges | [`docs/PERFORMANCE.md`](PERFORMANCE.md) |
| **NFR-03** | **Accessibility** | WCAG 2.1 AA contrast (≥ 4.5:1 body text, ≥ 3:1 UI graphics); 100% keyboard operability for canvas and dialogs; reduced-motion support | [docs/ACCESSIBILITY.md](https://www.google.com/search?q=ACCESSIBILITY.md) |
| **NFR-04** | **Responsive Behavior** | Desktop (`≥1024px`): full 3-pane layout; Tablet (`768px–1023px`): collapsible slide-over panels; Mobile (`<768px`): bottom sheet inspector + simplified node list/canvas view | [docs/INFORMATION\_ARCHITECTURE.md](https://www.google.com/search?q=INFORMATION_ARCHITECTURE.md), [docs/DESIGN\_SYSTEM.md](https://www.google.com/search?q=DESIGN_SYSTEM.md) |
| **NFR-05** | **Security** | All imported JSON validated and sanitized; zero `innerHTML`/`eval` usage; prototype pollution prevention | [SECURITY.md](https://www.google.com/search?q=../SECURITY.md) |
| **NFR-06** | **Browser Compatibility** | Latest 2 stable major versions of Chrome, Edge, Firefox, and Safari on desktop and mobile | [docs/TESTING\_STRATEGY.md](https://www.google.com/search?q=TESTING_STRATEGY.md) |

## 8. MVP Scope vs. Deferred Features

### MVP Scope (Phases 0–5 in [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=IMPLEMENTATION_PLAN.md))
- Landing page, Project Library, and Template Gallery.
- Shared Visual Canvas with node CRUD, edge connection, pan/zoom, multi-select, property inspector, undo/redo, and keyboard navigation.
- Local persistence in `IndexedDB` with autosave and quota error handling.
- Validated `.mindrail.json` export and import with conflict resolution.
- Essential node types and workspace panels for **Developer** (architecture, code snippet, task/bug), **Video Creator** (scene storyboard, duration roll-up, production checklist), and **Student** (mind map concept, flashcard deck mode, study timer, revision checklist).

### Deferred Features (Post-MVP)
- Automatic graph layout algorithms (e.g., Dagre/ELK hierarchical auto-layout).
- Multi-canvas tabs/sub-boards inside a single project.
- Custom user-defined node schemas and user-created CSS themes.
- Local folder synchronization via the experimental File System Access API (chromium-only enhancement).
