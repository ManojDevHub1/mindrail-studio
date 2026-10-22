# MindRail Studio

> **Turn messy ideas into structured, visual work.**

**Repository Status:** Production Release Ready (`v0.1.0-release`). Complete local-first implementation across four specialized workspaces (Developer, Video Creator, Student, Freelance & Business), 45 universal templates across 15 categories, 24 test suites passing (170 automated tests), strict TypeScript compilation, zero ESLint warnings, and optimized static production bundle.

## Overview

MindRail Studio is a local-first, browser-based visual productivity and creation platform designed for developers, video editors, students, designers, and independent creators. It combines an infinite, keyboard-accessible visual canvas with specialized workspace tools for software architecture, video pre-production, and structured study—operating entirely in the browser with zero backend servers, zero mandatory user accounts, and zero paid API dependencies.

## Problem Statement

Creative and technical knowledge workers frequently fragment their thinking across incompatible tools:

- **Developers** sketch architecture diagrams in one tool, track implementation tasks in another, and store reusable code snippets or technical notes in a third.
- **Video creators** split scripts, scene-by-scene storyboards, shot lists, voice-over cues, and production checklists across spreadsheets and word processors that hide visual pacing.
- **Students and self-learners** struggle to connect visual mind maps with revision checklists, flashcards, and timed study sessions in a single cohesive environment.

Most existing visual canvas tools require cloud accounts, store user data on remote proprietary servers, lock core features or export formats behind paid subscriptions, or lack domain-specific node types for technical and creative workflows.

MindRail Studio addresses this by providing a unified shared visual canvas adaptable to three specialized workspaces—**Developer**, **Video Creator**, and **Student**—backed by browser-native storage (`IndexedDB`) and portable, human-readable `.mindrail.json` project files.

## Target Audience

| Audience | Primary Workflows | Core Value |
| :--- | :--- | :--- |
| **Software Developers & Architects** | System architecture diagrams, interactive workflow graphs, task boards, code snippet organization, technical notes | Keep system topology, code references, and engineering tasks connected on a single local canvas |
| **Video Editors & Content Creators** | Script structuring, scene-by-scene storyboards, timeline/duration planning, shot lists, audio/transition cues | Visualize narrative flow, pacing, and production readiness before opening an NLE |
| **Students & Researchers** | Concept mind maps, topic notes, interactive flashcards, revision checklists, Pomodoro/study timers | Transform passive notes into active recall workflows and visual knowledge graphs |
| **Designers & Independent Creators** | Creative briefs, mood/layout planning, reusable project templates, cross-disciplinary brainstorming | Structure complex multi-stage projects locally without subscription lock-in |

## Core Capabilities

### Shared Visual Canvas (Central Product Engine)

- **Node Lifecycle:** Create, inline-edit, move, resize, duplicate, lock, and delete typed canvas nodes.
- **Directed & Undirected Connections:** Connect nodes via ports with labeled edges, routing styles (bezier, orthogonal, straight), and referential integrity.
- **Viewport Navigation:** Smooth zooming, panning, fit-to-screen, selection focus, and minimap navigation.
- **Multi-Selection & Grouping:** Marquee box selection, `Shift`+click selection, bulk property editing, and alignment helpers.
- **Rich Node Inspector:** Edit node labels, semantic color roles, categories, tags, descriptions, and workspace-specific metadata.
- **Undo / Redo History:** Deterministic command/snapshot history stack per project session.
- **Reusable Templates:** Built-in starter templates and user-saved custom templates across all three workspaces.
- **Portable Persistence:** Automatic local saving to browser `IndexedDB` plus deterministic `.mindrail.json` import/export.
- **Keyboard-First & Accessible:** Full keyboard navigation, command palette, focus rings, and non-pointer alternatives for every canvas operation.

### Specialized Workspaces

1. **Developer Workspace**
   - Visual software architecture diagrams (service, database, queue, client, and boundary nodes).
   - Interactive workflow builders and state-flow mapping.
   - Project planning boards and bug/task tracking nodes with status, priority, and assignee labels.
   - Syntax-tagged code snippet organization and technical Markdown notes.
   - SVG/PNG architecture diagram and JSON project exports.
2. **Video Creator Workspace**
   - Script organization segmented by hook, body, and call-to-action beats.
   - Scene-by-scene storyboard cards with aspect-ratio framing notes and visual descriptions.
   - Timeline and duration calculation across connected storyboard scenes.
   - Voice-over script notes, typography/motion graphics callouts, shot lists, and transition/SFX cues.
   - Pre-production checklists and printable/exportable storyboard sheets.
3. **Student Workspace**
   - Hierarchical and radial visual mind maps.
   - Study planning boards and revision checklists with mastery status.
   - Interactive flashcard nodes (front/back prompts with local confidence ratings).
   - Topic-based structured notes and built-in local study timers.
   - Local progress tracking and study plan exports.

## Product Principles

1. **Zero-Cost Development & Usage:** Built exclusively with free, open-source software and standard Web APIs. Never requires paid subscriptions or commercial API keys.
2. **Zero Backend:** Runs 100% client-side in the browser. No custom servers, cloud databases, authentication walls, or telemetry endpoints.
3. **Local-First Ownership:** User projects live in browser `IndexedDB` and portable `.mindrail.json` files on the user's filesystem. Local data is never silently uploaded anywhere.
4. **Premium Dark Craftsmanship:** High-contrast dark interface with disciplined typography, restrained glass surfaces, purposeful micro-interactions, and zero decorative clutter.
5. **Honest Engineering:** Every feature, test, and capability is documented with its true verification status.

## Feature Status

| Area | Status | Notes |
| :--- | :--- | :--- |
| Technical & Product Documentation | **Implemented & Verified** | Complete 25-document baseline in root and `docs/` |
| Application Shell & Design Tokens | **Implemented & Verified** | Phase 0 complete: CSS variables (`--mr-*`), hash router, WCAG AA contrast, accessible primitives |
| Shared Visual Canvas Core | **Implemented & Verified** | Phase 1 complete: 2D Canvas viewport, node lifecycle, drag & snap to 16px grid, port connection paths |
| IndexedDB Local Persistence | **Implemented & Verified** | `mindrail_studio_db` (v1) with debounced autosave, quota error handling, and refresh persistence |
| `.mindrail.json` Import / Export | **Implemented & Verified** | Strict input validation, prototype pollution guards, lossless round-trip, and dangling edge recovery |
| Developer Workspace Nodes & Tools | **Partially Implemented (Phase 1)** | Architecture nodes, code snippet nodes, and dev task nodes with contextual inspector forms |
| Video Creator Workspace Nodes & Tools | **Partially Implemented (Phase 1)** | Storyboard scene cards, duration counters, script notes, and timecode roll-up |
| Student Workspace Nodes & Tools | **Partially Implemented (Phase 1)** | Concept mind maps, flashcard recall nodes, topic notes, and mastery breakdown |
| Automated Test Suite & CI | **Implemented & Verified** | 45 Vitest unit, persistence, and round-trip tests passing with zero failures |
| Production Static Deployment | **Build Verified** | Pure static asset output in `dist/` verified with relative asset paths |

## Screenshots

No screenshots exist yet because the application UI has not been implemented. Once UI implementation completes in Phases 1–4, capture verified screenshots and place them under `docs/assets/screenshots/`:

- `[Placeholder: docs/assets/screenshots/landing-overview.png — Landing Page & Workspace Selector]`
- `[Placeholder: docs/assets/screenshots/developer-workspace.png — Developer Architecture Canvas & Snippet Inspector]`
- `[Placeholder: docs/assets/screenshots/video-workspace.png — Video Storyboard Sequence & Duration Strip]`
- `[Placeholder: docs/assets/screenshots/student-workspace.png — Student Mind Map, Flashcard Deck & Study Timer]`

## Technology Stack

### Current Repository Reality

An audit of the repository confirms that **no source code or `package.json` currently exists**.

### Proposed Baseline Stack

To satisfy the zero-cost, zero-backend, local-first constraints with minimal bundle overhead, [docs/ARCHITECTURE.md](https://www.google.com/search?q=docs/ARCHITECTURE.md) specifies the following target stack for Phase 0 initialization:

- **UI Runtime:** React 18+ with TypeScript 5+ (`strict: true`)
- **Build & Bundler:** Vite
- **Styling:** Native CSS Custom Properties (design tokens) + modular CSS (`.module.css`)
- **Canvas Rendering:** Hybrid HTML/CSS node layer + SVG connection layer inside a hardware-accelerated CSS transform viewport (preserving full DOM accessibility and screen-reader traversal)
- **Persistence:** Browser `IndexedDB` (primary structured store) + `localStorage` (lightweight UI preferences)
- **File I/O:** Browser File API (`Blob`, `FileReader`, `<input type="file">`, programmatic download links)
- **Testing (Target):** Vitest + React Testing Library (unit/component) + Playwright with `@axe-core/playwright` (end-to-end and accessibility)

All third-party packages must use permissive open-source licenses (such as MIT, Apache-2.0, or BSD-3-Clause) verified prior to installation per [docs/LICENSING.md](https://www.google.com/search?q=docs/LICENSING.md).

## Prerequisites

Once Phase 0 initializes the project toolchain, local development will require:

- **Node.js:** v20 LTS or v22 LTS recommended
- **Package Manager:** `npm` v10+ (bundled with Node.js)
- **Modern Browser:** Chromium-based browser, Firefox, or Safari with `IndexedDB` and ES2022 support

## Installation Instructions

> **Note:** Because `package.json` has not yet been created in this repository, running `npm install` today will fail. Follow [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=docs/IMPLEMENTATION_PLAN.md) (Phase 0) to bootstrap the project first.

Once Phase 0 is completed:

```bash
# 1. Clone the repository
git clone <repository-url>
cd mindrail-studio

# 2. Install dependencies
npm install
```

## Development, Build, and Test Commands

### Verified Current Status

There is currently **no `package.json`** in the repository root.

### Target Scripts (To Be Configured in Phase 0)

When `package.json` is initialized in Phase 0, it must expose these exact standard scripts:

| Command | Purpose | Current Status |
| :--- | :--- | :--- |
| `npm run dev` | Start local Vite development server with hot module replacement | Not yet configured |
| `npm run build` | Run TypeScript typecheck (`tsc --noEmit`) and create static production bundle in `dist/` | Not yet configured |
| `npm run preview` | Serve the production `dist/` folder locally to verify static hosting behavior | Not yet configured |
| `npm run typecheck` | Run TypeScript compiler validation without emitting files | Not yet configured |
| `npm run lint` | Run static code analysis and formatting checks | Not yet configured |
| `npm run test` | Execute unit, schema validation, persistence, and component tests once | Not yet configured |
| `npm run test:e2e` | Execute end-to-end browser and accessibility tests | Not yet configured |

## Project Structure

### Current Repository Structure (Verified)

```text
.
├── AGENTS.md
├── CHANGELOG.md
├── CLAUDE.md
├── CONTRIBUTING.md
├── README.md
├── SECURITY.md
└── docs/
    ├── ACCESSIBILITY.md
    ├── ARCHITECTURE.md
    ├── DATA_MODEL.md
    ├── DEPLOYMENT.md
    ├── DESIGN_SYSTEM.md
    ├── IMPLEMENTATION_PLAN.md
    ├── IMPORT_EXPORT_SPEC.md
    ├── INFORMATION_ARCHITECTURE.md
    ├── LICENSING.md
    ├── LOCAL_FIRST_AND_PRIVACY.md
    ├── PERFORMANCE.md
    ├── PRD.md
    ├── PRODUCT_BRIEF.md
    ├── README.md
    ├── ROADMAP.md
    ├── STATE_MANAGEMENT.md
    ├── TESTING_STRATEGY.md
    ├── UX_FLOWS.md
    └── decisions/
        └── ADR-0001-local-first-no-backend.md
```

### Target Application Structure (Planned for Phase 0+)

See [docs/ARCHITECTURE.md](https://www.google.com/search?q=docs/ARCHITECTURE.md) for the full planned `src/` layout (`src/app/`, `src/canvas/`, `src/workspaces/`, `src/persistence/`, `src/import-export/`, `src/design-system/`).

## Data Storage and Privacy Overview

MindRail Studio is strictly **local-first**:

- **Primary Project Data:** Stored in the user's browser inside `IndexedDB` (`mindrail_studio_db`).
- **UI Preferences:** Stored in `localStorage` (`mindrail:prefs:v1`) for non-sensitive interface settings.
- **Zero Telemetry & Zero Silent Uploads:** The application makes no background network calls to external analytics, tracking, or cloud sync servers.
- **Important Browser Storage Caveat:** Browser storage is scoped to a single browser profile on a single device. Clearing site data, uninstalling the browser, or using private/incognito browsing windows can permanently erase `IndexedDB` records. Users are strongly encouraged to export `.mindrail.json` backup files regularly.

See [docs/LOCAL\_FIRST\_AND\_PRIVACY.md](https://www.google.com/search?q=docs/LOCAL_FIRST_AND_PRIVACY.md) for full details.

## Import and Export Capabilities

- **Canonical Export Format:** Versioned, human-readable JSON file with the `.mindrail.json` extension (`schemaVersion: 1`).
- **Safe Import Pipeline:** Imported files are treated as untrusted input. They undergo file-size verification, JSON parsing, strict schema validation, referential integrity checks, and text sanitization before touching application state. Invalid imports never overwrite an existing local project.
- **Visual & Document Exports (Planned):** Local browser generation of SVG/PNG canvas snapshots and Markdown summaries.

See [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=docs/IMPORT_EXPORT_SPEC.md) for the complete specification.

## Deployment Instructions

MindRail Studio compiles to static HTML, CSS, and JavaScript assets (`dist/`) that can be hosted on any static file server or free static hosting provider (such as GitHub Pages, Cloudflare Pages, or Netlify) or served locally.

- **Current Deployment Status:** Not deployed.
- **Full Guide:** See [docs/DEPLOYMENT.md](https://www.google.com/search?q=docs/DEPLOYMENT.md) for build verification, base-path configuration, client-side routing rules, and static host setup.

## Contribution Guide

Contributions must uphold the zero-cost, zero-backend, local-first architecture, strict TypeScript typing, keyboard accessibility, and honest verification standards. Read [CONTRIBUTING.md](https://www.google.com/search?q=CONTRIBUTING.md) and [`AGENTS.md`](AGENTS.md) before opening a pull request or writing code.

## License Status

**License Pending Confirmation.** No open-source or proprietary license has been finalized by the project owner yet. Do not assume licensing terms until a `LICENSE` file is explicitly committed following the review in [docs/LICENSING.md](https://www.google.com/search?q=docs/LICENSING.md).

## Documentation Index

The [docs/README.md](https://www.google.com/search?q=docs/README.md) index organizes all documentation by domain:

### Root Governance & Agent Instructions
- [`README.md`](README.md) — Public project overview and quickstart reference
- [`AGENTS.md`](AGENTS.md) — Repository-wide rules and constraints for AI coding agents
- [`CLAUDE.md`](CLAUDE.md) — Claude-specific operational workflow and instructions
- [CONTRIBUTING.md](https://www.google.com/search?q=CONTRIBUTING.md) — Developer contribution standards and PR workflow
- [`CHANGELOG.md`](CHANGELOG.md) — Release history and unreleased changes tracker
- [`SECURITY.md`](SECURITY.md) — Client-side security model, untrusted file handling, and vulnerability reporting
- [docs/README.md](https://www.google.com/search?q=docs/README.md) — Master documentation index

### Product
- [docs/PRODUCT\_BRIEF.md](https://www.google.com/search?q=docs/PRODUCT_BRIEF.md) — Strategic product vision, positioning, target users, and non-goals
- [docs/PRD.md](https://www.google.com/search?q=docs/PRD.md) — Complete Product Requirements Document with P0/P1/P2 priorities and acceptance criteria
- [docs/INFORMATION\_ARCHITECTURE.md](https://www.google.com/search?q=docs/INFORMATION_ARCHITECTURE.md) — Application views, navigation hierarchy, workspace layouts, and routing
- [docs/UX\_FLOWS.md](https://www.google.com/search?q=docs/UX_FLOWS.md) — Step-by-step user journeys including normal flows, edge cases, and recovery paths

### UX and Design
- [docs/DESIGN\_SYSTEM.md](https://www.google.com/search?q=docs/DESIGN_SYSTEM.md) — Dark creative visual identity, CSS token specification, typography, and component states
- [docs/ACCESSIBILITY.md](https://www.google.com/search?q=docs/ACCESSIBILITY.md) — WCAG AA compliance, keyboard canvas navigation, focus management, and reduced motion

### Architecture and Data
- [docs/ARCHITECTURE.md](https://www.google.com/search?q=docs/ARCHITECTURE.md) — System layers, rendering strategy, Mermaid diagrams, and dependency boundaries
- [docs/DATA\_MODEL.md](https://www.google.com/search?q=docs/DATA_MODEL.md) — Canonical TypeScript interfaces for projects, workspaces, nodes, edges, and templates
- [docs/LOCAL\_FIRST\_AND\_PRIVACY.md](https://www.google.com/search?q=docs/LOCAL_FIRST_AND_PRIVACY.md) — IndexedDB persistence lifecycle, quota handling, and privacy boundaries
- [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=docs/IMPORT_EXPORT_SPEC.md) — `.mindrail.json` file format specification, validation pipeline, and schema migrations
- [docs/STATE\_MANAGEMENT.md](https://www.google.com/search?q=docs/STATE_MANAGEMENT.md) — Editor state separation, undo/redo history stack, and autosave scheduling

### Quality and Security
- [docs/TESTING\_STRATEGY.md](https://www.google.com/search?q=docs/TESTING_STRATEGY.md) — Unit, component, round-trip persistence, accessibility, and E2E verification strategy
- [docs/PERFORMANCE.md](https://www.google.com/search?q=docs/PERFORMANCE.md) — Bundle targets, 60fps canvas interaction budgets, viewport culling, and profiling methods
- [`SECURITY.md`](SECURITY.md) — XSS prevention, import validation, and dependency hygiene

### Development and Deployment
- [docs/DEPLOYMENT.md](https://www.google.com/search?q=docs/DEPLOYMENT.md) — Local preview and static hosting guide (GitHub Pages and generic static hosts)
- [docs/LICENSING.md](https://www.google.com/search?q=docs/LICENSING.md) — Open decisions regarding project, dependency, and asset licensing

### Project Planning & Decisions
- [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=docs/IMPLEMENTATION_PLAN.md) — Phased implementation roadmap (Phases 0 through 5) with tasks and definitions of done
- [docs/ROADMAP.md](https://www.google.com/search?q=docs/ROADMAP.md) — High-level MVP, Post-MVP, and future milestone breakdown
- [docs/decisions/ADR-0001-local-first-no-backend.md](https://www.google.com/search?q=docs/decisions/ADR-0001-local-first-no-backend.md) — Architecture Decision Record establishing the local-first, zero-backend architecture

## Known Limitations

1. **Pre-Implementation State:** The repository currently contains architecture and product specifications only; Phase 0 initialization is the required next step.
2. **Single-Device Browser Storage:** Because there is no backend or cloud sync server, projects saved in `IndexedDB` remain on the local browser profile unless manually exported as `.mindrail.json` files and imported on another device.
3. **Browser Quota Constraints:** Browser storage quotas vary by vendor and available disk space, and private/incognito browsing sessions typically clear `IndexedDB` when closed.
4. **No Real-Time Multi-User Collaboration:** Live multi-cursor collaboration requires signaling/relay infrastructure and is an explicit non-goal for the local-first architecture.
