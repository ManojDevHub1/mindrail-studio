# Claude Repository Instructions (`CLAUDE.md`)

Read [`AGENTS.md`](AGENTS.md) first before planning or making any changes in this repository. [`AGENTS.md`](AGENTS.md) is the canonical source of repository-wide rules, architectural boundaries, coding conventions, and non-negotiable constraints for **MindRail Studio**.

## Core Mandates Summary

- **Zero-Cost, Zero-Backend, Local-First:** MindRail Studio runs 100% in the browser using `IndexedDB`, `localStorage`, and `.mindrail.json` file import/export. Never add backend servers, cloud databases, authentication services, telemetry, or paid APIs.
- **Canonical Specifications:** Always check [docs/README.md](https://www.google.com/search?q=docs/README.md) to locate the authoritative specification before writing code:
  - Requirements: [docs/PRD.md](https://www.google.com/search?q=docs/PRD.md)
  - Architecture: [docs/ARCHITECTURE.md](https://www.google.com/search?q=docs/ARCHITECTURE.md)
  - Data Schema: [docs/DATA\_MODEL.md](https://www.google.com/search?q=docs/DATA_MODEL.md)
  - File Format: [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=docs/IMPORT_EXPORT_SPEC.md)
  - State & Undo/Redo: [docs/STATE\_MANAGEMENT.md](https://www.google.com/search?q=docs/STATE_MANAGEMENT.md)
  - Design System & Tokens: [docs/DESIGN\_SYSTEM.md](https://www.google.com/search?q=docs/DESIGN_SYSTEM.md)
  - Accessibility: [docs/ACCESSIBILITY.md](https://www.google.com/search?q=docs/ACCESSIBILITY.md)
  - Execution Order: [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=docs/IMPLEMENTATION_PLAN.md)

## Required Operational Workflow

Follow this exact 8-step workflow for every development or maintenance task:

1. **Inspect the repository**
   - Check the current directory tree, `package.json`, existing modules, tests, and `git status`.
   - Do not assume files or scripts exist without checking.
2. **Read relevant specifications**
   - Read the applicable files in `docs/` (such as [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=docs/IMPLEMENTATION_PLAN.md), [docs/DATA\_MODEL.md](https://www.google.com/search?q=docs/DATA_MODEL.md), and [docs/PRD.md](https://www.google.com/search?q=docs/PRD.md)) to understand acceptance criteria, edge cases, and architectural boundaries.
3. **Identify the smallest coherent implementation**
   - Scope the change to a single vertical slice or milestone task from [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=docs/IMPLEMENTATION_PLAN.md).
   - Avoid building unrequested speculative abstractions or half-implemented UI placeholders.
4. **Implement the feature**
   - Write strict TypeScript (`no any`), modular CSS using design tokens from [docs/DESIGN\_SYSTEM.md](https://www.google.com/search?q=docs/DESIGN_SYSTEM.md), semantic HTML, and full keyboard accessibility per [docs/ACCESSIBILITY.md](https://www.google.com/search?q=docs/ACCESSIBILITY.md).
   - Maintain strict separation between pure domain models (`src/domain/`), persistence (`src/persistence/`), and UI components.
5. **Run relevant tests and checks**
   - Execute `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` (once `package.json` is initialized in Phase 0).
   - Add or update unit, component, and round-trip persistence/import-export tests for all new logic.
6. **Inspect the resulting behavior**
   - Verify the runtime behavior, error states, empty states, keyboard navigation, and storage persistence rather than assuming compilation equals correctness.
7. **Update documentation when necessary**
   - If feature implementation status, scripts, data schemas, or architectural decisions change, update [`README.md`](README.md), [`CHANGELOG.md`](CHANGELOG.md), and the corresponding specification in `docs/`.
8. **Report verified results and unresolved issues**
   - Clearly distinguish between what was **implemented and verified**, what was **implemented but not fully verified**, and what remains **specified but not implemented**.
   - Never fabricate test output, build results, or manual verification steps.

## Safety and Permission Rules

- Never configure or execute destructive shell commands (`rm -rf` on project roots, `git reset --hard`, `git push --force`) without explicit user authorization.
- Never bypass permission checks or disable TypeScript/linter safety rules to force a build to pass.
- Never install external dependencies without verifying license compatibility and zero-cost compliance per [docs/LICENSING.md](https://www.google.com/search?q=docs/LICENSING.md).
