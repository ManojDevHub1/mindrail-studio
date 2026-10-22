# State Management Specification (`docs/STATE_MANAGEMENT.md`)

> **Implementation Status:** Specified (Not Yet Implemented). Defines how application, document, canvas interaction, and undo/redo history states are structured and coordinated in MindRail Studio.

## 1. Core State Architecture Philosophy

MindRail Studio avoids unnecessary external state management libraries in favor of **domain-partitioned React state (`useReducer` + split Contexts + custom hooks)**.

The single most important architectural rule for state management in a visual canvas editor is:

> **Strictly separate high-frequency transient interaction state (60fps pointer drags, marquee boxes, hover ports) from persistent document history state (`Project` nodes, edges, and Undo/Redo snapshots).**

Combining transient drag coordinates with the persistent document reducer causes full-tree re-renders and floods the Undo/Redo stack with hundreds of intermediate pixel positions.

---

## 2. State Categories & Lifecycles

| State Category | Owner Module | Storage Backing | Update Frequency | Recorded in Undo/Redo? |
| :--- | :--- | :--- | :--- | :--- |
| **1. Persistent Project Document State** | `ProjectDocumentContext` (`projectReducer.ts`) | `IndexedDB` (`projects` store) | On committed user actions (`pointerup`, form change, shortcut) | **Yes** (Nodes, Edges, Settings, Checklists, Title) |
| **2. Undo / Redo History State** | `ProjectDocumentContext` (`projectReducer.ts`) | Browser RAM (per open project session) | On committed structural mutations | N/A (Manages the history stack itself) |
| **3. Viewport Camera State** | `ViewportContext` | Debounced to `Project.viewport` in `IndexedDB` | `60fps` during pan/zoom | **No** (Zooming/panning must not undo node edits) |
| **4. Canvas Selection & Transient Interaction State** | `CanvasInteractionContext` | Browser RAM | `60fps` during pointer drag, resize, marquee, or port connection | **No** |
| **5. Autosave & Storage Sync State** | `useAutosave` hook | Browser RAM + `IndexedDB` | On edit commit & transaction completion | **No** |
| **6. Global UI Preferences** | `PreferencesContext` | `localStorage` (`mindrail:prefs:v1`) | On user toggle in Header or `#/settings` | **No** |

---

## 3. Persistent Project & Undo/Redo History Reducer

```typescript
export interface HistoryEntry {
  readonly label: string; // e.g., "Add Service Node", "Move 3 Nodes", "Connect Nodes"
  readonly timestamp: number;
  readonly projectSnapshot: Project;
}

export interface ProjectEditorState {
  readonly project: Project;
  readonly undoStack: readonly HistoryEntry[]; // Bounded to max 50 entries
  readonly redoStack: readonly HistoryEntry[];
  readonly revision: number; // Increments on every committed mutation for autosave detection
}
```

### Undo / Redo Rules
1. **Bounded Stack Depth:** Cap `undoStack` at **50 entries** (`MAX_HISTORY_DEPTH = 50`), dropping the oldest entry when exceeded so memory usage stays flat during long editing sessions.
2. **Pointer Commit Discipline:**
   - During a node drag (`pointerdown` -> `pointermove`...), `project.nodes` is **not** mutated on every frame; instead, `transientDragDelta` (`{ dx, dy }`) is applied visually to the selected node containers.
   - On `pointerup`, if `dx !== 0 || dy !== 0`, a single `MOVE_NODES_COMMIT` action is dispatched to `projectReducer`, creating **one** `HistoryEntry` and clearing `redoStack`.
3. **Text Input Coalescing:**
   - When typing inside the Node Inspector (e.g., editing `title`, `description`, `scriptText`, or `code`), coalesce consecutive keystrokes targeting the same `(nodeId, fieldName)` within a `1000ms` window into a single `HistoryEntry` so pressing `Ctrl/Cmd + Z` undoes a logical phrase rather than a single character.
4. **Selection Reconciliation on Undo:**
   - When `UNDO` or `REDO` removes a node or edge that is currently in `selectedNodeIds` or `selectedEdgeIds`, automatically prune the missing IDs from the selection set so the Right Inspector never points to a non-existent entity.

---

## 4. Transient Canvas Interaction State

Managed in `src/state/canvasInteractionStore.ts` to keep 60fps gestures isolated:

```typescript
export type CanvasInteractionMode =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'panning';
      readonly startClientX: number;
      readonly startClientY: number;
      readonly initialViewport: ViewportState;
    }
  | {
      readonly kind: 'dragging-nodes';
      readonly nodeIds: readonly EntityId[];
      readonly startCanvasPos: CanvasPosition;
      readonly currentDelta: CanvasPosition;
    }
  | {
      readonly kind: 'resizing-node';
      readonly nodeId: EntityId;
      readonly initialDimensions: CanvasDimensions;
      readonly currentDimensions: CanvasDimensions;
    }
  | {
      readonly kind: 'marquee-selecting';
      readonly startCanvasPos: CanvasPosition;
      readonly currentCanvasPos: CanvasPosition;
    }
  | {
      readonly kind: 'connecting-port';
      readonly sourceNodeId: EntityId;
      readonly sourcePort: PortSide;
      readonly currentCursorPos: CanvasPosition;
      readonly hoveredTargetNodeId?: EntityId;
      readonly hoveredTargetPort?: PortSide;
      readonly viaKeyboard: boolean;
    };

export interface CanvasSelectionState {
  readonly selectedNodeIds: ReadonlySet<EntityId>;
  readonly selectedEdgeIds: ReadonlySet<EntityId>;
  readonly focusedNodeId: EntityId | null;
}
```

---

## 5. Autosave Scheduling, Unsaved Changes & Concurrency Guards

```typescript
export type SaveLifecycleStatus =
  | { readonly status: 'saved'; readonly lastSavedAt: IsoTimestamp }
  | { readonly status: 'unsaved-changes' }
  | { readonly status: 'saving' }
  | {
      readonly status: 'error';
      readonly errorKind: 'quota-exceeded' | 'storage-unavailable' | 'unknown';
      readonly message: string;
    };
```

### Preventing Accidental Data Loss & Race Conditions
1. **Monotonic Revision Counter (`revision`):**
   - Every committed reducer action increments `state.revision`.
   - When an asynchronous `IndexedDB` write starts for `revision === R1`, if the user makes another edit (`revision === R2`) while `R1` is still writing, the autosave hook waits for `R1` to finish and immediately schedules a follow-up write for `R2`.
   - Status only transitions to `'saved'` when `lastPersistedRevision === currentRevision`.
2. **Flush on Route Navigation:**
   - When navigating away from `#/workspace/:workspaceType/:projectId` to `#/projects` or `#/`, immediately flush any pending debounced save before unmounting the editor provider.
3. **Browser Tab `beforeunload` Protection:**
   - Attach a `window.addEventListener('beforeunload', ...)` listener whenever `saveStatus.status === 'unsaved-changes' || saveStatus.status === 'error'` so closing the browser tab prompts the user first.

---

## 6. Derived State & Component Memoization Boundaries

- **Derived Workspace Metrics:** Compute video scene timecodes, cumulative duration, developer task counts, and student flashcard mastery statistics via `useMemo` hooks calling pure functions in `src/domain/calculators.ts`.
- **Component Boundaries to Minimize Re-Renders:**
  1. Wrap `NodeContainer` and `CanvasEdgePath` in `React.memo`.
  2. Pass primitive props (`isSelected: boolean`, `isFocused: boolean`, `dragOffsetX: number`, `dragOffsetY: number`) to each `NodeContainer` rather than passing the entire `selectedNodeIds` `Set` or `interactionMode` object, so selecting or dragging one node only re-renders the affected node(s) and their connected edges.
