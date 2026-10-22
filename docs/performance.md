# Performance Specification (`docs/PERFORMANCE.md`)

> **Measurement Status:** All numerical values in this document are **engineering targets**, not measured results, because no application code exists yet (`v0.0.0-spec`). Once Phase 1+ is implemented, verify actual measurements using the profiling methods in Section 5.

## 1. Performance Objectives & Target Budgets

MindRail Studio must feel as immediate and fluid as a native desktop creative application, even on mid-range laptops, Chromebooks, and mobile devices.

| Metric | Target Budget (Proposed) | Condition |
| :--- | :--- | :--- |
| **Initial JS Bundle Size (Gzipped)** | `≤ 180 KB` gzipped (`≤ 550 KB` uncompressed) | Production build (`npm run build`), initial route load |
| **Initial CSS Size (Gzipped)** | `≤ 25 KB` gzipped | All design tokens and core layout styles |
| **First Contentful Paint (FCP)** | `≤ 1.0s` (target) | Local / static CDN over fast 4G / broadband |
| **Time to Interactive (TTI)** | `≤ 1.5s` (target) | Cold start to interactive Landing or Workspace view |
| **Canvas Pan & Zoom Frame Time** | `≤ 16.6ms` per frame (`60fps` target) | Canvas containing `200` nodes and `300` edges |
| **Single/Multi-Node Drag Frame Time** | `≤ 16.6ms` per frame (`60fps` target) | Dragging `1–20` selected nodes on a `200`-node canvas |
| **Project Hydration from IndexedDB** | `≤ 80ms` (target) | Loading a `200`-node project from `IndexedDB` into state |
| **Autosave Main-Thread Blocking Time** | `≤ 8ms` synchronous overhead | Cloning/serializing payload and initiating `IndexedDB` transaction |
| **Memory Footprint (Active Editor)** | `≤ 120 MB` JS heap (target) | After 30 minutes of editing with a 50-step Undo stack |

---

## 2. Bundle Size & Lazy Loading Strategy

1. **Zero Heavy Framework Bloat:**
   - Use native CSS Custom Properties and CSS Modules instead of runtime CSS-in-JS libraries.
   - Use custom lightweight SVG icons rather than importing entire multi-megabyte icon packs.
2. **Route & Workspace Code Splitting (`React.lazy`):**
   - Keep the initial shell (`LandingView`, `ProjectLibraryView`, and core `domain`/`persistence` modules) in the primary entry chunk.
   - Lazy-load workspace-specific heavy modules (`DeveloperWorkspacePlugin`, `VideoWorkspacePlugin`, `StudentWorkspacePlugin`) and secondary export utilities (`exportSvgDiagram`, `exportMarkdownSummary`) on demand.

---

## 3. Rendering Large Canvases & Interaction Responsiveness

### 3.1 Hardware-Accelerated Viewport Transforms
- Apply canvas pan and zoom exclusively through a single container CSS rule:
  `transform: translate3d(var(--pan-x), var(--pan-y), 0) scale(var(--zoom))`
- Never recalculate or mutate individual node DOM styles (`top`, `left`, `width`, `height`) when panning or zooming the camera.
- Position individual nodes using `transform: translate3d(${x}px, ${y}px, 0)` rather than `top`/`left` to avoid layout reflows during node dragging.

### 3.2 Minimizing Unnecessary React Renders
- **Transient Drag Isolation:** As specified in [docs/STATE\_MANAGEMENT.md](https://www.google.com/search?q=STATE_MANAGEMENT.md), pointer move events during node dragging update only the transient drag store (`canvasInteractionStore.ts`). Unselected nodes must **not** re-render while another node is dragged.
- **Component Memoization (`React.memo`):**
  - `NodeContainer` receives primitive props (`node`, `isSelected`, `isFocused`, `activeDragDx`, `activeDragDy`). Since `node` is immutable, unselected nodes skip re-rendering entirely during selection changes or drags.
  - `CanvasEdgePath` only recalculates its SVG `d` path string when its `sourceNode` or `targetNode` position/dimensions change.

### 3.3 Viewport Culling & Level-of-Detail (LOD) Scaling
For canvases exceeding `100` nodes:
1. **Viewport Bounding-Box Culling:** Compute the visible world-space rectangle from `(viewport.x, viewport.y, viewport.zoom, windowWidth, windowHeight)` expanded by a `300px` overscan margin. Nodes whose bounding boxes fall completely outside the overscan rectangle (and are not currently selected or focused) can be virtualized or rendered as lightweight shell placeholders.
2. **Low-Zoom Detail Simplification (`zoom < 0.45`):** When zoomed far out (`< 45%`), hide secondary node footer badges, code block syntax tokens, and inline subtask checklists via a CSS class on the viewport container (`.canvas-zoom-low`) so the browser paints simple high-contrast title cards.

---

## 4. Autosave Scheduling, Memory Management & Media Limits

### 4.1 Non-Blocking Autosave Scheduling
- Debounce `IndexedDB` writes by `1000ms` after the last committed mutation.
- Do **not** trigger `IndexedDB` writes on every `pointermove` or keystroke; only write committed state transitions.

### 4.2 Undo/Redo Memory Management
- Cap `undoStack` strictly at `50` entries (`MAX_HISTORY_DEPTH = 50`).
- Because node and edge arrays use structural sharing (unchanged `CanvasNode` objects retain their object reference across immutable edits), storing 50 history snapshots of a 200-node project consumes minimal additional RAM.
- Clear `undoStack` and `redoStack` when unmounting the editor or switching to a different project.

### 4.3 Image & Diagram Export Processing Limitations
- When generating `.svg` or `.png` exports in the browser:
  - Cap rasterized `<canvas>` export dimensions at a maximum of **`8192 × 8192` pixels** (or `16,777,216` total pixels on mobile Safari/iOS) to respect browser canvas memory ceilings.
  - If a user's diagram bounding box exceeds the safe rasterization limit, automatically scale down the PNG pixel ratio or advise exporting as vector `.svg` (which has no pixel dimension ceiling).
  - Always call `URL.revokeObjectURL(blobUrl)` immediately after triggering file downloads to prevent `Blob` memory leaks.

### 4.4 Low-Powered Devices & Mobile Performance
- Avoid continuous `backdrop-filter: blur(...)` on individual canvas nodes (which forces expensive GPU offscreen passes for every node). Restrict `backdrop-filter` strictly to the fixed Top Studio Header and floating bottom-left HUD (`≤ 2` blurred layers on screen).
- On mobile viewports (`< 768px`), offer the **Structured Outline / Card List View** alongside the 2D canvas for ultra-fast scrolling on low-end mobile GPUs.

---

## 5. How to Verify Performance (Measurement Protocol)

Never claim performance targets are met based on intuition. Once the application is implemented, verify performance using these concrete steps:

1. **Bundle Size Check:**
   - Run `npm run build` and inspect the Vite Rollup output table for raw and `gzip` sizes of all `.js` and `.css` chunks.
2. **Synthetic Stress Fixture (`200 Nodes / 300 Edges`):**
   - Create a deterministic test generator (`src/domain/__fixtures__/createLargeProjectFixture.ts`) that outputs a valid project with `200` nodes and `300` edges.
3. **Chrome DevTools Performance Profiling (`4x CPU Slowdown`):**
   - Load the 200-node fixture in `npm run preview`.
   - Open Chrome DevTools -> **Performance** tab, set CPU throttling to **4x slowdown**, and record:
     - A 3-second continuous canvas pan and zoom gesture.
     - A 3-second multi-node drag of 10 selected nodes.
   - Inspect the **Frames** track and **Main** thread flamechart to verify frame times stay within `16.6ms` (no long tasks `> 50ms` during drag).
4. **Memory Heap Snapshot Verification:**
   - Open Chrome DevTools -> **Memory** tab, take Heap Snapshot 1, perform 50 node edits + 5 exports + project switch, force garbage collection, and take Heap Snapshot 2 to confirm zero detached DOM trees or leaked `Blob` URLs.
