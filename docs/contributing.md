# Contributing to MindRail Studio

Thank you for contributing to **MindRail Studio**. This guide defines our engineering standards, workflow expectations, and review criteria so that both human contributors and AI coding agents can collaborate cleanly.

## 1. Project Contribution Principles

All contributions must uphold the core product pillars established in [docs/PRODUCT\_BRIEF.md](https://www.google.com/search?q=docs/PRODUCT_BRIEF.md) and [docs/decisions/ADR-0001-local-first-no-backend.md](https://www.google.com/search?q=docs/decisions/ADR-0001-local-first-no-backend.md):

1. **Zero-Cost Everything:** Contributions must never require paid APIs, commercial software licenses, or paid cloud infrastructure.
2. **Zero Backend:** All features must operate client-side in the browser. Proposals that require a custom server, cloud database, or user authentication will not be accepted.
3. **Local-First & Privacy-Respecting:** User data belongs in local browser storage (`IndexedDB`/`localStorage`) and portable `.mindrail.json` files. Do not add analytics trackers, external telemetry, or silent network calls.
4. **Vertical Completeness Over Mockups:** Do not add non-functional buttons, dead menu items, or placeholder UI controls that claim functionality without working logic and state persistence.
5. **Accessibility Is Mandatory:** Every interactive feature—including canvas node manipulation—must be usable via keyboard and accessible to assistive technologies per [docs/ACCESSIBILITY.md](https://www.google.com/search?q=docs/ACCESSIBILITY.md).

## 2. Development Environment Setup

> **Current Repository Note:** The repository is currently in its **pre-code specification phase**. No `package.json` or `src/` directory exists yet. The first contribution task is **Phase 0** in [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=docs/IMPLEMENTATION_PLAN.md).

Once Phase 0 initializes the repository toolchain:

### Prerequisites

- **Node.js:** v20 LTS or v22 LTS
- **npm:** v10+
- **Git:** v2.35+

### Local Setup

```bash
git clone <repository-url>
cd mindrail-studio
npm install
npm run dev
```

## 3. Branch and Commit Conventions

### Branch Naming

Use descriptive, lower-case, hyphen-separated branch names prefixed by change category:

- `feat/<short-slug>` — New product features or vertical slices (e.g., `feat/canvas-node-creation`)
- `fix/<short-slug>` — Bug fixes (e.g., `fix/indexeddb-quota-error-banner`)
- `docs/<short-slug>` — Documentation updates (e.g., `docs/update-import-schema`)
- `refactor/<short-slug>` — Internal code restructuring without behavior change
- `test/<short-slug>` — Adding or improving automated tests
- `chore/<short-slug>` — Build tooling or dependency maintenance

### Commit Messages

Follow a clear, imperative commit message format inspired by Conventional Commits:

```text
<type>(<scope>): <concise imperative summary under 72 chars>

<optional body explaining the "why", architectural trade-offs, and verification performed>
```

Examples:

- `feat(canvas): implement keyboard node creation and grid movement`
- `fix(import-export): reject edges referencing non-existent node IDs`
- `docs(prd): mark Phase 1 persistence requirements as verified`

## 4. Code Quality Expectations

- **No Dead Code:** Remove unused variables, commented-out blocks, and temporary debug statements before submitting changes.
- **Small, Focused Modules:** Keep files cohesive. Separate pure domain logic (`src/domain/`) from storage adapters (`src/persistence/`) and React view components (`src/canvas/`, `src/workspaces/`).
- **Explicit Error Handling:** Handle failure modes (`JSON.parse` errors, `IndexedDB` transaction aborts, `QuotaExceededError`, invalid schema versions) using typed result objects or structured error boundaries. Never swallow exceptions with empty `catch {}` blocks.

## 5. TypeScript Conventions

- Enable and respect `"strict": true`, `"noUncheckedIndexedAccess": true`, and `"exactOptionalPropertyTypes": true`.
- Define canonical data structures in `src/domain/` matching [docs/DATA\_MODEL.md](https://www.google.com/search?q=docs/DATA_MODEL.md).
- Avoid `any`. Use `unknown` at external boundaries (file imports, storage reads, clipboard paste events) and narrow types using explicit validation functions.
- Prefer discriminated unions (e.g., `WorkspaceType = 'developer' | 'video' | 'student'`) and exhaustive `switch` checks with `assertNever` helpers.

## 6. Component Development Guidelines

- **Design System Alignment:** Build UI elements using the CSS custom properties and component variants specified in [docs/DESIGN\_SYSTEM.md](https://www.google.com/search?q=docs/DESIGN_SYSTEM.md).
- **State Separation:** Follow [docs/STATE\_MANAGEMENT.md](https://www.google.com/search?q=docs/STATE_MANAGEMENT.md). Keep high-frequency pointer/drag state isolated from persistent document history until an interaction completes.
- **Complete UI States:** Components that load, list, or mutate data must handle:
  - Loading state
  - Empty state (with helpful next-step action)
  - Populated state
  - Validation / runtime error state
- **Reduced Motion:** Wrap non-essential transitions in `@media (prefers-reduced-motion: no-preference)` or respect the application's reduced-motion setting.

## 7. Testing Requirements

No continuous integration (CI) pipeline is currently configured in the repository. Until CI automation is added, contributors must run all verification checks locally before submitting work:

1. **Unit & Domain Tests:** Every new domain function, reducer action, schema migration, or validator in `src/domain/`, `src/state/`, or `src/import-export/` must include unit tests.
2. **Round-Trip Persistence Tests:** Changes to the project schema must include an export-then-import round-trip test verifying zero data loss.
3. **Component & Interaction Tests:** Interactive components must test both pointer and keyboard workflows.
4. **Verification Reporting:** Clearly list which test commands were executed and their actual outcomes in your pull request description.

See [docs/TESTING\_STRATEGY.md](https://www.google.com/search?q=docs/TESTING_STRATEGY.md) for detailed test categories and scenarios.

## 8. Accessibility Requirements

Every pull request that adds or modifies UI must verify compliance with [docs/ACCESSIBILITY.md](https://www.google.com/search?q=docs/ACCESSIBILITY.md):

- All interactive controls are reachable and operable via keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, arrow keys, `Escape`).
- Focus indicators are clearly visible against dark surfaces.
- Icon-only buttons include explicit `aria-label` attributes and tooltips.
- Modal dialogs manage focus entry, focus trapping, `Escape` dismissal, and focus restoration.
- Status badges and connection states never rely on color alone.

## 9. Pull Request Expectations

Keep pull requests scoped to a single coherent milestone or bug fix:

1. **Reference the Specification:** Link to the relevant section in [docs/PRD.md](https://www.google.com/search?q=docs/PRD.md) or task in [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=docs/IMPLEMENTATION_PLAN.md).
2. **Describe What Changed and Why:** Explain the architectural approach and any edge cases handled.
3. **Document Verification:** Paste the actual terminal output of `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` (once available), plus manual browser verification steps performed.
4. **Honest Status:** If any aspect of a feature is partial or unverified, call it out explicitly.

## 10. Documentation Updates

Documentation must evolve in lockstep with code:

- Update [`README.md`](README.md) and [docs/PRD.md](https://www.google.com/search?q=docs/PRD.md) when feature implementation status changes.
- Update [docs/DATA\_MODEL.md](https://www.google.com/search?q=docs/DATA_MODEL.md) and [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=docs/IMPORT_EXPORT_SPEC.md) whenever persisted types or file schemas change.
- Add an entry under `[Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md) for user-visible additions, fixes, or breaking schema changes.
- Add an Architecture Decision Record in `docs/decisions/` when introducing or changing a significant technical decision.

## 11. Dependency Review

Before adding any package to `package.json`:

1. **Necessity Check:** Can this be solved cleanly in <100 lines of standard TypeScript or native browser APIs? If yes, do not add a dependency.
2. **License Check:** Verify the package uses a permissive open-source license (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`) per [docs/LICENSING.md](https://www.google.com/search?q=docs/LICENSING.md).
3. **Bundle Impact:** Check bundle size impact against the budgets in [docs/PERFORMANCE.md](https://www.google.com/search?q=docs/PERFORMANCE.md).
4. **Zero-Backend & Zero-Cost Check:** Ensure the package does not phone home to external servers or require paid credentials.

## 12. Bug Reports and Feature Proposals

### Reporting Bugs

When filing a bug report, include:

- Browser name, version, and operating system.
- Which workspace was active (`Developer`, `Video Creator`, or `Student`).
- Exact steps to reproduce the issue.
- Expected behavior versus actual behavior.
- Relevant console error messages or a minimal sanitized `.mindrail.json` reproduction file (if applicable).

### Proposing Features

When proposing a new feature, explain:

- Which user persona and job-to-be-done it serves (see [docs/PRD.md](https://www.google.com/search?q=docs/PRD.md)).
- How it integrates with the Shared Visual Canvas or a specific workspace.
- How it operates 100% locally in the browser without a backend or paid API.
- How its data is represented in [docs/DATA\_MODEL.md](https://www.google.com/search?q=docs/DATA_MODEL.md) and exported in `.mindrail.json`.
