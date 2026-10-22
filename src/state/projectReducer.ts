/**
 * Project document reducer and undo/redo history engine.
 * Conforms to docs/STATE_MANAGEMENT.md and docs/DATA_MODEL.md.
 */
import type {
  CanvasDimensions,
  CanvasEdge,
  CanvasNode,
  CanvasPosition,
  EntityId,
  NodeColorToken,
  Project,
  ProjectChecklistItem,
  ProjectSettings,
} from '../domain/models';
import type { WorkspaceNodePayload } from '../domain/workspaceTypes';
import { pruneEdgesConnectedToNodes, sanitizeProjectEdges } from '../domain/integrity';
import { getCurrentIsoTimestamp } from '../domain/factories';

export const MAX_HISTORY_DEPTH = 50;
export const HISTORY_COALESCE_WINDOW_MS = 1000;

export interface HistoryEntry {
  readonly label: string;
  readonly timestamp: number;
  readonly projectSnapshot: Project;
}

export interface HistoryCoalesceMetadata {
  readonly key: string;
  readonly timestamp: number;
}

export interface ProjectEditorState {
  readonly project: Project;
  readonly undoStack: readonly HistoryEntry[];
  readonly redoStack: readonly HistoryEntry[];
  readonly revision: number;
  readonly lastCoalesce?: HistoryCoalesceMetadata | undefined;
}

export type ProjectAction =
  | { type: 'INITIALIZE_PROJECT'; payload: Project }
  | { type: 'UPDATE_TITLE'; title: string; coalesceKey?: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<ProjectSettings> }
  | { type: 'UPDATE_VIEWPORT'; viewport: { x: number; y: number; zoom: number } }
  | { type: 'ADD_NODE'; node: CanvasNode; historyLabel?: string }
  | {
      type: 'UPDATE_NODE';
      nodeId: EntityId;
      updates: {
        title?: string;
        description?: string;
        colorToken?: NodeColorToken;
        category?: string;
        tags?: readonly string[];
        locked?: boolean;
        dimensions?: CanvasDimensions;
        payload?: WorkspaceNodePayload;
      };
      coalesceKey?: string;
      historyLabel?: string;
    }
  | {
      type: 'BULK_UPDATE_NODES_COLOR';
      nodeIds: readonly EntityId[];
      colorToken: NodeColorToken;
      historyLabel?: string;
    }
  | {
      type: 'MOVE_NODES_COMMIT';
      moves: ReadonlyArray<{ nodeId: EntityId; position: CanvasPosition }>;
      historyLabel?: string;
    }
  | { type: 'DELETE_NODES'; nodeIds: readonly EntityId[]; historyLabel?: string }
  | { type: 'ADD_EDGE'; edge: CanvasEdge; historyLabel?: string }
  | { type: 'UPDATE_EDGE'; edgeId: EntityId; updates: Partial<CanvasEdge>; historyLabel?: string }
  | { type: 'DELETE_EDGES'; edgeIds: readonly EntityId[]; historyLabel?: string }
  | { type: 'ADD_CHECKLIST_ITEM'; item: ProjectChecklistItem }
  | { type: 'TOGGLE_CHECKLIST_ITEM'; itemId: EntityId }
  | { type: 'DELETE_CHECKLIST_ITEM'; itemId: EntityId }
  | { type: 'RECORD_STUDY_SESSION'; elapsedMinutes: number }
  | { type: 'COMMIT_COALESCE' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

/**
 * Pushes a snapshot onto the undo stack, capping at MAX_HISTORY_DEPTH.
 */
function pushHistory(
  undoStack: readonly HistoryEntry[],
  label: string,
  snapshot: Project
): readonly HistoryEntry[] {
  const newEntry: HistoryEntry = {
    label,
    timestamp: Date.now(),
    projectSnapshot: snapshot,
  };
  const updated = [...undoStack, newEntry];
  if (updated.length > MAX_HISTORY_DEPTH) {
    return updated.slice(updated.length - MAX_HISTORY_DEPTH);
  }
  return updated;
}

function updateTimestamp(project: Project): Project {
  return {
    ...project,
    metadata: {
      ...project.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function projectReducer(
  state: ProjectEditorState,
  action: ProjectAction
): ProjectEditorState {
  switch (action.type) {
    case 'INITIALIZE_PROJECT': {
      return {
        project: action.payload,
        undoStack: [],
        redoStack: [],
        revision: state.revision + 1,
        lastCoalesce: undefined,
      };
    }

    case 'UPDATE_VIEWPORT': {
      // Viewport changes are not recorded in undo history per docs/STATE_MANAGEMENT.md
      return {
        ...state,
        project: {
          ...state.project,
          viewport: action.viewport,
        },
        revision: state.revision + 1,
      };
    }

    case 'UPDATE_TITLE': {
      const trimmed = action.title.trim();
      if (!trimmed || trimmed === state.project.title) return state;

      const nextProject = updateTimestamp({
        ...state.project,
        title: trimmed,
      });

      const coalesceKey = action.coalesceKey ?? 'project:title';
      const now = Date.now();
      const shouldCoalesce =
        state.lastCoalesce !== undefined &&
        state.lastCoalesce.key === coalesceKey &&
        now - state.lastCoalesce.timestamp < HISTORY_COALESCE_WINDOW_MS;

      return {
        ...state,
        project: nextProject,
        undoStack: shouldCoalesce
          ? state.undoStack
          : pushHistory(state.undoStack, 'Rename Project', state.project),
        redoStack: [],
        lastCoalesce: { key: coalesceKey, timestamp: now },
        revision: state.revision + 1,
      };
    }

    case 'UPDATE_SETTINGS': {
      const nextProject = updateTimestamp({
        ...state.project,
        settings: {
          ...state.project.settings,
          ...action.settings,
        },
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(state.undoStack, 'Update Settings', state.project),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'ADD_NODE': {
      const nextProject = updateTimestamp({
        ...state.project,
        nodes: [...state.project.nodes, action.node],
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(
          state.undoStack,
          action.historyLabel || `Add "${action.node.title}"`,
          state.project
        ),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'UPDATE_NODE': {
      const nodeIndex = state.project.nodes.findIndex((n) => n.id === action.nodeId);
      if (nodeIndex === -1) return state;

      const existingNode = state.project.nodes[nodeIndex]!;
      const updatedNode: CanvasNode = {
        ...existingNode,
        ...action.updates,
        updatedAt: new Date().toISOString(),
      };

      const nextNodes = [...state.project.nodes];
      nextNodes[nodeIndex] = updatedNode;

      const nextProject = updateTimestamp({
        ...state.project,
        nodes: nextNodes,
      });

      const now = Date.now();
      const shouldCoalesce =
        action.coalesceKey !== undefined &&
        state.lastCoalesce !== undefined &&
        state.lastCoalesce.key === action.coalesceKey &&
        now - state.lastCoalesce.timestamp < HISTORY_COALESCE_WINDOW_MS;

      return {
        ...state,
        project: nextProject,
        undoStack: shouldCoalesce
          ? state.undoStack
          : pushHistory(
              state.undoStack,
              action.historyLabel || `Edit "${existingNode.title}"`,
              state.project
            ),
        redoStack: [],
        lastCoalesce: action.coalesceKey ? { key: action.coalesceKey, timestamp: now } : undefined,
        revision: state.revision + 1,
      };
    }

    case 'BULK_UPDATE_NODES_COLOR': {
      if (action.nodeIds.length === 0) return state;
      const targetIds = new Set(action.nodeIds);
      let changed = false;
      const nowIso = new Date().toISOString();

      const nextNodes = state.project.nodes.map((node) => {
        if (targetIds.has(node.id) && node.colorToken !== action.colorToken) {
          changed = true;
          return {
            ...node,
            colorToken: action.colorToken,
            updatedAt: nowIso,
          };
        }
        return node;
      });

      if (!changed) return state;

      const nextProject = updateTimestamp({
        ...state.project,
        nodes: nextNodes,
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(
          state.undoStack,
          action.historyLabel || `Recolor ${action.nodeIds.length} node(s)`,
          state.project
        ),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'MOVE_NODES_COMMIT': {
      if (action.moves.length === 0) return state;

      const moveMap = new Map(action.moves.map((m) => [m.nodeId, m.position]));
      const nextNodes = state.project.nodes.map((node) => {
        const newPos = moveMap.get(node.id);
        if (newPos) {
          return {
            ...node,
            position: newPos,
            updatedAt: new Date().toISOString(),
          };
        }
        return node;
      });

      const nextProject = updateTimestamp({
        ...state.project,
        nodes: nextNodes,
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(
          state.undoStack,
          action.historyLabel || `Move ${action.moves.length} node(s)`,
          state.project
        ),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'DELETE_NODES': {
      if (action.nodeIds.length === 0) return state;
      const idsToDelete = new Set(action.nodeIds);

      const nextNodes = state.project.nodes.filter((n) => !idsToDelete.has(n.id));
      // Prune connected edges atomically
      const nextEdges = pruneEdgesConnectedToNodes(state.project.edges, idsToDelete);

      const nextProject = updateTimestamp({
        ...state.project,
        nodes: nextNodes,
        edges: nextEdges,
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(
          state.undoStack,
          action.historyLabel || `Delete ${action.nodeIds.length} node(s)`,
          state.project
        ),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'ADD_EDGE': {
      const sanitized = sanitizeProjectEdges(state.project.nodes, [
        ...state.project.edges,
        action.edge,
      ]);

      const nextProject = updateTimestamp({
        ...state.project,
        edges: sanitized,
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(
          state.undoStack,
          action.historyLabel || 'Connect Nodes',
          state.project
        ),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'UPDATE_EDGE': {
      const nextEdges = state.project.edges.map((e) =>
        e.id === action.edgeId ? { ...e, ...action.updates } : e
      );

      const nextProject = updateTimestamp({
        ...state.project,
        edges: nextEdges,
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(
          state.undoStack,
          action.historyLabel || 'Update Connection',
          state.project
        ),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'DELETE_EDGES': {
      const idsToDelete = new Set(action.edgeIds);
      const nextEdges = state.project.edges.filter((e) => !idsToDelete.has(e.id));

      const nextProject = updateTimestamp({
        ...state.project,
        edges: nextEdges,
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(
          state.undoStack,
          action.historyLabel || `Delete ${action.edgeIds.length} connection(s)`,
          state.project
        ),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'ADD_CHECKLIST_ITEM': {
      const nextProject = updateTimestamp({
        ...state.project,
        checklist: [...state.project.checklist, action.item],
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(state.undoStack, `Add item "${action.item.text}"`, state.project),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'TOGGLE_CHECKLIST_ITEM': {
      const nextChecklist = state.project.checklist.map((item) =>
        item.id === action.itemId ? { ...item, completed: !item.completed } : item
      );

      const nextProject = updateTimestamp({
        ...state.project,
        checklist: nextChecklist,
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(state.undoStack, 'Toggle checklist item', state.project),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'DELETE_CHECKLIST_ITEM': {
      const nextChecklist = state.project.checklist.filter((item) => item.id !== action.itemId);

      const nextProject = updateTimestamp({
        ...state.project,
        checklist: nextChecklist,
      });

      return {
        ...state,
        project: nextProject,
        undoStack: pushHistory(state.undoStack, 'Delete checklist item', state.project),
        redoStack: [],
        lastCoalesce: undefined,
        revision: state.revision + 1,
      };
    }

    case 'RECORD_STUDY_SESSION': {
      const currentMinutes = state.project.metadata.completedStudyMinutes || 0;
      const currentSessions = state.project.metadata.completedStudySessions || 0;
      return {
        ...state,
        project: {
          ...state.project,
          metadata: {
            ...state.project.metadata,
            completedStudyMinutes: currentMinutes + action.elapsedMinutes,
            completedStudySessions: currentSessions + 1,
            updatedAt: getCurrentIsoTimestamp(),
          },
        },
        revision: state.revision + 1,
      };
    }

    case 'COMMIT_COALESCE': {
      if (!state.lastCoalesce) return state;
      return {
        ...state,
        lastCoalesce: undefined,
      };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;

      const previousEntry = state.undoStack[state.undoStack.length - 1]!;
      const remainingUndo = state.undoStack.slice(0, state.undoStack.length - 1);

      const redoEntry: HistoryEntry = {
        label: previousEntry.label,
        timestamp: Date.now(),
        projectSnapshot: state.project,
      };

      return {
        project: previousEntry.projectSnapshot,
        undoStack: remainingUndo,
        redoStack: [redoEntry, ...state.redoStack].slice(0, MAX_HISTORY_DEPTH),
        revision: state.revision + 1,
        lastCoalesce: undefined,
      };
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state;

      const nextEntry = state.redoStack[0]!;
      const remainingRedo = state.redoStack.slice(1);

      const undoEntry: HistoryEntry = {
        label: nextEntry.label,
        timestamp: Date.now(),
        projectSnapshot: state.project,
      };

      return {
        project: nextEntry.projectSnapshot,
        undoStack: [...state.undoStack, undoEntry].slice(
          Math.max(0, state.undoStack.length + 1 - MAX_HISTORY_DEPTH)
        ),
        redoStack: remainingRedo,
        revision: state.revision + 1,
        lastCoalesce: undefined,
      };
    }

    default:
      return state;
  }
}
