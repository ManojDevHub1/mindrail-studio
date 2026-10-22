# Changelog

All notable changes to **MindRail Studio** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-22

### Added
- **100% Client-Side Local-First Architecture:** Complete visual workspace operating inside the browser with zero backend servers, zero paid APIs, zero tracking cookies, and zero mandatory user accounts.
- **Durable Local Storage:** Browser `IndexedDB` (`mindrail_studio_db`) object stores for projects and custom templates, alongside `localStorage` (`mindrail:prefs:v1`) for UI preferences and favorites.
- **Shared Visual Canvas Engine:**
  - Hardware-accelerated 2D viewport with smooth panning, zoom (`15%–300%`), fit-to-view, and 16px grid snapping.
  - Marquee rectangular multi-selection with modifier keys (`Shift`/`Ctrl`).
  - Multi-node batch moving, bulk recoloring, and multi-node deletion.
  - Interactive Canvas Minimap with real-time viewport tracking, click-to-pan, and drag-to-pan (`M`).
  - 50-step undo/redo history stack with input coalescing (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`).
- **First-Class Connection Management:**
  - 24px wide invisible pointer hit-testing path (`.edgeHitArea`) with `pointerEvents="stroke"` for reliable targeting at all zoom levels.
  - Glowing accent selection halo (`.edgeSelectionHalo`) rendered with `--mr-color-primary` at 35% opacity.
  - Custom right-click `EdgeContextMenu` with viewport collision clamping, Inspect action, live routing style selector (`bezier`, `orthogonal`, `straight`), and Delete action.
  - Keyboard deletion (`Delete` / `Backspace`) without affecting endpoint nodes or capturing focused text inputs.
  - Synchronized `EdgeInspector` panel with source/target summaries and relationship labels.
  - `aria-live="polite"` status announcer vocalizing connection selection, creation, and deletion.
- **Four Specialized Workspaces:**
  - **Developer Architecture Studio:** Service nodes, databases, queues, workflow steps, code snippets with copy action, task/bug tracking with subtasks, and real-time Developer Metrics Summary.
  - **Video Creator Studio:** Storyboard scene planning, cumulative timeline duration calculation (`MM:SS`), framing badges, script beats, shot items, and scene checklists.
  - **Student Learning Studio:** Concept mind maps, interactive Flashcard Practice Deck Modal with recall self-assessment, drift-free local Study Timer (25m Focus / 5m Break), and mastery progress tracking.
  - **Freelance & Business Studio:** Project stages, client tasks, deliverables with approval tracking, and sign-off review items.
- **Universal Template Ecosystem (45 Templates across 15 Categories):**
  - 45 schema-valid templates across Web Dev, UI/UX, Graphic Design, Video, Content, Writing, Social Media, Marketing, Freelance/Business, Photography, Audio, Data, AI, Education, and Startups.
  - Vector SVG Template Structure Previews (`TemplateStructurePreview.tsx`) on every card and in the Preview Modal illustrating relative node layouts and directed connection flows.
  - "My Templates" tab for user-saved custom templates with instant instantiation and safe deletion confirmation.
  - Recents filter pill (`🕒 Recents (N)`) and workflow complexity badges (`STARTER`, `STANDARD`, `COMPREHENSIVE`).
- **Multi-Format Export Studio:**
  - Standalone SVG architecture diagram generator with content bounding box and dark inline CSS styles.
  - High-resolution $2\times$ scale PNG rasterizer via offscreen `<canvas>`.
  - Editorial Markdown Storyboards with formatted timecodes, dialogue blockquotes, and shot lists.
  - Structured Markdown Study Guides.
  - Portable lossless `.mindrail.json` project files.
- **Multi-Project Backup Archive Management:**
  - Full archive export and restore via `validateBackupArchive` with Safe Copy (fresh UUIDs) vs. Overwrite collision handling.
  - Actionable error guidance when importing multi-project archives into the single-project import modal.
- **Accessibility & Craftsmanship:**
  - Full keyboard connection mode (`C`) with target selection and Enter confirmation.
  - WCAG 2.1 AA compliant color contrast on dark canvas themes.
  - Strict `:focus-visible` keyboard focus rings.
  - Respects `@media (prefers-reduced-motion: reduce)`.
- **Automated Verification:** 24 test suites passing (170 automated tests), strict TypeScript compilation with zero errors, zero ESLint warnings, and static production build in 821ms.
