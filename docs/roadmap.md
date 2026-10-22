# Product Roadmap (`docs/ROADMAP.md`)

> **Implementation Status:** Horizon 1 (Phases 0–5) and Phase 6 are **Fully Implemented and Verified (`v0.1.0-release`)**. Items in Horizon 2 (Post-MVP) and Horizon 3 (Future Possibilities) are directional explorations for future local enhancements.

## 1. Roadmap Structure

This roadmap aligns directly with [docs/PRD.md](docs/prd.md) and [docs/IMPLEMENTATION_PLAN.md](docs/implementation_plan.md), separating work into four clear horizons:

1. **MVP & Universal Expansion (Completed — Phases 0 to 6):** The complete, self-contained local-first studio across the Shared Visual Canvas, four specialized workspaces (Developer, Video Creator, Student, Freelance), first-class connections, 45 universal templates, and backup restore.
2. **Post-MVP Enhancements:** High-value local workflow additions that build on the MVP foundation.
3. **Future Possibilities:** Longer-term explorations that remain strictly within the zero-cost, zero-backend, local-first boundary.
4. **Explicit Non-Goals:** Features that permanently fall outside the product vision.

---

## 2. Horizon 1: MVP Scope (Phases 0–5)

The MVP delivers a trustworthy, daily-usable visual workspace in the browser:

- **Foundation & Design System (Phase 0):**
  - React + TypeScript + Vite static application shell.
  - Dark creative workspace token system (`tokens.css`), accessible primitives, and hash routing.
- **Shared Visual Canvas Core (Phases 1–2):**
  - Create, inline-edit, drag, resize, duplicate, lock, and delete typed nodes.
  - Connect nodes with directed/undirected SVG edges (bezier, orthogonal, straight) and edge labels.
  - Smooth pan/zoom (`15%–300%`), fit-to-screen, multi-selection marquee, and Undo/Redo history stack.
  - Complete keyboard-only navigation and accessible connection mode (`C`).
- **Local Persistence & Portable Files (Phases 1–3):**
  - Automatic debounced saving to browser `IndexedDB` (`mindrail_studio_db`) with quota recovery banners.
  - Versioned `.mindrail.json` export and untrusted-input validated import with ID conflict resolution.
  - Public Landing View, Local Project Library (`#/projects`), Template Gallery (`#/templates`), and Settings (`#/settings`).
  - Responsive mobile/tablet support with synchronized Outline/Card List View.
- **Specialized Workspaces (Phases 4 & 6):**
  - **Developer Workspace:** Architecture nodes, workflow builders, code snippet cards with copy action, bug/task tracking cards with filter drawer, and technical notes.
  - **Video Creator Workspace:** Scene-by-scene storyboard cards, script beats, automatic cumulative timeline duration calculation (`MM:SS`), shot lists, VO/typography/SFX notes, and production checklists.
  - **Student Workspace:** Hierarchical mind maps (`Tab`/`Enter` branching), interactive flashcard nodes with Practice Deck mode, topic notes, revision checklists, and drift-free local study timer.
  - **Freelance & Business Workspace:** Project stages, client tasks, deliverables with approval tracking, and review items.
- **Visual & Summary Exports (Phase 5):**
  - Local browser export to `.svg` / `.png` diagrams and `.md` workspace summary sheets.
- **Universal Template Ecosystem & First-Class Connections (Phase 6):**
  - 45 curated starter templates across 15 professional categories.
  - "Save as Template" dialog into IndexedDB `custom_templates` and "My Templates" gallery tab.
  - 24px pointer hit testing halo, visible selection halo, Edge Context Menu, keyboard edge deletion (`Delete`/`Backspace`), and full undo/redo.
  - Full multi-project backup archive restore (`validateBackupArchive`) with duplicate conflict handling.

---

## 3. Horizon 2: Post-MVP Enhancements

Once the MVP is implemented and verified, the following enhancements are candidates for subsequent iterations (none are currently implemented or scheduled):

1. **Deterministic Auto-Layout Algorithms:**
   - One-click local graph layout helpers (hierarchical tree layout for Student mind maps, left-to-right pipeline alignment for Developer architectures, and grid/strip alignment for Video storyboards) implemented without external network calls.
2. **Canvas Frames / Swimlanes & Sub-Groups:**
   - Resizable visual container frames on the canvas that move child nodes together when dragged (e.g., `"AWS VPC Boundary"`, `"Act II — Deep Dive"`, or `"Week 3 Exam Topics"`).
3. **Project Snapshots & Local Version History:**
   - Named manual checkpoints stored in `IndexedDB` (`project_snapshots` store) allowing users to compare or revert to an earlier milestone of a project across browser sessions.
4. **Command Palette Quick-Insert DSL:**
   - Type `service: Auth API -> db: Users DB` inside the Command Palette (`Ctrl/Cmd + K`) to generate connected nodes rapidly from text.
5. **Printable Storyboard & Study Sheet Print Styles (`@media print`):**
   - High-contrast light-on-white `@media print` stylesheets for users who want to print Video storyboards or Student study guides directly via the browser's native Print-to-PDF dialog.

---

## 4. Horizon 3: Future Possibilities (Exploratory)

These ideas are recorded for future evaluation and carry no commitment:

- **Optional File System Access API Integration (Chromium Browsers):** Allow users on supported desktop browsers to bind a project directly to a local `.mindrail.json` file on disk for instant save-in-place without repeated download prompts, while keeping standard `Blob` download as the universal fallback.
- **Local-Only Static Bundle ZIP Export:** Export a project together with any locally attached reference images as a single `.mindrail.zip` archive processed entirely in browser memory.
- **User-Defined Node Templates:** Allow power users to define custom inspector field schemas for specialized personal workflows.

---

## 5. Explicit Non-Goals (Permanent Boundaries)

Consistent with [docs/PRODUCT\_BRIEF.md](https://www.google.com/search?q=PRODUCT_BRIEF.md) and [docs/decisions/ADR-0001-local-first-no-backend.md](https://www.google.com/search?q=decisions/ADR-0001-local-first-no-backend.md), MindRail Studio will **not** pursue:

- Custom backend servers, cloud databases, or hosted APIs.
- Mandatory or optional user accounts, login walls, or subscription tiers.
- Cloud-hosted real-time multi-user collaboration.
- Paid AI API integrations or features requiring commercial API keys.
- Heavy video/audio timeline encoding or remote code execution containers.
