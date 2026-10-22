# User Experience Flows (`docs/UX_FLOWS.md`)

> **Implementation Status:** Fully Implemented and Verified (`v0.1.0-release`). Defines the end-to-end step-by-step user journeys, application responses, and error states for MindRail Studio.

Each flow below specifies its **Starting Condition**, **User Actions**, **Application Responses**, **Error States**, and **Successful Outcome**.

---

## Flow 1: First Visit (Cold Start)

- **Starting Condition:** User opens MindRail Studio in a browser profile with an empty `IndexedDB` (`mindrail_studio_db` has 0 projects).
- **User Actions:**
  1. Navigates to the application root URL (`#/`).
  2. Reviews the three workspace cards (**Developer**, **Video Creator**, **Student**) or clicks **Explore Templates** / **Import Project**.
- **Application Responses:**
  1. Initializes the `IndexedDB` schema (`mindrail_studio_db`, version `1`) and reads UI preferences from `localStorage`.
  2. Renders the Landing View with zero authentication prompts, zero cookie banners (as no tracking cookies exist), and clear local-first storage badges.
  3. Displays quick-start buttons for each workspace and a drag-and-drop import target.
- **Error States:**
  - *IndexedDB Blocked / Disabled (e.g., strict browser privacy settings):* Application displays a persistent warning banner: `"Local browser storage (IndexedDB) is unavailable in this window. You can still create and edit a project in memory, but you must export a .mindrail.json file before closing the tab."`
- **Successful Outcome:** User understands the three workspaces and can launch a blank or templated project in a single click.

---

## Flow 2: Starting a Blank Project

- **Starting Condition:** User is on the Landing View (`#/`) or Project Library (`#/projects`).
- **User Actions:**
  1. Clicks **New Project** and selects a workspace type (`Developer`, `Video Creator`, or `Student`).
  2. Optionally enters a project title (defaults to `"Untitled Developer Project"`, `"Untitled Video Storyboard"`, or `"Untitled Study Map"`).
- **Application Responses:**
  1. Generates a new `Project` record with a `crypto.randomUUID()` identifier, `schemaVersion: 1`, empty `nodes: []` and `edges: []`, and default viewport `{ x: 0, y: 0, zoom: 1 }`.
  2. Saves the initial record to `IndexedDB` (`projects` object store).
  3. Navigates to `#/workspace/:workspaceType/:projectId`.
  4. Renders the canvas with an interactive **Empty Canvas Onboarding Card** showing keyboard shortcuts (`Press N to add a node`, `Drag from ports to connect`, `Ctrl/Cmd+K for commands`).
- **Error States:**
  - *Storage Write Failure:* Opens the project in in-memory session mode and displays the `Save failed — Export backup` status badge.
- **Successful Outcome:** User is inside the active workspace editor with a persisted empty project ready for node creation.

---

## Flow 3: Creating a Project from a Template

- **Starting Condition:** User is on the Template Gallery (`#/templates`) or clicks a starter template on the Landing View.
- **User Actions:**
  1. Filters templates by workspace (`Developer`, `Video Creator`, or `Student`).
  2. Clicks **Use Template** on a template card (e.g., `"Microservice Architecture & Sprint Tasks"`).
- **Application Responses:**
  1. Deep-clones the template definition.
  2. Re-maps every template node ID and edge ID to a fresh `crypto.randomUUID()` while preserving all internal `sourceNodeId` and `targetNodeId` references.
  3. Sets `createdAt` and `updatedAt` to the current ISO-8601 timestamp.
  4. Persists the new project in `IndexedDB` and routes to `#/workspace/:workspaceType/:newProjectId` with the viewport centered on the template nodes.
- **Error States:**
  - *Corrupted Custom Template:* If a user-saved custom template fails validation, displays an error toast and keeps the user on `#/templates` with an option to delete the corrupted custom template.
- **Successful Outcome:** User opens a fully populated, editable project independent of the original template.

---

## Flow 4: Editing a Canvas (Pan, Zoom, Viewport Controls)

- **Starting Condition:** User has an active project open in `#/workspace/:workspaceType/:projectId`.
- **User Actions:**
  1. Pans the canvas using `Space + Left Drag`, middle-mouse drag, two-finger trackpad scroll, or keyboard pan shortcuts.
  2. Zooms the canvas using `Ctrl/Cmd + Scroll Wheel`, the `+` / `-` HUD buttons, `Ctrl/Cmd + 0` (reset to 100%), or `Shift + 1` (fit all nodes in view).
- **Application Responses:**
  1. Updates the CSS hardware-accelerated viewport transform (`translate3d(x, y, 0) scale(zoom)`) at 60fps.
  2. Updates the zoom percentage readout in the bottom-left HUD.
  3. Debounces persisting the updated `viewport` coordinates to `IndexedDB` so scroll frames never block the main thread.
- **Error States:**
  - *Zoom Out of Bounds:* Clamps zoom strictly to `[0.15, 3.0]` so the user never loses the canvas at `0x` or `Infinity`.
- **Successful Outcome:** User navigates smoothly across the canvas and can always return to their nodes via **Fit to Screen (`Shift + 1`)**.

---

## Flow 5: Creating and Connecting Nodes (Pointer & Keyboard)

- **Starting Condition:** User is inside the Canvas Editor.
- **User Actions:**
  1. **Create First Node:** Clicks a node type in the Left Creation Palette (e.g., `Service Node` in Developer, `Scene Card` in Video, `Concept Node` in Student) or presses `N`.
  2. **Create Second Node:** Adds a second node on the canvas.
  3. **Connect Nodes (Pointer):** Drags from the output port handle of Node A to the input port handle of Node B.
  4. **Connect Nodes (Keyboard Alternative):** Selects Node A, presses `C` (Start Connection mode), uses `Tab` / Arrow keys to highlight target Node B, and presses `Enter` to confirm the connection.
- **Application Responses:**
  1. Renders a live preview connection line during pointer drag or highlights candidate target nodes during keyboard connection mode.
  2. Validates the proposed connection (rejects self-loops `Node A -> Node A` and duplicate identical edges).
  3. Commits the new `CanvasEdge` to project state, pushes an entry onto the Undo stack, and triggers debounced autosave.
- **Error States:**
  - *Invalid Connection Target (Self-Loop or Duplicate Edge):* Cancels the pending connection line and shows a subtle status message (`"Cannot connect a node to itself"` or `"Connection already exists"`).
- **Successful Outcome:** Two typed nodes exist on the canvas connected by a directed edge that dynamically tracks node movement.

---

## Flow 6: Editing Node Properties

- **Starting Condition:** At least one node exists on the canvas.
- **User Actions:**
  1. Selects a node by clicking it or navigating to it with `Tab` / `Enter`.
  2. Edits common fields in the Right Inspector Panel (Title, Category, Semantic Color, Description) or workspace-specific fields:
     - *Developer:* Code language, code snippet text, task status (`todo` -> `in-progress`), priority.
     - *Video Creator:* Scene duration (`45s`), framing (`Close-Up`), spoken script, voice-over cue, shot status.
     - *Student:* Concept mastery level (`learning` -> `mastered`), flashcard front/back text, checklist items.
- **Application Responses:**
  1. Updates the selected node's visual appearance on the canvas immediately (e.g., updating title, color badge, scene duration roll-up, or mastery badge).
  2. Records an undoable state transition (coalescing rapid keystrokes within the same field into logical history checkpoints).
  3. Schedules an asynchronous `IndexedDB` autosave.
- **Error States:**
  - *Invalid Numeric Input (e.g., negative scene duration):* Displays inline field validation error (`"Duration must be 0 or greater"`) and prevents storing `NaN` or negative numbers.
- **Successful Outcome:** Node visual card, workspace summary metrics, and persisted project state reflect the updated properties.

---

## Flow 7: Undoing and Redoing Changes

- **Starting Condition:** User has performed one or more structural edits (added node, moved node, edited property, deleted edge) in the current session.
- **User Actions:**
  1. Presses `Ctrl/Cmd + Z` or clicks the **Undo** button in the top header.
  2. Presses `Ctrl/Cmd + Shift + Z` (or `Ctrl/Cmd + Y`) or clicks the **Redo** button.
- **Application Responses:**
  1. On **Undo**, pops the most recent state snapshot/command from `undoStack`, pushes the current state onto `redoStack`, restores the previous `Project` document state, and announces `"Undid <action name>"` to screen readers via an ARIA live region.
  2. On **Redo**, pops from `redoStack`, pushes to `undoStack`, and reapplies the change.
  3. Triggers debounced autosave so `IndexedDB` stays synchronized with the restored state.
- **Error States:**
  - *Empty Undo/Redo Stack:* Toolbar buttons are disabled (`aria-disabled="true"`) and keyboard shortcuts perform a safe no-op.
- **Successful Outcome:** User can step backward and forward through their session edits without data corruption or orphaned edges.

---

## Flow 8: Saving Locally (Autosave & Explicit Save)

- **Starting Condition:** User modifies a project in the Canvas Editor.
- **User Actions:**
  1. Continues editing normally (relying on autosave) or presses `Ctrl/Cmd + S` for an immediate save.
- **Application Responses:**
  1. Immediately marks the header save indicator as `Unsaved changes...`.
  2. After `1000ms` of edit inactivity (or immediately upon `Ctrl/Cmd + S`), opens a readwrite `IndexedDB` transaction on `projects`, updates `updatedAt`, and writes the serialized `Project` object.
  3. Updates the header indicator to `Saved locally` with a timestamp tooltip (`"Last saved to browser storage at 14:32:10"`).
- **Error States:**
  - *Tab Closed Before Debounce Finishes:* A `beforeunload` listener checks `hasUnsavedChanges`; if true, attempts an immediate flush and triggers the browser's native unsaved-changes confirmation prompt.
- **Successful Outcome:** All project mutations are durably stored in `IndexedDB` without manual save friction.

---

## Flow 9: Exporting a Project

- **Starting Condition:** User has a project open in the Editor or selected in the Project Library.
- **User Actions:**
  1. Clicks **Export** in the header and chooses **Project File (`.mindrail.json`)** (or workspace-specific SVG/Markdown export).
- **Application Responses:**
  1. Serializes the current normalized `Project` state into a formatted JSON string (`JSON.stringify(exportEnvelope, null, 2)`) conforming to [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=IMPORT_EXPORT_SPEC.md).
  2. Generates a slugified filename: `<project-slug>-<YYYY-MM-DD>.mindrail.json`.
  3. Creates a `Blob` (`application/vnd.mindrail.project+json`) and triggers a browser file download.
  4. Records `lastExportedAt` metadata and displays a confirmation toast (`"Exported <filename>"`).
- **Error States:**
  - *Serialization Error:* Displays an error modal with diagnostic details without crashing the editor.
- **Successful Outcome:** User possesses a portable, human-readable `.mindrail.json` backup file on their local disk.

---

## Flow 10: Importing a Project

- **Starting Condition:** User clicks **Import Project** on the Landing Page, Project Library, or Editor Header, or drags a `.mindrail.json` file onto the dropzone.
- **User Actions:**
  1. Selects a `.mindrail.json` (or `.json`) file from their device.
  2. Reviews the Import Preview Dialog showing the project title, workspace type, node count, edge count, and schema version.
  3. If a project with the same UUID already exists locally, selects either **Import as New Copy** or **Replace Existing Project**.
  4. Clicks **Confirm Import**.
- **Application Responses:**
  1. Runs the multi-stage validation pipeline ([docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=IMPORT_EXPORT_SPEC.md)): size check, JSON parse with prototype-pollution reviver, schema version check/migration, and referential integrity check.
  2. Writes the validated `Project` to `IndexedDB`.
  3. Navigates to `#/workspace/:workspaceType/:projectId` and fits the canvas viewport to the imported nodes.
- **Error States:**
  - Handled in Flow 11 below.
- **Successful Outcome:** Imported project opens cleanly in the appropriate workspace with all nodes, connections, and metadata intact.

---

## Flow 11: Handling Invalid Imports

- **Starting Condition:** User attempts to import a file that is oversized (>10 MB), non-JSON binary data, syntax-corrupted JSON, an unsupported future schema version, or missing required fields.
- **User Actions:**
  1. Selects or drops the invalid file in the Import Modal.
- **Application Responses:**
  1. Aborts the import pipeline before touching active project state or `IndexedDB`.
  2. Renders a structured **Import Validation Failed** alert inside the modal explaining:
     - **What failed:** e.g., `"Invalid JSON syntax at line 42"`, `"Unsupported schemaVersion: 99 (this version of MindRail Studio supports up to schemaVersion 1)"`, or `"Edge 'e-12' references missing targetNodeId 'n-404'"`.
     - **How to recover:** Suggests selecting a valid `.mindrail.json` file or, in the case of dangling edges, offers an optional **"Import & Strip Broken Connections"** repair action when only non-critical edge references are broken.
- **Error States:**
  - Active project in memory and existing projects in `IndexedDB` remain 100% untouched.
- **Successful Outcome:** User receives clear, actionable feedback and experiences zero corruption of existing work.

---

## Flow 12: Recovering from a Storage Failure

- **Starting Condition:** While editing a project, an `IndexedDB` write throws `QuotaExceededError`, `InvalidStateError`, or a transaction abort.
- **User Actions:**
  1. Sees the persistent red/amber **Storage Error Banner** at the top of the workspace.
  2. Clicks **Export Emergency Backup (`.mindrail.json`)** directly inside the banner.
  3. Optionally navigates to `#/projects` or `#/settings` to delete old unused projects and free browser quota, then clicks **Retry Local Save**.
- **Application Responses:**
  1. Keeps the full current project alive in browser memory (`React` state) so the user does not lose their in-progress session.
  2. Immediately downloads the `.mindrail.json` file when the emergency export button is clicked.
  3. When **Retry Local Save** succeeds, clears the error banner and restores the `Saved locally` indicator.
- **Error States:**
  - If the user attempts to close the browser tab while the storage failure is unresolved and the project has not been exported Since the last edit, triggers the browser `beforeunload` warning.
- **Successful Outcome:** User preserves 100% of their work via local file export despite browser storage quota exhaustion.

---

## Flow 13: Returning to a Previous Project

- **Starting Condition:** User reopens MindRail Studio in the same browser profile hours or days later.
- **User Actions:**
  1. Opens `#/` or `#/projects`.
  2. Clicks a project card from **Recent Projects** or the **Project Library**.
- **Application Responses:**
  1. Reads the project record from `IndexedDB` (`projects` store by `id`).
  2. Validates the loaded record against the current schema.
  3. Restores the exact workspace type, nodes, edges, and last saved viewport `(x, y, zoom)`.
- **Error States:**
  - *Project ID Not Found (e.g., user bookmarked a deleted project URL `#/workspace/developer/deleted-id`):* Renders a clear **Project Not Found Locally** empty state with buttons to **Return to Project Library** or **Import `.mindrail.json` File**.
- **Successful Outcome:** User resumes work seamlessly from their exact prior state.

---

## Flow 14: Using the Interface on Mobile (`< 768px`)

- **Starting Condition:** User opens MindRail Studio on a smartphone or narrow viewport (`< 768px` width).
- **User Actions:**
  1. Opens a project from `#/projects`.
  2. Uses touch gestures (one-finger pan on background, pinch-to-zoom, tap node to select) OR toggles **Outline / Card List View** in the bottom bar for comfortable vertical scrolling.
  3. Taps **Edit Node** to open the bottom-sheet Inspector, updates text or checklists, and swipes/taps to close the sheet.
- **Application Responses:**
  1. Automatically collapses the desktop left/right sidebars into a touch-friendly bottom action bar (`min-height: 44px` touch targets per [docs/ACCESSIBILITY.md](https://www.google.com/search?q=ACCESSIBILITY.md)).
  2. Synchronizes edits made in the mobile **Outline / Card List View** and the **2D Visual Canvas** in real time against the same underlying `Project` state.
- **Error States:**
  - *Accidental Touch Drag While Scrolling:* In mobile mode, moving a node on the 2D canvas requires explicit selection first (or using the Outline view) so casual panning does not accidentally scramble node layouts.
- **Successful Outcome:** User can review, edit, check off items, run study timers, and export projects comfortably on a mobile screen.

---

## Flow 15: Selecting, Inspecting, Modifying & Deleting Canvas Connections (Edges)

- **Starting Condition:** Active canvas containing two or more connected nodes.
- **User Actions:**
  1. **Select Connection:** Left-clicks directly on the visible connection line or its 24px wide hit-test halo.
  2. **Inspect Connection:** Right-hand panel switches to the `EdgeInspector`, displaying relationship label, routing style (`bezier`, `orthogonal`, `straight`), stroke pattern, source node summary, and target node summary.
  3. **Context Menu:** Alternatively, right-clicks the connection line to display the `EdgeContextMenu` directly under the cursor with quick actions (Inspect, Bezier, Orthogonal, Straight, Delete).
  4. **Delete Connection:** Clicks "Delete Connection" in the inspector or context menu, or presses the `Delete` or `Backspace` key on the keyboard.
- **Application Responses:**
  1. Renders a glowing `--mr-color-primary` selection halo (`.edgeSelectionHalo`) underneath the connection stroke.
  2. Clears any active node selections to maintain clean single-entity selection semantics.
  3. When deleted, dispatches `DELETE_EDGES([selectedEdgeId])`, removes the edge without disturbing either endpoint node, pushes the operation onto the undo stack, and announces `"Deleted connection"` to screen readers via `aria-live="polite"`.
- **Error States:**
  - *Accidental Background Marquee Trigger:* Clicking the 24px hit area calls `stopPropagation()`, ensuring edge selection never inadvertently triggers canvas panning or marquee selection.
- **Successful Outcome:** Connection line is reliably selectable, inspectable, re-routable, and deletable without touching endpoint nodes.

---

## Flow 16: Multi-Project Full Backup & Restore Pipeline

- **Starting Condition:** User is on the Settings view (`#/settings`) or Project Library (`#/projects`).
- **User Actions:**
  1. **Export All Projects Backup:** Clicks "Export All Projects Backup" in `#/settings`.
  2. **Restore Backup Archive:** Under "Restore Backup Archive (.json)", selects an exported backup file or drags it onto the dropzone.
  3. **Duplicate Conflict Decision:** If any projects in the archive match existing local project IDs, the modal prompts the user to choose: **Keep Existing & Import as Copy** (assigns fresh UUIDs) or **Overwrite Existing Projects**.
- **Application Responses:**
  1. `validateBackupArchive` validates that the payload has `format: 'mindrail-backup-archive'` or is a valid array of projects.
  2. Displays total project count, total node count, and archive size before committing.
  3. Saves all imported projects into `IndexedDB` (`mindrail_studio_db`), updates the project list, and surfaces a success toast.
- **Error States:**
  - *Attempting to Import Archive in Single-Project Dialog:* If a user attempts to load a multi-project archive into the single-project import modal, the validator detects the archive format and shows actionable guidance: `"This file is a multi-project backup archive. Please restore it from Settings -> Restore Backup Archive."`
- **Successful Outcome:** All user projects across all workspaces are safely backed up and restored without data loss or corruption.

---

## Flow 17: Local Study Timer and Mastery Practice in Student Workspace

- **Starting Condition:** User opens a project in the Student Workspace (`#/workspace/student/:projectId`).
- **User Actions:**
  1. **Study Timer:** Clicks **Start Focus (25m)** in the top header or study timer widget. Works through nodes/concepts until the session ends or takes a break (5m).
  2. **Flashcard Practice Deck:** Clicks **Practice Flashcards (N)** to launch the interactive study deck modal.
  3. Flips cards between question and answer, optionally toggling hints, and rates recall confidence: **Learning**, **Reviewing**, or **Mastered**.
- **Application Responses:**
  1. The study timer runs drift-free across background tabs using timestamp deltas. When a focus session completes, a bell chimes, a notification is announced, and the completed minutes/sessions are committed to project metadata and persisted to `IndexedDB`.
  2. The flashcard practice deck computes overall mastery percentage in real time, updating node mastery badges on the canvas.
- **Error States:**
  - *No Flashcards in Project:* Practice deck button is gracefully disabled with a helpful tooltip: `"Add at least one flashcard node to practice."`
- **Successful Outcome:** Student tracks study time locally and masters concepts through active recall without any external cloud service.
