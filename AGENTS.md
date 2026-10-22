# AI Coding Agent Instructions (`AGENTS.md`)

This document establishes repository-wide rules, architectural boundaries, and quality standards for all AI coding agents working on **MindRail Studio**.

The detailed specifications and canonical documentation are preserved in `docs/`:
- Product Brief & Vision: `docs/product_brief.md`
- Functional Requirements: `docs/prd.md`
- Architecture & Boundaries: `docs/architecture.md`
- Canonical Data Model: `docs/data_model.md`
- Design Tokens & Specs: `docs/design_system.md`
- Accessibility & WCAG Standards: `docs/accessibility.md`
- Local Storage & Privacy: `docs/local_first_and_privacy.md`
- File Format & Validation: `docs/import_export_spec.md`
- State Management & History: `docs/state_management.md`
- Testing Strategy: `docs/testing_strategy.md`
- Implementation Plan: `docs/implementation_plan.md`
- Complete AI Guidelines: `docs/agents.md`

## Non-Negotiable Constraints

1. **Zero-Cost Development & Operation:** Only use permissive open-source packages (MIT, Apache-2.0, ISC, BSD). Never introduce paid APIs or commercial SDKs.
2. **Zero Backend:** 100% client-side application. No cloud databases, backend API routes, or mandatory authentication.
3. **Local-First Architecture:** Primary persistence uses browser `IndexedDB` (`mindrail_studio_db`) and `localStorage` (`mindrail:prefs:v1`). Portable file backups via `.mindrail.json`.
4. **Premium Dark Craftsmanship:** Follow the semantic CSS token architecture (`--mr-*`) defined in `docs/design_system.md`. Maintain WCAG AA contrast, keyboard accessibility, and respect `prefers-reduced-motion`.
5. **Truthfulness:** Only claim features work and tests pass when they have been executed and verified.
