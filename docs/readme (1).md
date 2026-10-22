# MindRail Studio Documentation Index (`docs/README.md`)

Welcome to the engineering and product documentation for **MindRail Studio**—a local-first, zero-backend, zero-cost visual workspace for developers, video creators, and students.

> **Current Project Status:** Fully Implemented & Verified (`v0.1.0-release`). All specifications in this directory are implemented and verified by 24 automated test suites (170 tests) with strict TypeScript typing and a production build.

## 1. Root Governance & Agent Guides

| Document | Purpose |
| :--- | :--- |
| [../README.md](https://www.google.com/search?q=../README.md) | Main public project entry point, overview, stack status, and quick links |
| [../AGENTS.md](https://www.google.com/search?q=../AGENTS.md) | Repository-wide instructions, architectural boundaries, and rules for AI coding agents |
| [../CLAUDE.md](https://www.google.com/search?q=../CLAUDE.md) | Claude-specific 8-step operational workflow and safety guidelines |
| [../CONTRIBUTING.md](https://www.google.com/search?q=../CONTRIBUTING.md) | Contribution guidelines, TypeScript conventions, testing, and PR standards |
| [../CHANGELOG.md](https://www.google.com/search?q=../CHANGELOG.md) | Keep a Changelog formatted history of project changes |
| [../SECURITY.md](https://www.google.com/search?q=../SECURITY.md) | Threat model, untrusted JSON import handling, XSS prevention, and vulnerability reporting |

## 2. Product

Strategic positioning, functional requirements, information hierarchy, and end-to-end user journeys.

| Document | Purpose |
| :--- | :--- |
| [PRODUCT\_BRIEF.md](https://www.google.com/search?q=PRODUCT_BRIEF.md) | Product vision, mission, target audiences, value proposition, non-goals, and risks |
| [PRD.md](https://www.google.com/search?q=PRD.md) | Complete Product Requirements Document with P0/P1/P2 priorities and observable acceptance criteria |
| [INFORMATION\_ARCHITECTURE.md](https://www.google.com/search?q=INFORMATION_ARCHITECTURE.md) | Application views, navigation hierarchy, workspace structures, and client-side routing |
| [UX\_FLOWS.md](https://www.google.com/search?q=UX_FLOWS.md) | Step-by-step user flows covering onboarding, canvas editing, persistence, import/export, error recovery, and mobile usage |

## 3. UX and Design

Visual language, CSS custom property tokens, component specifications, and accessibility standards.

| Document | Purpose |
| :--- | :--- |
| [DESIGN\_SYSTEM.md](https://www.google.com/search?q=DESIGN_SYSTEM.md) | Dark creative visual identity, semantic color roles, typography, spacing, canvas node styling, and motion rules |
| [ACCESSIBILITY.md](https://www.google.com/search?q=ACCESSIBILITY.md) | WCAG AA contrast rules, keyboard-only canvas navigation, focus management, ARIA announcements, and reduced motion |

## 4. Architecture and Data

Technical design, data structures, local storage guarantees, portable file format, and state management.

| Document | Purpose |
| :--- | :--- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System layers, component boundaries, hybrid DOM/SVG canvas strategy, Mermaid diagrams, and trade-offs |
| [DATA\_MODEL.md](https://www.google.com/search?q=DATA_MODEL.md) | Canonical TypeScript interfaces for `Project`, `CanvasNode`, `CanvasEdge`, workspace payloads, and referential integrity rules |
| [LOCAL\_FIRST\_AND\_PRIVACY.md](https://www.google.com/search?q=LOCAL_FIRST_AND_PRIVACY.md) | `IndexedDB` and `localStorage` boundaries, autosave behavior, quota exhaustion handling, and privacy guarantees |
| [IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=IMPORT_EXPORT_SPEC.md) | `.mindrail.json` file format specification, untrusted input validation pipeline, limits, and schema migration rules |
| [STATE\_MANAGEMENT.md](https://www.google.com/search?q=STATE_MANAGEMENT.md) | Separation of persistent document state and transient UI state, undo/redo command history, and autosave scheduling |
| [decisions/ADR-0001-local-first-no-backend.md](https://www.google.com/search?q=decisions/ADR-0001-local-first-no-backend.md) | Architecture Decision Record documenting the local-first, frontend-only architectural decision |

## 5. Quality and Security

Verification strategies, performance targets, and client-side security protections.

| Document | Purpose |
| :--- | :--- |
| [TESTING\_STRATEGY.md](https://www.google.com/search?q=TESTING_STRATEGY.md) | Unit, component, schema validation, round-trip import/export, keyboard, accessibility, and E2E testing plan |
| [`PERFORMANCE.md`](PERFORMANCE.md) | Bundle size budgets, 60fps canvas interaction targets, viewport culling, memory management, and measurement methods |
| [../SECURITY.md](https://www.google.com/search?q=../SECURITY.md) | Client-side security controls, JSON sanitization, CSP configuration, and vulnerability disclosure |

## 6. Development and Deployment

Local build workflows, static hosting setup, and legal/licensing governance.

| Document | Purpose |
| :--- | :--- |
| [DEPLOYMENT.md](https://www.google.com/search?q=DEPLOYMENT.md) | Local development server, production static build, GitHub Pages base-path setup, and post-deploy verification |
| [LICENSING.md](https://www.google.com/search?q=LICENSING.md) | Unresolved source license options, third-party dependency license rules, and asset rights |

## 7. Project Planning

Phased implementation execution plan and high-level product roadmap.

| Document | Purpose |
| :--- | :--- |
| [IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=IMPLEMENTATION_PLAN.md) | Dependency-ordered engineering execution plan from Phase 0 (Foundation) to Phase 5 (Release Readiness) |
| [ROADMAP.md](https://www.google.com/search?q=ROADMAP.md) | High-level distinction between MVP scope, Post-MVP enhancements, future possibilities, and explicit non-goals |
