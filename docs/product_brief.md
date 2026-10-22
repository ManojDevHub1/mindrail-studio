# Product Brief: MindRail Studio

> **Implementation Status:** Specification baseline (`v0.0.0-spec`). All features described in this brief define the target product direction and have not yet been implemented in code.

## 1. Product Vision

MindRail Studio aims to become the trusted, local-first visual thinking environment where developers, video creators, and students turn messy ideas into structured, visual work—instantly in the browser, with full ownership of their project files and zero dependence on cloud accounts or subscriptions.

## 2. Mission

Provide a fast, keyboard-accessible, dark-mode creative workspace built around a **Shared Visual Canvas** that adapts to software engineering, video production planning, and structured study while running 100% locally in the user's browser at zero monetary cost.

## 3. Problem Statement

Knowledge workers who think visually face two recurring obstacles:

1. **Workflow Fragmentation Across Disconnected Tools:**
   - A software engineer draws an architecture diagram on a generic whiteboard, tracks bugs in an issue list, and keeps code snippets in a separate scratchpad—losing the spatial and causal links between system design and implementation tasks.
   - A video editor writes a script in a text document, plans shots in a spreadsheet, and tracks voice-over or motion graphics cues in ad-hoc notes—making it difficult to see total video pacing and scene transitions at a glance.
   - A student creates mind maps in one app, flashcards in another, and revision checklists in a third—breaking the connection between high-level concept hierarchy and active recall practice.
2. **Cloud Friction, Account Walls, and Subscription Lock-In:**
   - Many modern visual workspace tools require mandatory sign-ups before a user can create a single node, store data exclusively in proprietary cloud databases, or restrict project exports and offline access.
   - Users working on sensitive technical architectures, unreleased creative scripts, or offline study environments need a tool that starts immediately and keeps files under their local control.

## 4. Intended Audience

MindRail Studio serves three primary user segments plus cross-disciplinary creators:

### A. Software Developers & System Architects
- Individual developers, open-source maintainers, systems engineers, and technical leads who need to map service architectures, model execution flows, organize reusable code snippets, and track implementation tasks alongside technical notes.

### B. Video Editors & Content Creators
- YouTube creators, short-form and long-form video editors, motion designers, and instructional video producers who need to organize scripts, map scene-by-scene storyboards, estimate cumulative timeline duration, and track shot lists and production checklists.

### C. Students & Self-Directed Learners
- University students, bootcamp learners, and independent researchers who build topic mind maps, test recall with flashcards, track revision checklists, and run focused study timer sessions.

### D. Cross-Disciplinary Designers & Creators
- Creators who combine technical building, video explanation, and continuous learning—for example, a developer recording a technical tutorial who needs an architecture diagram, a video storyboard, and structured notes within a consistent mental model.

## 5. Core User Needs

1. **Immediate Start:** Open the application and start placing nodes on a canvas or picking a template within seconds, without creating an account or configuring a server.
2. **Spatial + Structured Representation:** Position ideas freely in 2D space while attaching structured, domain-specific metadata (code blocks, scene durations, flashcard prompts, task statuses) to each node.
3. **Why a Shared Visual Canvas Provides Value Across User Groups:**
   - **Unified Spatial Primitives:** Whether a user is connecting microservices (`Service A -> Queue -> Service B`), sequencing video scenes (`Hook Scene -> Demo Scene -> CTA Scene`), or linking study concepts (`Operating Systems -> Virtual Memory -> Page Tables`), the underlying cognitive operation is identical: **typed nodes + directed edges + spatial grouping + structured inspector properties**.
   - **Zero Re-Learning Cost:** A user who learns keyboard shortcuts, panning, zooming, selection, undo/redo, and export in one workspace immediately masters all three workspaces.
   - **Cross-Workspace Composability:** A single unified data model ([docs/DATA\_MODEL.md](https://www.google.com/search?q=DATA_MODEL.md)) allows the engineering architecture to remain clean and maintainable while supporting specialized node types and workspace views.
4. **Reliable Local Persistence & File Portability:** Automatic local saving in the browser (`IndexedDB`) paired with human-readable, versioned `.mindrail.json` exports that can be backed up in Git, cloud drives, or local folders.

## 6. Value Proposition

- **For Developers:** An architecture diagrammer, workflow mapper, code snippet organizer, and task board in one local canvas that can be committed directly to a Git repository as a `.mindrail.json` or `.svg` file.
- **For Video Creators:** A visual pre-production studio that bridges scriptwriting, storyboarding, duration calculation, and production readiness checklists before opening heavy video editing software.
- **For Students:** An active study workspace that integrates mind mapping, flashcards, revision checklists, and study timers in one distraction-free environment.

## 7. Product Positioning

MindRail Studio sits at the intersection of **infinite visual canvases** and **domain-structured productivity workspaces**, distinguished by its strict **local-first, zero-backend, zero-cost** operating model.

Rather than competing as a heavyweight enterprise collaboration suite with cloud user management, MindRail Studio is positioned as a **personal, precision visual workbench**—comparable in spirit to local developer utilities and standalone creative tools that run directly in the browser.

## 8. Differentiation

1. **Domain-Aware Nodes Over Generic Sticky Notes:** Instead of offering only plain rectangles and text boxes, MindRail Studio provides typed nodes tailored to software architecture, video scenes, and study flashcards while keeping them on a unified canvas engine.
2. **100% Client-Side Execution:** No backend downtime, no account registration wall, no telemetry tracking, and no cloud storage limits imposed by a vendor server.
3. **Open, Versioned JSON File Format:** Projects export to documented `.mindrail.json` files ([docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=IMPORT_EXPORT_SPEC.md)) rather than opaque binary blobs.
4. **Keyboard-Accessible Canvas:** Built from day one so every canvas action works with keyboard navigation as well as pointer gestures ([docs/ACCESSIBILITY.md](https://www.google.com/search?q=ACCESSIBILITY.md)).

## 9. Product Principles

1. **Clarity Over Clutter:** High-contrast dark UI where user content (diagrams, storyboards, mind maps) is the visual hero, supported by restrained chrome.
2. **Local Ownership:** The user's browser storage and exported files are the sole source of truth.
3. **Deterministic Behavior:** Undo/redo, autosave, and import validation behave predictably and transparently communicate status.
4. **Progressive Specialization:** Start with a clean canvas; reveal workspace-specific inspectors, timers, or duration summaries contextually without overwhelming the screen.

## 10. Primary Use Cases

- **UC-1 (Developer):** Designing a client-side or microservice architecture diagram, attaching code snippets and implementation tasks to specific components, and exporting the diagram as SVG and `.mindrail.json`.
- **UC-2 (Video Creator):** Planning a 10-minute video by creating connected scene cards with script text, voice-over cues, shot framing, and per-scene duration Seconds, verifying total runtime, and checking off pre-production tasks.
- **UC-3 (Student):** Building a hierarchical mind map for an exam topic, converting key nodes into interactive flashcards for self-testing, running a 25-minute study timer, and marking revision checklist items complete.

## 11. Explicit Non-Goals

To preserve the zero-cost, zero-backend, local-first architecture and prevent scope creep, MindRail Studio explicitly **will not** build:

- Custom backend servers, cloud databases, or hosted APIs.
- User accounts, login/registration screens, OAuth flows, or team permission systems.
- Automatic multi-device cloud synchronization.
- Real-time multi-user cursor collaboration or live WebRTC/WebSocket co-editing.
- Paid AI generation integrations or features requiring user-supplied commercial API keys.
- Full non-linear video/audio timeline rendering or raw video file encoding (MindRail Studio is for **video planning and storyboarding**, not video rendering).
- IDE code execution or remote container sandboxes (Developer Workspace organizes architecture, tasks, and snippets—it does not execute arbitrary code).

## 12. Success Criteria

Because MindRail Studio strictly prohibits telemetry, product quality and success are evaluated through verifiable engineering and usability criteria:

1. **Zero-Friction Time-to-Canvas:** A user can launch the app, select a workspace or template, and create their first node in under 3 actions with zero network calls beyond initial static asset load.
2. **Data Integrity & Round-Trip Fidelity:** 100% of persisted project properties survive browser refreshes (`IndexedDB`) and `.mindrail.json` export/import round-trips without data loss or schema corruption.
3. **Interactive Responsiveness:** Canvas panning, zooming, and node dragging meet the performance budgets defined in [`docs/PERFORMANCE.md`](PERFORMANCE.md) (target 60fps for up to 200 nodes).
4. **Full Keyboard & WCAG AA Accessibility:** All core user journeys in [docs/UX\_FLOWS.md](https://www.google.com/search?q=UX_FLOWS.md) can be completed using only a keyboard, with zero critical automated axe-core violations.

## 13. Major Risks and Assumptions

| Risk / Assumption | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Browser storage eviction or user clearing site data** | Users could lose locally stored projects if they clear browser history/site data or use incognito mode | Display clear local-storage status indicators, prompt users to export `.mindrail.json` backups, and request `navigator.storage.persist()` where supported ([docs/LOCAL\_FIRST\_AND\_PRIVACY.md](https://www.google.com/search?q=LOCAL_FIRST_AND_PRIVACY.md)) |
| **Scope bloat across three specialized workspaces** | Building three entirely separate editors would triple maintenance effort | Architect 80%+ of functionality inside the Shared Visual Canvas (`src/canvas/`) and implement workspaces as typed node/inspector plugins (`src/workspaces/`) ([`docs/ARCHITECTURE.md`](ARCHITECTURE.md)) |
| **DOM performance degradation on large canvases** | Rendering hundreds of complex HTML nodes and SVG connections can cause layout thrashing | Separate transient drag state from React tree re-renders, use CSS `transform: translate3d(...)`, and implement viewport culling ([`docs/PERFORMANCE.md`](PERFORMANCE.md)) |
| **Untrusted `.mindrail.json` file imports** | Malformed or malicious JSON imports could crash the app or trigger XSS | Enforce strict schema validation, size limits, referential integrity checks, and escaped text rendering ([SECURITY.md](https://www.google.com/search?q=../SECURITY.md), [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=IMPORT_EXPORT_SPEC.md)) |
