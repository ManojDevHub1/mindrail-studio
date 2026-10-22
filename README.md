# MindRail Studio

> **Turn messy ideas into structured, visual work.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-1.6-FCC72B?logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Zero Backend](https://img.shields.io/badge/Backend-Zero%20(Local--First)-success)](docs/local_first_and_privacy.md)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-purple)](docs/accessibility.md)

MindRail Studio is a **local-first, browser-based visual workspace** designed for software engineers, video creators, students, freelancers, and independent thinkers. It pairs an infinite, hardware-accelerated 2D canvas with specialized workspace workflows—running 100% client-side with **zero backend servers**, **zero mandatory user accounts**, and **zero paid dependencies**.

---

## The Problem MindRail Studio Solves

Knowledge workers and creators frequently fragment their thinking across disjointed tools:
- **Software Developers** sketch architecture diagrams in drawing apps, track sprint tasks in project boards, and hoard code snippets in personal note apps.
- **Video Creators** juggle scripts in text editors, storyboards in presentation decks, shot lists in spreadsheets, and production checklists on scratch paper—losing visual pacing and timecode continuity.
- **Students & Self-Learners** draw passive mind maps that fail to connect directly with active-recall flashcards, revision checklists, or structured focus timers.
- **Freelancers & Consultants** build client workflows, deliverables, and approval milestones in bulky SaaS platforms that require subscription fees and store client data on third-party servers.

**MindRail Studio unifies these workflows on a single visual canvas** backed by durable browser-local persistence (`IndexedDB`) and portable, human-readable `.mindrail.json` files.

---

## Interface Showcase

<!-- Preview Placeholders: Replace with genuine screenshots after capturing -->
```
+-----------------------------------------------------------------------------------+
|  MINDRAIL STUDIO  [Projects]  [Templates]  [Settings]      [Saved locally] [Export]|
+---------------+---------------------------------------------------+---------------+
| PALETTE       | SHARED VISUAL CANVAS (2D GPU Viewport)            | INSPECTOR     |
| - Service     |                                                   |               |
| - Database    |     [API Gateway] --(HTTP/JSON)--> [Auth Service] | Node Title    |
| - Queue       |           |                                       | Color Role    |
| - Code Snippet|           v                                       | Endpoints     |
| - Task / Bug  |     [Users DB]                                    | Task Subtasks |
|               |                                                   | Code Snippet  |
+---------------+---------------------------------------------------+---------------+
| 🔍 Zoom: 100% |  [M] Minimap Overlay   |  [?] Shortcuts   |  4 Nodes  3 Connections |
+-----------------------------------------------------------------------------------+
```

*Visual highlights:*
- **Real-Time Minimap:** Floating interactive radar with click-to-pan, drag-to-pan, and toggle (`M`).
- **Connection Halo & Context Menu:** 24px wide hit area, glowing accent selection halo, and right-click routing selector (`bezier`, `orthogonal`, `straight`).
- **Template Schematics:** Vector SVG structure previews on all template cards and preview modals.

---

## Four Specialized Workspaces

### 1. Developer Architecture Studio (`#/workspace/developer/:id`)
- **System Architecture Nodes:** Service, database, queue, client, and architecture boundary components.
- **Monospace Code Snippets:** Syntax-tagged snippets with one-click clipboard copy.
- **Engineering Task Tracking:** Story point estimation, priority tags, and nested subtasks checklist.
- **Live Metrics Bar:** Real-time tally of services, databases, queues, and task completion percentages.

### 2. Video Creator Studio (`#/workspace/video/:id`)
- **Storyboard Scene Planning:** Framing badges (Wide, Medium, Close-Up), duration seconds, and visual descriptions.
- **Narrative Script Beats:** Spoken dialogue blockquotes, voiceover (VO) cues, motion graphics, and audio/SFX notes.
- **Cumulative Runtime Strip:** Dynamic duration calculation formatted in `MM:SS` with per-scene timecode roll-ups.
- **Production Checklist:** Scene readiness tracking from pre-production to final edit.

### 3. Student Learning Studio (`#/workspace/student/:id`)
- **Concept Mind Maps:** Hierarchical knowledge trees with root topic flags and key concept tags.
- **Interactive Flashcard Practice Modal:** Spaced repetition deck with front/back flip, hint toggle, and confidence ratings (*Again, Hard, Good, Easy*).
- **Drift-Free Study Timer:** Client-side 25-minute Pomodoro focus countdown with 5-minute break cycles, calculating real elapsed time across background tabs.
- **Mastery Tracker:** Real-time visual progress bar showing percentage of mastered concepts.

### 4. Freelance & Business Studio (`#/workspace/freelance/:id`)
- **Project Stage Pipelines:** Phase numbering, milestone deliverables, and budget/scope tracking.
- **Client Deliverable Cards:** Format tags, review cycles, and client approval decision toggles.
- **Review Items & Sign-Off:** Reviewer assignment, sign-off criteria, and completion audits.
- **Freelance Summary Bar:** Deliverable approval percentages and pending client tasks.

---

## Universal Template Ecosystem (45 Templates across 15 Categories)

MindRail Studio includes **45 curated, production-grade starter templates** with instant vector layout previews:

| Category | Icon | Featured Templates |
| :--- | :---: | :--- |
| **Web Development** | 🌐 | Microservice Architecture, Fullstack Next.js Application, Data Lakehouse & ETL |
| **UI / UX Design** | 🎨 | Design System Component Architecture, Mobile App Onboarding, B2B SaaS Dashboard |
| **Graphic Design** | ✨ | Brand Identity & Style Guide, Product Packaging System, Multi-Channel Campaign |
| **Video Editing** | 🎬 | YouTube Video Production, Short-Form Reel / TikTok Storyboard, Commercial Video |
| **Content Creation** | ✍️ | Multi-Platform Content Repurposing Engine, Technical Blog Series, Newsletter Launch |
| **Writing & Copy** | 📝 | Non-Fiction Book Structure, High-Converting Landing Page Copy, Video Sales Letter |
| **Social Media** | 📱 | 30-Day Omnichannel Growth Campaign, Community Engagement, Product Launch Blitz |
| **Digital Marketing** | 📈 | Full-Funnel Paid Acquisition, Inbound SEO Topic Cluster, Email Nurture Sequence |
| **Freelance & Business** | 💼 | Client Onboarding & Milestone Tracker, Scope of Work, Retainer Deliverable Flow |
| **Photography** | 📷 | Commercial Product Photoshoot, Editorial Portrait Session, Event Coverage Plan |
| **Podcast & Audio** | 🎙️ | Narrative Audio Documentary, Interview-Based Show Production, Audiobook Workflow |
| **Data Analytics** | 📊 | Enterprise BI Reporting Architecture, Customer Churn Prediction, Product Analytics |
| **AI & Automation** | 🤖 | Multi-Agent LLM Orchestrator, Customer Support Bot, Automated Invoice Processor |
| **Education & Research** | 🎓 | Academic Research Thesis, Complete Semester Study Architecture, Certification Prep |
| **Product & Startup** | 🚀 | Lean MVP Launch Roadmap, Feature Prioritization Matrix, Go-To-Market Plan |

*Features:* 15 category tabs, multi-field search, difficulty filters, Favorites toggle (`localStorage`), Recents filter pill (`🕒 Recents (N)`), complexity badges (`STARTER`, `STANDARD`, `COMPREHENSIVE`), and user-saved custom templates with instant instantiation.

---

## Non-Negotiable Technical Guarantees

1. **Zero Backend:** Operates 100% on native Web APIs (`IndexedDB`, `localStorage`, `Blob`, `FileReader`). No server runtime, cloud databases, or background worker services.
2. **Zero Cost & Open Source:** Only permissive open-source packages (React 18, TypeScript 5, Vite, Vitest). No commercial SDKs, paid APIs, or subscription gates.
3. **Local-First & Private:** All projects stay on your local machine unless you explicitly export a file. Zero tracking cookies, zero analytics beacons, zero telemetry transmission.
4. **Accessible Craftsmanship:** Semantic HTML, high-contrast dark theme (WCAG 2.1 AA), visible focus rings (`:focus-visible`), full keyboard accessibility (`C` for connection, arrow keys to nudge, `Delete` to remove), and `prefers-reduced-motion` compliance.

---

## Local Data Storage & Privacy Boundaries

MindRail Studio stores project data exclusively in your browser profile:
- **IndexedDB (`mindrail_studio_db`):** Primary database storing full `projects` and `custom_templates`.
- **LocalStorage (`mindrail:prefs:v1`):** UI preferences, favorite template IDs, recently used template IDs, and appearance settings.

### Important Storage Considerations:
- **Origin Isolation:** Browser storage is isolated per origin. Projects created on `http://localhost:5173` remain distinct from those on your deployed domain (e.g. `https://<username>.github.io/mindrail-studio/`). Use the `.mindrail.json` export/import feature to move projects between origins.
- **Private / Incognito Windows:** Data stored in Private Browsing mode is deleted by the browser when the session closes. Use **Export Project (`.mindrail.json`)** before closing private tabs.
- **Browser Clearing:** Clearing browser site data removes local projects. Use **Settings $\to$ Export All Projects Backup** regularly to archive all projects to disk.

---

## Import & Export Studio

- **Project Backup (`.mindrail.json`):** Full, lossless JSON project envelope with schema versioning and referential integrity validation.
- **Architecture Diagrams (`.svg`):** Vector standalone diagrams with computed bounding boxes and inline dark CSS styling.
- **High-DPI Images (`.png`):** High-resolution $2\times$ raster diagrams generated offline via HTML5 canvas.
- **Editorial Storyboards (`.md`):** Formatted Markdown scripts with timecodes, dialogue blockquotes, and shot lists.
- **Study Guides (`.md`):** Formatted Markdown study notes with concepts, mastery levels, and flashcard decks.
- **Multi-Project Backup Restore:** Restore entire multi-project archives with duplicate collision resolution (*Keep Existing & Import as Copy* vs *Overwrite*).

---

## Quick Start & Installation

### Prerequisites
- **Node.js:** `v20.x` LTS or `v22.x`+
- **npm:** `v10+`

### Installation
```bash
# Clone the repository (replace with your repository URL)
git clone https://github.com/<username>/mindrail-studio.git
cd mindrail-studio

# Install dependencies
npm install
```

### Local Development Server
```bash
npm run dev
```
Starts the Vite dev server with Hot Module Replacement (HMR) at `http://localhost:5173`.

### Verification & Testing Suite
```bash
# Strict TypeScript compiler check (zero errors)
npm run typecheck

# Code quality & ESLint validation (zero warnings)
npm run lint

# Automated test suite (170 tests across 24 test suites)
npm test

# Optimized static production build
npm run build
```

### Preview Production Build
```bash
npm run preview
```
Serves the compiled `dist/` directory at `http://localhost:4173` to test production asset loading and offline behavior.

---

## Deployment Guide

MindRail Studio emits a pure static asset directory (`dist/`) that can be hosted on any static web host.

### Option 1: GitHub Pages via Automated GitHub Actions (Recommended)
This repository includes a pre-configured GitHub Actions workflow at `.github/workflows/deploy.yml`:
1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release v0.1.0"
   git branch -M main
   git remote add origin https://github.com/<username>/mindrail-studio.git
   git push -u origin main
   ```
2. In your GitHub repository, navigate to **Settings** $\to$ **Pages**.
3. Under **Build and deployment** $\to$ **Source**, select **GitHub Actions**.
4. The workflow runs typecheck, linting, tests, and builds to publish your site at:
   `https://<username>.github.io/mindrail-studio/`

*Subdirectory Compatibility:* Because `vite.config.ts` configures `base: './'` and routing uses the hash-based client router (`#/`), assets and deep links load without server rewrite rules.

### Option 2: Self-Hosted Static File Server
Host the compiled `dist/` folder using Nginx, Caddy, Apache, or `serve`:
```bash
npm run build
npx serve dist -l 3000
```

---

## Known Limitations

1. **Local Storage Quotas:** IndexedDB quotas depend on available disk space and browser profile rules. An emergency backup banner triggers automatically if browser storage is exhausted.
2. **Headless Browser Testing:** Automated testing is powered by Vitest and JSDOM (170 tests). True cross-browser rendering tests (WebKit/Safari mobile) currently rely on manual verification.
3. **No Cloud Sync:** By design, MindRail Studio does not synchronize data to remote cloud servers. File export (`.mindrail.json`) is the canonical method for sharing projects across devices.

---

## Contributing

Contributions are welcome! Please follow these standards:
1. Ensure all code maintains strict TypeScript typing (`exactOptionalPropertyTypes: true`, zero `any`).
2. Adhere to the design system CSS token architecture (`var(--mr-*)`) in `src/design-system/tokens.css`.
3. Add unit or component tests for all new behavior in `src/**/__tests__/`.
4. Ensure all quality gates pass cleanly before submitting:
   `npm run typecheck && npm run lint && npm test && npm run build`
5. Refer to [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md) for architectural guidelines.

---

## Documentation Index

Canonical specifications are maintained in `docs/`:

- [Product Brief & Vision](docs/product_brief.md)
- [Functional Requirements (PRD)](docs/prd.md)
- [System Architecture](docs/architecture.md)
- [Canonical Data Model](docs/data_model.md)
- [Design System & CSS Tokens](docs/design_system.md)
- [Accessibility & WCAG AA Standards](docs/accessibility.md)
- [Local-First Persistence & Privacy](docs/local_first_and_privacy.md)
- [Import / Export Specification](docs/import_export_spec.md)
- [Export Formats Specification](docs/EXPORT_FORMATS.md)
- [State Management & History](docs/state_management.md)
- [Testing Strategy & Test Layers](docs/testing_strategy.md)
- [Deployment & Static Hosting Guide](docs/deployment.md)
- [Release Readiness Checklist](docs/RELEASE_CHECKLIST.md)
- [Phased Implementation Plan](docs/implementation_plan.md)
- [Product Roadmap](docs/roadmap.md)
- [Product Audit Report](docs/PRODUCT_AUDIT.md)
- [QA Verification Matrix](docs/QA_MATRIX.md)
- [Changelog](CHANGELOG.md)

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
