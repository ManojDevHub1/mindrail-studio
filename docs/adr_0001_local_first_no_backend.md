# ADR-0001: Local-First, Zero-Backend Client-Side Architecture

- **Status:** Accepted
- **Date:** 2026-10-22
- **Deciders:** MindRail Studio Architecture & Product Engineering

## 1. Context

MindRail Studio is a visual productivity and creation platform serving developers, video creators, students, and designers across three specialized workspaces (**Developer**, **Video Creator**, and **Student**) built around a **Shared Visual Canvas**.

Early in system design, we must decide how user projects (canvas nodes, connections, code snippets, video scripts/storyboards, flashcards, templates, and preferences) are created, processed, persisted, backed up, and deployed.

The project operates under strict product and operational requirements:
1. **Zero-Cost Development & Operation:** The platform must be developable, deployable, and usable at `$0` ongoing infrastructure cost, with zero paid APIs or subscriptions required.
2. **Immediate Zero-Friction Access:** Users must be able to open the application and immediately start structuring ideas without registering an account or handing over personal data.
3. **Privacy & Data Ownership:** Developers mapping internal architectures, creators writing unreleased scripts, and students organizing personal study notes need assurance that their work is not silently uploaded to third-party servers.
4. **Long-Term Maintainability:** Open-source projects that depend on custom backend servers or commercial Backend-as-a-Service (BaaS) free tiers frequently break when hosting credits expire, free database tiers are paused after inactivity, or maintainers rotate.

## 2. Decision

We will build **MindRail Studio as a 100% local-first, zero-backend, frontend-only web application** that executes entirely inside the user's browser:

1. **No Custom Backend or Cloud Database:** The application will have no server-side API, no remote database, no authentication service, and no telemetry endpoint.
2. **Browser-Native Persistence:**
   - Structured project documents (`Project`) and custom templates (`ProjectTemplate`) are persisted locally in the browser's `IndexedDB` (`mindrail_studio_db`).
   - Lightweight UI preferences are persisted in `localStorage` (`mindrail:prefs:v1`).
   - Transient editing, selection, and undo/redo states live in browser memory (`React` state).
3. **File-Based Portability & Backups:**
   - Projects are exported and imported as versioned, human-readable `.mindrail.json` files ([docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=../IMPORT_EXPORT_SPEC.md)) using standard browser File/Blob APIs.
   - Visual diagrams and workspace summaries are exported locally in the browser as `.svg`, `.png`, and `.md` files.
4. **Static Asset Deployment:**
   - The application compiles to a static bundle (`dist/`) that can be served from any static file host (such as GitHub Pages) or run locally offline.

## 3. Alternatives Considered

### Alternative A: Traditional Full-Stack Architecture (Node/Go API + PostgreSQL + Auth)
- **Description:** Build a custom REST/GraphQL backend with user registration, JWT/session authentication, and a cloud relational database storing nodes and edges.
- **Why Rejected:** Requires ongoing paid server/database hosting, introduces authentication friction before first use, creates server maintenance and security patching burdens, and stores sensitive user diagrams/scripts on a central server.

### Alternative B: Commercial Backend-as-a-Service (Firebase / Supabase / Clerk)
- **Description:** Rely on free tiers of managed cloud database and authentication providers.
- **Why Rejected:** Violates the zero-backend constraint, couples core application functionality to proprietary vendor SDKs, pauses or breaks when free-tier quotas or inactivity timers are exceeded, and forces users to trust third-party cloud storage with their projects.

### Alternative C: Memory-Only Scratchpad (No `IndexedDB`, File Export Only)
- **Description:** Keep state only in RAM and require users to manually download and re-upload JSON files on every browser session.
- **Why Rejected:** Accidental tab closure or browser refresh would immediately wipe user work. Pairing `IndexedDB` autosave with `.mindrail.json` export provides both seamless session persistence and long-term file portability.

## 4. Advantages

1. **Zero Infrastructure Cost & Immortal Hosting:** The compiled static files can be hosted for free on static hosting platforms or run directly on `localhost` forever without database bills or expiring backend instances.
2. **Instant Time-to-Value:** Zero sign-up walls, zero login forms, and zero network latency when creating, moving, or connecting nodes on the canvas.
3. **Strong Privacy by Architecture:** Because no backend exists, user projects cannot be leaked in a server-side database breach or mined by backend analytics.
4. **Offline Resilience:** Once the static application shell is loaded in the browser, all canvas editing, `IndexedDB` saving, and `.mindrail.json` exporting work without an active internet connection.
5. **Git-Friendly Project Files:** Developers and creators can commit `.mindrail.json`, `.svg`, and `.md` exports directly into their own Git repositories alongside their code or creative assets.

## 5. Disadvantages

1. **No Automatic Multi-Device Cloud Sync:** Projects saved in `IndexedDB` on Laptop A do not automatically appear on Phone B; users must export and import `.mindrail.json` files (or store exported files in their own synced folder).
2. **No Real-Time Multi-User Co-Editing:** Live multi-cursor collaboration requires network signaling/relay servers and is out of scope.
3. **Browser Storage Volatility:** Clearing browser site data, resetting a browser profile, or using private/incognito browsing windows can erase `IndexedDB` data.

## 6. Consequences

- **Mandatory Storage Status UX:** The UI must always display honest local save status (`Saved locally`, `Unsaved changes`, `Save failed`) and educate users that browser storage is local to their current browser profile ([docs/LOCAL\_FIRST\_AND\_PRIVACY.md](https://www.google.com/search?q=../LOCAL_FIRST_AND_PRIVACY.md)).
- **First-Class Import/Export Engineering:** Because `.mindrail.json` files are the primary mechanism for backup, sharing, and cross-device transfer, import validation, schema migration, and round-trip testing are P0 architectural requirements ([docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=../IMPORT_EXPORT_SPEC.md)).
- **Strict Client-Side Security:** Since users may import `.mindrail.json` files received from others, the frontend must validate schemas strictly and prevent XSS and prototype pollution (\[suspicious link removed\]).

## 7. Risks and Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **`IndexedDB` quota exhaustion or browser eviction** | Request `navigator.storage.persist()` where available, catch `QuotaExceededError`, keep state alive in memory, and provide a one-click Emergency `.mindrail.json` Export button |
| **Schema evolution breaking older local projects or `.mindrail.json` files** | Enforce integer `schemaVersion` on all persisted records and build a pure stepwise migration pipeline (`src/import-export/migrateProject.ts`) |
| **Static host `404` errors on deep-linked routes** | Use Hash-Based Client-Side Routing (`#/workspace/...`) and relative asset paths (`base: './'`) so any static file server resolves routes without custom server rewrites |

## 8. Conditions That Would Justify Revisiting This Decision

This decision is foundational to MindRail Studio and should only be revisited if:
1. The project owner explicitly changes the product strategy to require real-time multi-user cloud collaboration and approves funding and operating a dedicated backend infrastructure.
2. Even under such a future scenario, any synchronization layer must be designed as an **optional add-on** that preserves 100% offline, local-first operation and `.mindrail.json` portability as the default mode.
