# MindRail Studio Export Formats Specification (`docs/EXPORT_FORMATS.md`)

## Overview

MindRail Studio provides a multi-format local export pipeline designed for presentation, documentation, sharing, and data portability. In accordance with our local-first, zero-backend architecture, all exports are generated 100% client-side in the user's browser without sending canvas or document data over a network.

Exports are accessed through the **Export Studio** modal dialog (`src/import-export/ExportDialog.tsx`) available from any workspace editor header bar.

---

## 1. Export Formats Matrix

| Format | File Extension | Workspace Availability | Primary Use Case | Output Characteristics |
| :--- | :--- | :--- | :--- | :--- |
| **Canonical JSON** | `.mindrail.json` | All Workspaces | Lossless archive, backup & transfer | Schema-validated, full revision history & payloads |
| **Standalone SVG** | `.svg` | All Workspaces | Scalable vector presentations & print | Native SVG 1.1, dark theme, inline CSS tokens, zero external fonts |
| **High-DPI PNG** | `.png` | All Workspaces | Slide decks, wikis & image embeds | $2\times$ pixel ratio rasterization via offscreen `<canvas>` |
| **Markdown Storyboard** | `.md` | Video Creator | Production scripts, call sheets & checklists | Scene sequences, timecodes, spoken dialogue blockquotes, shot list table |
| **Markdown Study Guide** | `.md` | Student Studio | Self-study, exam revision & cheat sheets | Core concepts, mastery badges, interactive flashcard question/answers |

---

## 2. Format Specifications

### 2.1 Canonical JSON Archive (`.mindrail.json`)
- **Generator Module:** [`src/import-export/exportProjectJson.ts`](file:///d:/ALL%20Project/1/src/import-export/exportProjectJson.ts)
- **Validation Engine:** [`src/import-export/importProjectJson.ts`](file:///d:/ALL%20Project/1/src/import-export/importProjectJson.ts)
- **MIME Type:** `application/json;charset=utf-8`
- **Schema Version:** `1`
- **Filename Pattern:** `<project-slug>.mindrail.json`
- **Characteristics:**
  - Full structural representation of `Project` interface including `metadata`, `settings`, `viewport`, `nodes`, `edges`, and `checklist`.
  - Type-safe payload preservation for all workspace nodes (`DeveloperNodePayload`, `VideoNodePayload`, `StudentNodePayload`).
  - Round-trip integrity verification via schema validation and edge reference pruning on re-import.

### 2.2 Standalone SVG Diagram (`.svg`)
- **Generator Module:** [`src/import-export/exportSvgDiagram.ts`](file:///d:/ALL%20Project/1/src/import-export/exportSvgDiagram.ts)
- **MIME Type:** `image/svg+xml;charset=utf-8`
- **Filename Pattern:** `<project-slug>-architecture.svg`
- **Characteristics:**
  - **Content Bounds:** Automatically computes tight bounding box (`calculateDiagramBounds`) enclosing all canvas nodes with 64px padding. Coordinates are normalized so positive and negative canvas positions render properly in the `viewBox`.
  - **Embedded Dark Styling:** Self-contained `<style>` block matching MindRail Studio tokens (`#0d1117` background, `#161b22` cards, `#30363d` borders, `#e6edf3` text).
  - **Vector Geometry:** Curved bezier connections (`<path d="M... C...">`) with directional arrowhead markers (`#arrow`) and relationship labels on background pills.
  - **System Font Stack:** Uses `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif` without external font requests.
  - **Safety:** Full XML entity escaping (`escapeXml`) for labels, categories, and titles to prevent XML syntax breakage or XSS vulnerabilities.

### 2.3 High-Resolution PNG Diagram (`.png`)
- **Generator Module:** [`src/import-export/exportPngDiagram.ts`](file:///d:/ALL%20Project/1/src/import-export/exportPngDiagram.ts)
- **MIME Type:** `image/png`
- **Filename Pattern:** `<project-slug>-architecture.png`
- **Characteristics:**
  - **High-DPI Retina Quality:** Default $2\times$ pixel ratio scale multiplier for razor-sharp rendering on Retina/4K displays.
  - **Offscreen HTML5 Canvas:** Renders the standalone SVG into an offscreen `<canvas>` with `imageSmoothingQuality = 'high'`.
  - **Solid Contrast Background:** Explicit `#0d1117` fill ensures clean embedding in light or dark presentation decks without transparent checkerboards.
  - **Memory Cleanup:** Automatic revocation of object URLs (`URL.revokeObjectURL`) upon blob generation and download dispatch.

### 2.4 Editorial Markdown Storyboard (`.md`)
- **Generator Module:** [`src/import-export/exportMarkdownStoryboard.ts`](file:///d:/ALL%20Project/1/src/import-export/exportMarkdownStoryboard.ts)
- **MIME Type:** `text/markdown;charset=utf-8`
- **Filename Pattern:** `<project-slug>-storyboard.md`
- **Characteristics:**
  - **Project Header & Runtime:** Total calculated runtime formatted as `MM:SS` (or `HH:MM:SS`), scene count, and production status metrics.
  - **Chronological Scenes:** Scenes ordered by `sceneNumber`, detailing duration, camera framing, production status, and act category.
  - **Spoken Dialogue:** Formatted as Markdown blockquotes (`> Spoken line`).
  - **Cues & Technical Notes:** Highlighted voice-over, music/audio notes, visual FX, and typography cues.
  - **Production Checklist:** Interactive Markdown task items (`- [x]` completed, `- [ ]` pending).

### 2.5 Structured Markdown Study Guide (`.md`)
- **Generator Module:** [`src/import-export/exportMarkdownStoryboard.ts`](file:///d:/ALL%20Project/1/src/import-export/exportMarkdownStoryboard.ts)
- **MIME Type:** `text/markdown;charset=utf-8`
- **Filename Pattern:** `<project-slug>-study-guide.md`
- **Characteristics:**
  - **Mastery Summary:** Percentage mastered and count breakdown (`X / Y Mastered`).
  - **Core Concepts:** Formatted sections for concepts with mastery badges (`LEARNING`, `REVIEWING`, `MASTERED`), `#keyterms` tags, and summaries.
  - **Flashcard Practice Decks:** Question prompts with answer reveals, memory hints, and review history (`Reviewed: Nx • Last Confidence: good`).

---

## 3. UI Integration & Accessibility

1. **Trigger:** The "Export" action in the `WorkspaceHeader` opens the `ExportDialog` modal.
2. **Accessible Dialog:**
   - Follows WAI-ARIA Modal Dialog pattern (`role="dialog"`, `aria-labelledby`, `aria-modal="true"`).
   - Traps keyboard focus while open and restores focus to the trigger upon exit.
   - Esc key closes dialog; backdrop click closes dialog.
3. **Download Mechanism:**
   - Generates temporary Blobs via `URL.createObjectURL(blob)`.
   - Dispatches native download anchor with user-friendly file names.
   - Revokes object URLs cleanly to prevent memory leaks.
   - Surfaces non-blocking toast notifications (`useToast`) confirming successful export.
