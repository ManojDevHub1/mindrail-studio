# MindRail Studio

> **Turn messy ideas into structured, visual work.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-1.6-FCC72B?logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Zero Backend](https://img.shields.io/badge/Backend-Zero%20(Local--First)-success)](docs/local_first_and_privacy.md)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-purple)](docs/accessibility.md)

MindRail Studio is a local-first, browser-based visual workspace that unifies architecture diagramming, video storyboarding, academic study mapping, and freelance project management on an infinite 2D canvas. The application runs 100% client-side with zero backend servers, zero mandatory user accounts, and zero paid dependencies.

---

## Table of Contents

- [Overview](#overview)
  - [The Problem MindRail Studio Solves](#the-problem-mindrail-studio-solves)
  - [Core Principles](#core-principles)
- [Main Features](#main-features)
  - [Hardware-Accelerated 2D Canvas Engine](#hardware-accelerated-2d-canvas-engine)
  - [Connection Pipeline and Interactive Edges](#connection-pipeline-and-interactive-edges)
  - [Project Management and Organization](#project-management-and-organization)
  - [Import, Export, and Backup System](#import-export-and-backup-system)
- [Interface Showcase](#interface-showcase)
- [Supported Workspaces](#supported-workspaces)
  - [Developer Architecture Studio](#1-developer-architecture-studio)
  - [Video Creator Studio](#2-video-creator-studio)
  - [Student Learning Studio](#3-student-learning-studio)
  - [Freelance and Business Studio](#4-freelance-and-business-studio)
- [15 Template Categories (45 Built-In Templates)](#15-template-categories-45-built-in-templates)
- [Local-First Architecture and Privacy](#local-first-architecture-and-privacy)
- [Technology Stack](#technology-stack)
- [Installation and Getting Started](#installation-and-getting-started)
- [Available Commands](#available-commands)
- [Project Directory Structure](#project-directory-structure)
- [Step-by-Step Usage Guide](#step-by-step-usage-guide)
- [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference)
- [Backup, Restore, and Data Portability](#backup-restore-and-data-portability)
- [Deployment Guide](#deployment-guide)
- [Accessibility and Ergonomics](#accessibility-and-ergonomics)
- [Known Limitations](#known-limitations)
- [Product Roadmap](#product-roadmap)
- [Contributing](#contributing)
- [License and Attribution](#license-and-attribution)
- [Documentation Index](#documentation-index)
- [Project Links](#project-links)

---

## Overview

### The Problem MindRail Studio Solves

Knowledge workers and creators frequently fragment their thinking across disjointed tools:

- **Software Developers** sketch architecture diagrams in drawing tools, track sprint tasks in Jira or Trello, and hoard code snippets in personal notes, losing the connection between design and execution.
- **Video Creators** juggle scripts in text documents, storyboards in slide decks, shot lists in spreadsheets, and production checklists on scratch paper, losing visual pacing and runtime continuity.
- **Students and Researchers** draw passive mind maps that fail to connect directly with active-recall flashcards, revision checklists, or structured study timers.
- **Freelancers and Consultants** build client workflows, deliverables, and approval milestones in bulky SaaS platforms that require recurring subscription fees and store client data on third-party servers.

MindRail Studio unifies these workflows on a single visual canvas backed by durable browser-local persistence (`IndexedDB`) and portable, human-readable `.mindrail.json` files.

### Core Principles

- **Zero Backend, Total Privacy:** 100% client-side execution. No cloud databases, remote user accounts, tracking cookies, or network requests. Your intellectual property never leaves your device.
- **Zero-Cost and Open Source:** Built exclusively on permissive open-source libraries (MIT, Apache-2.0, ISC, BSD). Free forever without paywalled tiers, artificial limits, or commercial SDKs.
- **Local-First Data Sovereignty:** Primary persistence operates via browser `IndexedDB` (`mindrail_studio_db`) and `localStorage` (`mindrail:prefs:v1`). You own your files through versioned `.mindrail.json` exports.
- **Accessible Craftsmanship:** Engineered with semantic CSS design tokens (`--mr-*`), WCAG 2.1 AA compliant contrast ratios (minimum 4.5:1 text, 3:1 UI borders), full keyboard navigation, and respect for `prefers-reduced-motion`.

---

## Main Features

### Hardware-Accelerated 2D Canvas Engine

- **Infinite 2D Viewport:** Hardware-accelerated panning via `Space + Drag` or middle mouse button; smooth zoom from 10% to 300% via mouse wheel or Canvas HUD controls (`+`, `-`, `Reset 100%`, `Fit to View`).
- **Precision 16px Grid:** Dot-matrix background pattern with a mathematical 16px grid snap engine to keep node layouts aligned.
- **Floating Interactive Minimap:** Real-time mini radar showing the entire graph boundary and an interactive viewport rectangle. Click or drag inside the minimap to instantly reposition camera view. Toggle on or off with key `M`.
- **Multi-Node Selection:** Select nodes with `Shift + Click` or drag a marquee selection box across the canvas background to move or delete groups of nodes simultaneously.
- **Micro-Step Keyboard Nudging:** Nudge selected nodes by 16px grid units using arrow keys, major step 64px with `Shift + Arrows`, or precision 1px alignment with `Alt + Arrows`.
- **Granular History Stack:** Integrated 50-step undo and redo stack (`Ctrl/Cmd + Z` and `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y`) with immutable state isolation.

### Connection Pipeline and Interactive Edges

- **Three Routing Algorithms:** Dynamic Bezier curves, orthogonal right-angle step lines, and direct straight connection vectors.
- **Ergonomic 24px Hit Corridor:** Generous hit testing area allows effortless clicking of thin connection lines even on high-DPI displays and complex zoom levels.
- **Selection Feedback and Halo:** Selected edges display an accent glow halo and open the dedicated Edge Inspector.
- **Edge Inspector:** Inspect and edit source and target nodes, routing styles, custom connection labels, or delete connections with one click or `Delete` / `Backspace`.
- **Keyboard Connection Mode:** Press `C` to enter connection mode, `Tab` to cycle through available target candidate nodes, `Enter` to establish the connection, and `Esc` to cancel.

### Project Management and Organization

- **Project Library:** Manage local projects with toggleable card grid and detailed list views.
- **Instant Search and Filtering:** Real-time search across project titles, tags, and workspace types. Sort by last modified date, title, or node count.
- **Project Cloning:** One-click project cloning to rapidly branch variations of templates or project roadmaps.
- **Storage Capacity Monitor:** Live storage calculation with automatic warnings and emergency backup banners when browser storage limits are approached.

### Import, Export, and Backup System

- **Canonical JSON (`.mindrail.json`):** Version-validated single-project export and import conforming to schema specification v1.
- **Multi-Project Workspace Backup:** Export all projects into a single JSON archive and restore with duplicate collision handling (*Keep Existing & Import as Copy* vs. *Overwrite*).
- **High-Resolution PNG Export:** Crisp client-side image rendering directly from the HTML5 canvas with background inclusion options.
- **SVG Vector Export:** Scalable vector graphics export preserving typography, node shapes, and connection curves for presentation slides.
- **Specialized Markdown (`.md`):** Formatted system architecture specifications, video production storyboards with timecodes, or structured academic study notes.
- **Tabular Data (`.csv`):** Export node datasets, task lists, and deliverable items for spreadsheet tracking in Excel, Numbers, or Google Sheets.

---

## Interface Showcase

MindRail Studio provides a responsive dark-themed workspace with hardware-accelerated pan-zoom, floating radar minimap, contextual inspectors, and domain-tailored toolbars.

| Interface Element | Description | Keyboard Shortcut |
| :--- | :--- | :--- |
| **Canvas Viewport** | Infinite 2D grid viewport with hardware-accelerated pan and zoom | `Space + Drag` to pan |
| **Creation Palette** | Domain-tailored node palette for adding architectural, video, study, or business nodes | `N` for quick node |
| **Minimap Radar** | Floating interactive radar showing complete graph extents and camera box | `M` to toggle |
| **Edge Inspector** | Connection line styling (Bezier, Orthogonal, Straight) and deletion | Click edge or `C` |
| **Node Inspector** | Properties editor for titles, color roles, categories, and domain payloads | Click node |
| **Workspace Summary Bar** | Real-time metrics strip tracking services, runtime, mastery, or deliverables | Always visible |

> **Note on Screenshots:** Screenshots captured directly from the live application will be published in `docs/assets/screenshots/` (including views for Developer, Video, Student, and Freelance workspaces). To capture your own screenshots, start the local server with `npm run dev` at 1920×1080 resolution.

---

## Supported Workspaces

MindRail Studio adapts its canvas tools, node schemas, inspectors, and metrics to match four distinct professional disciplines:

### 1. Developer Architecture Studio
*Route: `#/workspace/developer/:id`*

- **System Architecture Nodes:** Service, Database, Message Queue, Client Application, and Infrastructure Boundary nodes with environment badges (production, staging, development) and health statuses.
- **Monospace Code Snippets:** Syntax-highlighted code cards supporting TypeScript, Python, SQL, Rust, Go, JSON, and Bash with one-click clipboard copy.
- **Engineering Task Tracking:** Story point estimation, priority badges (low, medium, high, critical), assignees, and nested subtask checklists.
- **Developer Metrics Summary:** Real-time tally of services, databases, queues, story points, and task completion percentages directly in the workspace header.

### 2. Video Creator Studio
*Route: `#/workspace/video/:id`*

- **Storyboard Scene Planning:** Framing badges (Wide Shot, Medium Shot, Close-Up, Extreme Close-Up, POV), target durations, and visual descriptions.
- **Narrative Script Beats:** Spoken dialogue blockquotes, voiceover (VO) cues, sound design and SFX notes, and on-screen graphics annotations.
- **Cumulative Runtime Strip:** Dynamic duration calculation formatted in `MM:SS` that updates in real time as scenes and shot items are adjusted.
- **Production Checklist:** Scene readiness tracking from pre-production through filming, voice recording, and final edit.

### 3. Student Learning Studio
*Route: `#/workspace/student/:id`*

- **Concept Mind Maps:** Hierarchical knowledge trees with visual mastery tracking (Novice, Familiar, Proficient, Mastered).
- **Interactive Flashcard Practice Modal:** Spaced-repetition active recall practice modal with standard rating options (*Again*, *Hard*, *Good*, *Easy*).
- **Drift-Free Pomodoro Study Timer:** Local study timer supporting 25-minute focus intervals and 5-minute break sessions with audio cues and pause/resume controls.
- **Knowledge Mastery Metric:** Real-time calculation of overall subject mastery percentage across all concept nodes in the workspace.

### 4. Freelance and Business Studio
*Route: `#/workspace/freelance/:id`*

- **Project Stages and Milestones:** Track engagement stages from discovery and proposal through design, implementation, and client review.
- **Client Deliverables with Approval Workflows:** Track review status (*Pending*, *In Review*, *Approved*, *Changes Requested*) and client sign-off checklists.
- **Billable Tasks and Scope Estimates:** Track fixed and hourly task estimates with priority indicators and client-visibility flags.
- **Freelance Metrics Bar:** Instant calculation of approved deliverables, pending reviews, and total billable budget/hours.

---

## 15 Template Categories (45 Built-In Templates)

MindRail Studio includes **45 schema-valid, fully populated starter templates** distributed evenly across 15 professional categories (3 templates per category). Every template features vector SVG preview schematics, difficulty ratings, and estimated setup times:

| Category | Template Title | Complexity | Target Audience | Primary Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Web Development** | Microservice Architecture & Sprint Tasks | `STANDARD` | Backend Engineers & Tech Leads | API Gateway, auth service, database & sprint tasks |
| **Web Development** | Next.js E-Commerce & Headless Storefront | `STANDARD` | Full-Stack Developers | Storefront frontend, CMS, Stripe checkout, CDN cache |
| **Web Development** | GraphQL Federated Supergraph & Realtime | `COMPREHENSIVE` | Systems Architects | Apollo Router, federated subgraphs, Redis, WebSocket |
| **UI / UX Design** | SaaS Product Onboarding & Activation Flow | `STARTER` | Product Designers | Welcome modal, checklist, feature tour & activation hook |
| **UI / UX Design** | 5-Day Mobile App Design Sprint & User Journey | `STANDARD` | UX Researchers & Product Teams | Understand, Diverge, Decide, Prototype & Test phases |
| **UI / UX Design** | Design System & Component Library Architecture | `COMPREHENSIVE` | Design Technologists | Tokens, typography, atoms, molecules, organism patterns |
| **Graphic Design** | Social Media Visual Kit & Evergreen Asset Library | `STARTER` | Visual Creators | Avatar, banners, story frames, thumbnail templates |
| **Graphic Design** | Brand Identity & Style Guide Delivery Package | `STANDARD` | Brand Identity Designers | Logo suite, color harmony, typography rules & brand book |
| **Graphic Design** | Retail Product Packaging & Print Production Pipeline | `COMPREHENSIVE` | Packaging Specialists | Dieline specs, typography, CMYK preflight & sampling |
| **Video Editing** | YouTube Video Storyboard & Pacing | `STARTER` | YouTube Video Creators | Hook, intro, core content points, CTA & end screen |
| **Video Editing** | TikTok & Reels High-Retention Short-Form Plan | `STARTER` | Short-Form Creators | 0-3s visual hook, pacing beats, audio soundbite, CTA |
| **Video Editing** | Documentary Interview & Narrative Arc | `COMPREHENSIVE` | Documentary Filmmakers | Cold open, subject intro, conflict, turning point, resolution |
| **Content Creation** | Multi-Platform 1-to-10 Content Repurposing Engine | `STARTER` | Content Strategists | Core pillar asset atomized into video, threads, newsletter |
| **Content Creation** | Weekly Creator Newsletter Planning & Publishing Flow | `STARTER` | Newsletter Authors | Curation, lead story, sponsor spot, review & send checklist |
| **Content Creation** | Creator Brand Sponsorship Deal Pipeline | `STANDARD` | Professional Creators | Inbound lead, pitch deck, contract, draft review & invoicing |
| **Writing & Copy** | High-Converting Landing Page Copywriting Blueprint | `STARTER` | Conversion Copywriters | Hero headline, pain point, solution, social proof, offer |
| **Writing & Copy** | Customer Onboarding & Lead Nurturing Email Sequence | `STARTER` | Email Marketers | Welcome email, value drop, case study, soft pitch, offer |
| **Writing & Copy** | Long-Form Technical Article & SEO Pillar Outline | `STANDARD` | Technical Writers | Abstract, prerequisites, implementation code, benchmarks |
| **Social Media** | Monthly Multi-Channel Social Campaign Calendar | `STARTER` | Social Media Managers | Weekly themes, copy drafts, visual assets, post checklist |
| **Social Media** | Influencer Marketing Campaign & Deliverables Tracker | `STANDARD` | Influencer Coordinators | Talent shortlist, brief, contract, draft review & affiliate links |
| **Social Media** | Brand Crisis Communication & Social Response Matrix | `COMPREHENSIVE` | PR Directors & Social Leads | Severity triage, holding statements, approval tree & post-mortem |
| **Digital Marketing** | Full-Funnel Paid Advertising Campaign Architecture | `STANDARD` | Performance Marketers | TOFU awareness, MOFU consideration, BOFU retargeting |
| **Digital Marketing** | B2B Inbound Lead Generation & Live Webinar Funnel | `STANDARD` | Growth Marketers | Registration landing page, email nurture, live deck, replay |
| **Digital Marketing** | SEO Topic Cluster & Pillar Content Blueprint | `STANDARD` | SEO Specialists | Core pillar guide, subtopic cluster articles, internal links |
| **Freelance & Business** | Client Onboarding, Scope of Work & Milestone Tracker | `STARTER` | Freelancers & Consultants | Welcome pack, questionnaire, scope agreement, sign-offs |
| **Freelance & Business** | Monthly Freelance Retainer Service & Review Loop | `STANDARD` | Independent Contractors | Monthly capacity planning, sprint tasks, client review call |
| **Freelance & Business** | High-Value Client Proposal & Pitch Pipeline | `STANDARD` | Agency Owners & Consultants | Discovery call, problem brief, proposal options, close |
| **Photography** | Event & Wedding Photography Day Timeline | `STARTER` | Event Photographers | Preparation, ceremony, portraits, reception, backup flow |
| **Photography** | Commercial Product Photography & Studio Shoot | `STANDARD` | Commercial Photographers | Client moodboard, lighting setup, tethered shoot, grading |
| **Photography** | Editorial Fashion Portrait & Magazine Retouching | `STANDARD` | Fashion Photographers | Moodboard, styling notes, RAW cull, frequency separation |
| **Podcast & Audio** | Podcast Episode Production: Pre-Interview to Master | `STARTER` | Podcast Hosts & Producers | Guest research, questions, recording, editing & show notes |
| **Podcast & Audio** | Commercial Voiceover & Sound Design Pipeline | `STANDARD` | Sound Designers & VO Artists | Script markup, vocal recording, de-essing, sound FX mix |
| **Podcast & Audio** | Narrative Audio Story & Investigative Show Blueprint | `COMPREHENSIVE` | Audio Documentary Creators | Narration voice tracks, field recordings, score, mastering |
| **Data Analytics** | Executive KPI Metrics Tree & Business Dashboard | `STANDARD` | Analytics Directors | Topline revenue, CAC/LTV, funnel conversion rates |
| **Data Analytics** | Modern Data Lakehouse & ETL Ingestion Pipeline | `COMPREHENSIVE` | Data Engineers | Event ingestion, bronze staging, silver curation, gold marts |
| **Data Analytics** | Customer Churn Machine Learning Pipeline | `COMPREHENSIVE` | Data Scientists & ML Engineers | Raw data extract, feature engineering, model training, alert |
| **AI & Automation** | Cross-Platform Zapier & Make Automation Mesh | `STARTER` | No-Code Automation Specialists | Webhook trigger, payload router, CRM update, Slack alert |
| **AI & Automation** | Autonomous AI Customer Support Agent | `STANDARD` | AI Automation Engineers | Customer message ingress, intent classifier, tool dispatcher |
| **AI & Automation** | Production LLM Retrieval-Augmented Generation (RAG) | `COMPREHENSIVE` | AI Engineers | Document parser, chunker, vector DB, hybrid reranker |
| **Education & Research**| Computer Science: Operating Systems & Flashcards | `STARTER` | CS Students & Educators | Kernel, process scheduler, virtual memory, flashcards |
| **Education & Research**| Online Course Curriculum & Module Design Map | `STANDARD` | Instructional Designers | Learning outcomes, module breakdowns, lecture scripts, quizzes |
| **Education & Research**| Academic Literature Review & Thesis Synthesis Map | `COMPREHENSIVE` | Graduate Students & Researchers | Primary research question, thematic literature nodes, synthesis |
| **Product & Startup** | Lean Startup MVP Discovery & Release Roadmap | `STARTER` | Startup Founders | Problem hypothesis, customer interviews, prototype, metrics |
| **Product & Startup** | Customer Discovery & User Problem Validation Map | `STANDARD` | Product Managers | Target persona, interview interviewers, pain rankings |
| **Product & Startup** | Go-To-Market (GTM) Launch & Growth Loop Engine | `STANDARD` | Startup Growth Leads | Product Hunt launch, developer outreach, referral loop |

---

## Local-First Architecture and Privacy

MindRail Studio is engineered from first principles as an offline-first, zero-backend, sovereign software application.

### Data Storage Specifications

| Storage Mechanism | Database / Key | Purpose |
| :--- | :--- | :--- |
| **IndexedDB** | `mindrail_studio_db` (Store: `projects`) | Complete project documents, canvas nodes, custom payloads, and edge connections |
| **IndexedDB** | `mindrail_studio_db` (Store: `metadata`) | Quick-access index of project titles, updated dates, and node counts for fast library loads |
| **localStorage** | `mindrail:prefs:v1` | User preferences: grid snap mode, default zoom level, recent template filters |
| **File Export** | `*.mindrail.json` | Portable, human-readable JSON files for backing up, version controlling, or sharing work |

### Privacy Guarantees

- **No Remote Telemetry:** No Google Analytics, Mixpanel, Sentry, or tracking pixels.
- **No Third-Party Font or Script CDNs:** All CSS styles, fonts, and scripts are bundled directly in the compiled application bundle.
- **Offline Operation:** The entire application functions seamlessly when disconnected from the internet.

---

## Technology Stack

MindRail Studio adheres to a strict zero-paid-API, zero-commercial-dependency architectural boundary:

| Layer | Technology | Version | Architectural Responsibility |
| :--- | :--- | :--- | :--- |
| **UI Framework** | [React](https://react.dev/) | `^18.3.1` | Declarative UI, state hooks, and virtual DOM rendering |
| **Type System** | [TypeScript](https://www.typescriptlang.org/) | `^5.4.5` | Strict type checking (`exactOptionalPropertyTypes: true`, zero `any`) |
| **Build Tooling** | [Vite](https://vitejs.dev/) | `^5.2.11` | Ultra-fast Hot Module Replacement (HMR) and optimized rollup production bundling |
| **Styling** | Native CSS Modules & Variables | W3C Standard | Dark-mode design token system (`--mr-*`) in `src/design-system/tokens.css` |
| **Test Runner** | [Vitest](https://vitest.dev/) | `^1.6.0` | In-memory unit and integration testing suite (170 tests across 24 test suites) |
| **DOM Testing** | [Testing Library React](https://testing-library.com/) | `^15.0.7` | User-centric accessibility and component interaction testing |
| **Storage Mocking**| [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB) | `^6.0.0` | High-fidelity IndexedDB simulation for automated headless test execution |
| **Linting** | [ESLint](https://eslint.org/) | `^8.57.0` | Code quality enforcement with strict React hooks and TypeScript rules |

---

## Installation and Getting Started

### Prerequisites

- **Node.js:** `v18.0.0` or higher (`v20.x` or `v22.x` LTS recommended)
- **npm:** `v9.0.0` or higher (bundled with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

Clone the official MindRail Studio repository from GitHub:

```bash
git clone https://github.com/ManojDevHub1/mindrail-studio.git
cd mindrail-studio
npm install
```

### Launch Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:5173` to use the application with Hot Module Replacement.

---

## Available Commands

All scripts configured in `package.json` are standard, deterministic, and verify cleanly:

| Command | Action | Verification Standard |
| :--- | :--- | :--- |
| `npm run dev` | Starts Vite development server at `http://localhost:5173` | Instant HMR updates |
| `npm run build` | Compiles TypeScript and builds production bundle to `dist/` | Zero compilation errors |
| `npm run preview` | Serves compiled production build at `http://localhost:4173` | Verifies static asset loading |
| `npm run typecheck`| Executes strict TypeScript validation (`tsc --noEmit`) | Zero type errors |
| `npm run lint` | Runs ESLint analysis across all source code | Zero warnings, zero errors |
| `npm test` | Runs complete automated Vitest test suite | 170 passing tests across 24 suites |

---

## Project Directory Structure

```text
mindrail-studio/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated GitHub Pages CI/CD workflow
├── docs/                           # Canonical technical specifications & architectural docs
│   ├── accessibility.md            # WCAG 2.1 AA specifications & focus management
│   ├── architecture.md             # System architecture & component boundaries
│   ├── contributing.md             # Contribution guidelines & code conventions
│   ├── data_model.md               # Canonical schemas for projects, nodes & edges
│   ├── deployment.md               # Static deployment guide for GitHub Pages & web servers
│   ├── design_system.md            # CSS token specifications & color contrast ratios
│   ├── EXPORT_FORMATS.md           # Specifications for JSON, PNG, SVG, MD & CSV exports
│   ├── import_export_spec.md       # Import/export format & validation schema
│   ├── local_first_and_privacy.md  # IndexedDB persistence & privacy guarantees
│   ├── prd.md                      # Product requirements document
│   ├── product_brief.md            # Product brief & vision statement
│   ├── QA_MATRIX.md                # Quality assurance test scenarios
│   ├── RELEASE_CHECKLIST.md        # Release verification checklist
│   ├── roadmap.md                  # Development phases & future roadmap
│   ├── state_management.md         # Reducer, actions & history architecture
│   └── testing_strategy.md         # Testing pyramid & unit/integration guidelines
├── public/
│   └── favicon.svg                 # Vector application icon
├── src/
│   ├── app/                        # Application routing, views & top-level modals
│   │   ├── modals/                 # ExportModal, ImportModal, NewProjectModal, RestoreConfirmDialog
│   │   ├── views/                  # LandingView, ProjectLibraryView, TemplateGalleryView, CanvasView
│   │   ├── App.tsx                 # Root application wrapper
│   │   └── router.tsx              # Hash-based client router (URL-safe, no server rewrites)
│   ├── canvas/                     # Visual 2D canvas interaction engine
│   │   ├── CanvasContextMenu.tsx   # Context menu for nodes, edges & canvas background
│   │   ├── CanvasHud.tsx           # Floating HUD controls (zoom, fit, minimap, stats)
│   │   ├── CanvasViewport.tsx      # Pan/zoom mouse & touch event pipeline
│   │   ├── EdgeInspector.tsx       # Edge inspection, line styling & deletion panel
│   │   ├── EdgeLayerSvg.tsx        # High-performance SVG connection layer with 24px hit areas
│   │   ├── geometry.ts             # Bezier curves, orthogonal routing & bounding box math
│   │   ├── MinimapOverlay.tsx      # Floating interactive radar with click/drag panning
│   │   ├── NodeContainer.tsx       # Node rendering container with selection styling
│   │   ├── NodeInspector.tsx       # Node editing inspector with workspace payload fields
│   │   └── ShortcutsDialog.tsx     # Keyboard shortcuts modal reference
│   ├── design-system/              # Reusable token-driven UI component library
│   │   ├── components/             # Button, Dialog, Input, Select, Badge, Card, Tooltip
│   │   └── tokens.css              # Dark theme CSS Custom Properties (--mr-*)
│   ├── domain/                     # Canonical domain models, factories & calculators
│   │   ├── builtInTemplates.ts     # Master registry of all 45 templates
│   │   ├── calculators.ts          # Real-time metrics calculations for all 4 workspaces
│   │   ├── factories.ts            # Node, edge, checklist, and project factory functions
│   │   ├── models.ts               # Core TypeScript interfaces & type definitions
│   │   ├── templates/              # 15 category template definition modules
│   │   └── validators.ts           # Runtime schema validation for imported JSON files
│   ├── import-export/              # Multi-format serialization and export engines
│   │   ├── csvExporter.ts          # Tabular CSV export
│   │   ├── imageExporter.ts        # Client-side HTML5 canvas PNG rendering
│   │   ├── markdownExporter.ts     # Domain-specific Markdown script/notes generator
│   │   ├── projectExporter.ts      # Canonical JSON serializer
│   │   ├── projectImporter.ts      # Validating JSON parser & collision resolver
│   │   └── svgExporter.ts          # Vector SVG graph serializer
│   ├── persistence/                # Local browser storage engines
│   │   ├── indexedDbStorage.ts     # IndexedDB wrapper (mindrail_studio_db)
│   │   ├── localStoragePrefs.ts    # User preference storage
│   │   └── storageHealth.ts        # Storage quota calculation & warning system
│   ├── state/                      # Deterministic state management
│   │   ├── canvasContext.tsx       # React context provider
│   │   ├── historyManager.ts       # 50-step undo/redo stack
│   │   ├── projectActions.ts       # Type-safe action creators
│   │   └── projectReducer.ts       # Pure immutable project state reducer
│   ├── utils/                      # Shared utility functions (IDs, colors, dates, download)
│   ├── workspaces/                 # Specialized domain workspace components & summary bars
│   │   ├── student/                # FlashcardStudyModal, StudyTimerWidget & timer hook
│   │   ├── CreationPalette.tsx     # Workspace-specific node creation toolbar
│   │   ├── WorkspaceHeader.tsx     # Top navigation bar with project title & actions
│   │   └── WorkspaceSummaryBar.tsx # Real-time domain metrics summary bar
│   ├── index.css                   # Global styles & font reset
│   └── main.tsx                    # Application entry point
├── .eslintrc.cjs                   # ESLint configuration
├── .gitignore                      # Git ignore rules
├── AGENTS.md                       # Architectural instructions for AI coding assistants
├── CHANGELOG.md                    # Release history and version records
├── index.html                      # HTML5 host document
├── LICENSE                         # Permissive MIT License
├── package.json                    # Project dependencies and script commands
├── tsconfig.json                   # Strict TypeScript compiler configuration
└── vite.config.ts                  # Vite build configuration (base: './')
```

---

## Step-by-Step Usage Guide

### 1. Create a Project
- Navigate to the **Project Library** (`#/projects`).
- Click **New Project** to start from a blank canvas, or click **Browse Templates** (`#/templates`) to select from 45 built-in workflows.
- Select your desired workspace type: **Developer**, **Video**, **Student**, or **Freelance**.

### 2. Navigate the Canvas
- **Pan the Canvas:** Hold `Space` and drag with the left mouse button, or click and drag with the middle mouse button.
- **Zoom In and Out:** Scroll your mouse wheel, or click the `+` and `-` buttons in the bottom-left Canvas HUD.
- **Reset or Fit View:** Press `Ctrl/Cmd + 0` to reset zoom to 100%, or `Shift + 1` to fit all nodes into view.
- **Minimap Radar:** Click the radar thumbnail in the bottom-right HUD or press `M` to toggle the minimap. Drag the white viewport box inside the minimap to jump anywhere.

### 3. Add and Edit Nodes
- **Add Quick Node:** Press `N` or click a node type from the left-hand Creation Palette.
- **Move Nodes:** Click and drag any node to reposition it. Nodes snap to the 16px grid.
- **Nudge with Keyboard:** Select a node and use the arrow keys to adjust placement (16px grid step, 64px with `Shift`, 1px with `Alt`).
- **Inspect Properties:** Click any node to open the Node Inspector on the right. Edit the title, color accent, category, and workspace-specific payloads (e.g. code snippet language, dialogue script, flashcard answers, or deliverable approval status).

### 4. Create Connections Between Nodes
- **Mouse Drag Connection:** Hover over any node to reveal connection ports (top, bottom, left, right). Click and drag from an outgoing port to a target node port.
- **Keyboard Connection (`C`):** Select a source node and press `C`. Use `Tab` to cycle between candidate target nodes, and press `Enter` to connect.
- **Style Connection Lines:** Click any connection line to open the Edge Inspector. Switch between **Bezier**, **Orthogonal**, and **Straight** routing curves, or add a descriptive connection label.
- **Delete Connections:** Select a connection line and press `Delete` or `Backspace`, or click the *Delete Connection* button in the Edge Inspector.

### 5. Multi-Select and Batch Actions
- **Marquee Drag:** Click and drag on any empty canvas background area to draw a rectangular selection box over multiple nodes.
- **Shift + Click:** Hold `Shift` while clicking nodes to toggle them in and out of the multi-selection.
- **Batch Move and Delete:** Drag any selected node to move the entire group together, or press `Delete` to remove all selected items at once.

### 6. Export and Share
- Click the **Export / Share** button in the top navigation bar to open the Export Modal.
- Choose your preferred export format:
  - **JSON (`.mindrail.json`)** for complete project backup.
  - **PNG Image** for documentation and presentation slides.
  - **SVG Vector** for infinite-resolution vector graphics.
  - **Markdown (`.md`)** for clean formatted text scripts or architecture specifications.
  - **CSV (`.csv`)** for spreadsheet data manipulation.

---

## Keyboard Shortcuts Reference

MindRail Studio provides extensive keyboard shortcuts designed for high-efficiency workflows and accessibility:

| Shortcut | Action | Context |
| :--- | :--- | :--- |
| `N` | Add a new node | Canvas Viewport |
| `C` | Enter keyboard connection mode | Selected Node |
| `Tab` | Cycle target candidate nodes | Keyboard Connection Mode |
| `Enter` | Confirm and create connection | Keyboard Connection Mode |
| `Escape` | Dismiss connection mode, inspectors, or modals | Universal |
| `M` | Toggle canvas minimap radar overlay | Canvas Viewport |
| `Delete` / `Backspace` | Delete selected node(s) or connection line | Selected Node / Edge |
| `Arrow Keys` | Nudge selected nodes by 16px grid step | Selected Node(s) |
| `Shift + Arrow Keys` | Nudge selected nodes by 64px major step | Selected Node(s) |
| `Alt + Arrow Keys` | Fine-tune selected nodes by 1px precision | Selected Node(s) |
| `Space + Drag` | Pan the infinite 2D canvas | Canvas Viewport |
| `Shift + Click` | Add/remove node from multi-selection | Canvas Viewport |
| `Marquee Drag` | Draw rectangular multi-selection box | Canvas Background |
| `Ctrl/Cmd + Z` | Undo last change (up to 50 steps) | Universal |
| `Ctrl/Cmd + Shift + Z` | Redo undone change | Universal |
| `Ctrl/Cmd + Y` | Alternative redo shortcut | Universal |
| `Ctrl/Cmd + S` | Force immediate local save to IndexedDB | Universal |
| `Shift + 1` | Fit all nodes into current viewport view | Canvas Viewport |
| `Ctrl/Cmd + 0` | Reset camera zoom to 100% | Canvas Viewport |
| `?` | Open Keyboard Shortcuts modal dialog | Universal |

---

## Backup, Restore, and Data Portability

### Canonical File Format (`.mindrail.json`)

All project files exported by MindRail Studio conform to the versioned `ProjectExportPackage` specification v1:

```json
{
  "format": "mindrail",
  "version": 1,
  "exportedAt": "2026-10-22T18:00:00.000Z",
  "appVersion": "0.1.0",
  "project": {
    "id": "project-1740000000000",
    "schemaVersion": 1,
    "title": "Production E-Commerce Platform",
    "description": "System architecture diagram and deployment pipeline",
    "workspaceType": "developer",
    "createdAt": "2026-10-22T12:00:00.000Z",
    "updatedAt": "2026-10-22T18:00:00.000Z",
    "nodes": [],
    "edges": [],
    "settings": {
      "gridSnap": true,
      "gridSize": 16,
      "showMinimap": true,
      "defaultConnectionStyle": "bezier"
    }
  }
}
```

### Multi-Project Workspace Backup and Collision Resolution

In **Settings** (`#/settings`), you can create a complete multi-project workspace backup containing all local projects in a single archive.

When restoring an archive, MindRail Studio detects project ID conflicts and offers two safe resolution modes:

- **Safe Copy (Recommended):** Preserves existing local projects and imports conflicting items with new IDs and a `"(Restored Copy)"` title suffix.
- **Overwrite:** Replaces existing projects matching incoming IDs with the archived versions.

---

## Deployment Guide

MindRail Studio compiles into a pure, self-contained static directory (`dist/`) that can be hosted on any static hosting provider.

### Automated GitHub Pages Deployment (Recommended)

This repository includes a pre-configured GitHub Actions workflow at `.github/workflows/deploy.yml`:

```bash
git init
git add .
git commit -m "feat: initial release v0.1.0"
git branch -M main
git remote add origin https://github.com/ManojDevHub1/mindrail-studio.git
git push -u origin main
```

1. In your GitHub repository, open **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Source**, choose **GitHub Actions**.
3. Every push to `main` will automatically trigger testing, typechecking, building, and publishing to:
   `https://ManojDevHub1.github.io/mindrail-studio/`

*Subdirectory Compatibility:* Because `vite.config.ts` sets `base: './'` and routing uses the hash-based client router (`#/`), assets and deep links load correctly in any URL subdirectory without requiring server rewrite rules.

### Static Web Servers (Nginx, Caddy, Vercel, Netlify)

Compile the static production bundle:

```bash
npm run build
```

The output in `dist/` can be served with any static web server:

```bash
npx serve dist -l 3000
```

---

## Accessibility and Ergonomics

MindRail Studio is engineered to satisfy **WCAG 2.1 AA** standards:

- **Color Contrast:** All interface typography and interactive controls strictly exceed the 4.5:1 contrast requirement for normal text and 3:1 for graphical interface borders (see `docs/accessibility.md`).
- **Complete Keyboard Navigation:** Every modal, menu, dialog, and node connection can be operated using standard keyboard navigation without requiring mouse interaction.
- **Screen Reader Announcements:** Dynamic ARIA live regions announce connection creation, node selection changes, and canvas mode toggles.
- **Reduced Motion Support:** Respects user operating system preferences (`@media (prefers-reduced-motion: reduce)`), disabling viewport pan/zoom animations and pulsing halos for users with vestibular sensitivities.
- **Focus Management:** Modals and dialogs trap keyboard focus securely while open and return focus to the triggering element upon dismissal.

---

## Known Limitations

- **Origin-Bound Storage:** Browser data persistence is sandboxed to the specific protocol, domain, and port on which the app is loaded. Loading the app via `localhost` vs `127.0.0.1` or different subdomains will access distinct IndexedDB databases.
- **Private / Incognito Browsing:** When operating inside Private or Incognito browser windows, IndexedDB storage is temporary and will be cleared automatically when the browser window is closed. Always export your work to `.mindrail.json` before closing private tabs.
- **Cross-Device Synchronization:** MindRail Studio does not synchronize data to remote cloud servers by design. To move projects across devices, export a `.mindrail.json` file or create a full workspace backup archive in Settings.
- **Browser Storage Quotas:** IndexedDB quotas depend on available local disk space. MindRail Studio includes an active storage health monitor and displays an emergency export banner if the browser environment indicates storage exhaustion.

---

## Product Roadmap

- [x] **Phase 1: Architecture and Data Model** - Strict TypeScript domain schemas, factories, and validators.
- [x] **Phase 2: Local Persistence and Storage** - IndexedDB repository with automated schema migration.
- [x] **Phase 3: Visual 2D Canvas Engine** - Pan, zoom, minimap, 16px grid, multi-selection, and Bezier/Orthogonal edges.
- [x] **Phase 4: Specialized Workspaces** - Developer, Video Creator, Student Learning, and Freelance Business studios.
- [x] **Phase 5: Import and Export Studio** - JSON, PNG, SVG, Markdown, CSV, and full workspace backup/restore.
- [x] **Phase 6: Universal Template Ecosystem** - 45 curated starter templates across 15 professional categories.
- [x] **Phase 7: Product Polish and UX Audit** - Ergonomic connection selection halos, 24px hit areas, and storage quota protection.
- [x] **Phase 8: Production Release and GitHub Presentation** - Open-source release, GitHub Actions CI/CD, and documentation index.
- [ ] **Future Direction:** Progressive Web App (PWA) offline service worker with desktop installation.
- [ ] **Future Direction:** Optional WebRTC peer-to-peer real-time canvas collaboration (zero-server data transfer).
- [ ] **Future Direction:** Custom user template creation and local template library exports.

---

## Contributing

Contributions from developers, designers, and creators are warmly welcomed:

1. Fork the repository on GitHub: [https://github.com/ManojDevHub1/mindrail-studio](https://github.com/ManojDevHub1/mindrail-studio)
2. Create a focused feature branch:

```bash
git checkout -b feature/your-feature-name
```

3. Follow the project's quality standards:
   - Maintain strict TypeScript (`exactOptionalPropertyTypes: true`, zero `any`).
   - Use semantic CSS design tokens (`var(--mr-*)`) from `src/design-system/tokens.css`.
   - Add automated unit or integration tests for new functionality in `src/**/__tests__/`.
4. Verify that all test suites and linter checks pass cleanly:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

5. Open a Pull Request with a clear description of your changes.

For comprehensive architectural guidelines, review [AGENTS.md](AGENTS.md) and [docs/contributing.md](docs/contributing.md).

---

## License and Attribution

MindRail Studio is free, open-source software licensed under the **[MIT License](LICENSE)**.

Copyright (c) 2026 MindRail Studio Contributors.

You are free to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, subject to the conditions of the MIT License.

---

## Documentation Index

Canonical project specifications, architectural decision records, and quality matrices are maintained in `docs/`:

| Document | Description |
| :--- | :--- |
| **[Product Brief & Vision](docs/product_brief.md)** | Product motivation, user personas, and long-term vision |
| **[Functional Requirements (PRD)](docs/prd.md)** | Detailed functional specifications and requirements matrix |
| **[System Architecture](docs/architecture.md)** | Component boundaries, state flow, and local storage design |
| **[Canonical Data Model](docs/data_model.md)** | Data structures for projects, nodes, edges, and payloads |
| **[Design System & CSS Tokens](docs/design_system.md)** | Complete token reference, typography, and color specifications |
| **[Accessibility Specification](docs/accessibility.md)** | WCAG 2.1 AA checklist, keyboard navigation, and ARIA roles |
| **[Local-First & Privacy Architecture](docs/local_first_and_privacy.md)** | IndexedDB persistence, privacy guarantees, and offline design |
| **[Import & Export Specification](docs/import_export_spec.md)** | JSON schema specification v1 and validation criteria |
| **[Export Formats Specification](docs/EXPORT_FORMATS.md)** | Formats guide for PNG, SVG, Markdown, and CSV serialization |
| **[State Management & History](docs/state_management.md)** | Reducer architecture, action creators, and undo/redo stack |
| **[Testing Strategy](docs/testing_strategy.md)** | Testing pyramid, Vitest configurations, and test layers |
| **[Deployment & Static Hosting](docs/deployment.md)** | Static hosting instructions for GitHub Pages, Nginx, and cloud hosts |
| **[Release Checklist](docs/RELEASE_CHECKLIST.md)** | Production release readiness checklist and verification gates |
| **[Phased Implementation Plan](docs/implementation_plan.md)** | Complete Phase 1 through Phase 8 development milestones |
| **[Product Roadmap](docs/roadmap.md)** | Long-term capability planning and feature evolution |
| **[Product Audit Report](docs/PRODUCT_AUDIT.md)** | End-to-end quality audit, test coverage, and verification report |
| **[QA Verification Matrix](docs/QA_MATRIX.md)** | Complete manual and automated QA verification matrix |
| **[Contributing Guidelines](docs/contributing.md)** | Developer environment setup and code review standards |
| **[Licensing & Attribution](docs/licensing.md)** | Permissive open-source license documentation |
| **[Changelog](CHANGELOG.md)** | Keep-a-Changelog formatted release history |

---

## Project Links

- **GitHub Repository:** [https://github.com/ManojDevHub1/mindrail-studio](https://github.com/ManojDevHub1/mindrail-studio)
- **Clone URL:** `https://github.com/ManojDevHub1/mindrail-studio.git`
- **Issue Tracker:** [https://github.com/ManojDevHub1/mindrail-studio/issues](https://github.com/ManojDevHub1/mindrail-studio/issues)
- **Pull Requests:** [https://github.com/ManojDevHub1/mindrail-studio/pulls](https://github.com/ManojDevHub1/mindrail-studio/pulls)
