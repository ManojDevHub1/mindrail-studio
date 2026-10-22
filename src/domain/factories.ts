/**
 * Factory functions to create canonical domain entities with safe defaults.
 * Conforms to docs/DATA_MODEL.md.
 */
import {
  CURRENT_SCHEMA_VERSION,
  type CanvasDimensions,
  type CanvasEdge,
  type CanvasNode,
  type CanvasPosition,
  type EdgeRoutingStyle,
  type EdgeStrokePattern,
  type EntityId,
  type NodeColorToken,
  type PortSide,
  type Project,
  type ProjectChecklistItem,
  type ProjectSettings,
  type WorkspaceType,
} from './models';
import type { WorkspaceNodePayload } from './workspaceTypes';

/** Generate a stable UUID string. Uses crypto.randomUUID() when available. */
export function generateEntityId(): EntityId {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Deterministic RFC4122 v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** ISO timestamp generator */
export function getCurrentIsoTimestamp(): string {
  return new Date().toISOString();
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  snapToGrid: true,
  gridSize: 16,
  defaultEdgeStyle: 'bezier',
  studyTimerMinutes: 25,
  studyBreakMinutes: 5,
};

export const DEFAULT_NODE_DIMENSIONS: CanvasDimensions = {
  width: 280,
  height: 160,
};

/** Default workspace project titles */
export function getDefaultProjectTitle(workspaceType: WorkspaceType): string {
  switch (workspaceType) {
    case 'developer':
      return 'Untitled Architecture Project';
    case 'video':
      return 'Untitled Video Storyboard';
    case 'student':
      return 'Untitled Study Map';
    case 'freelance':
      return 'Untitled Client Project';
  }
}

/** Default workspace node payload */
export function getDefaultPayloadForWorkspace(
  workspaceType: WorkspaceType
): WorkspaceNodePayload {
  switch (workspaceType) {
    case 'developer':
      return {
        kind: 'dev-architecture',
        componentKind: 'service',
        techStack: 'TypeScript',
        status: 'planned',
      };
    case 'video':
      return {
        kind: 'video-scene',
        sceneNumber: 1,
        durationSeconds: 30,
        framing: 'medium',
        scriptText: '',
        voiceOverNotes: '',
        typographyNotes: '',
        transitionAndSfxNotes: '',
        productionStatus: 'planned',
        checklist: [],
      };
    case 'student':
      return {
        kind: 'student-concept',
        isRootTopic: false,
        mastery: 'new',
        summaryNotes: '',
        keyTerms: [],
      };
    case 'freelance':
      return {
        kind: 'freelance-task',
        status: 'todo',
        priority: 'medium',
        subtasks: [],
      };
  }
}

/**
 * Creates a valid, canonical Project instance.
 */
export function createProject(
  workspaceType: WorkspaceType = 'developer',
  overrides?: Partial<Project>
): Project {
  const now = getCurrentIsoTimestamp();
  const id = overrides?.id ?? generateEntityId();

  return {
    id,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    title: overrides?.title?.trim() || getDefaultProjectTitle(workspaceType),
    workspaceType,
    metadata: {
      description: overrides?.metadata?.description ?? '',
      tags: overrides?.metadata?.tags ? [...overrides.metadata.tags] : [],
      createdAt: overrides?.metadata?.createdAt ?? now,
      updatedAt: overrides?.metadata?.updatedAt ?? now,
      completedStudyMinutes: overrides?.metadata?.completedStudyMinutes ?? 0,
      completedStudySessions: overrides?.metadata?.completedStudySessions ?? 0,
      ...(overrides?.metadata?.lastExportedAt ? { lastExportedAt: overrides.metadata.lastExportedAt } : {}),
      ...(overrides?.metadata?.sourceTemplateId ? { sourceTemplateId: overrides.metadata.sourceTemplateId } : {}),
    },
    settings: {
      ...DEFAULT_PROJECT_SETTINGS,
      ...(overrides?.settings ?? {}),
    },
    viewport: {
      x: overrides?.viewport?.x ?? 0,
      y: overrides?.viewport?.y ?? 0,
      zoom: overrides?.viewport?.zoom ?? 1.0,
    },
    nodes: overrides?.nodes ? [...overrides.nodes] : [],
    edges: overrides?.edges ? [...overrides.edges] : [],
    checklist: overrides?.checklist ? [...overrides.checklist] : [],
  };
}

export interface CreateNodeOptions {
  id?: EntityId;
  title?: string;
  description?: string;
  position?: CanvasPosition;
  dimensions?: CanvasDimensions;
  colorToken?: NodeColorToken;
  category?: string;
  tags?: readonly string[];
  locked?: boolean;
  zIndex?: number;
  payload?: WorkspaceNodePayload;
}

/**
 * Creates a valid CanvasNode instance with defaults.
 */
export function createNode(
  workspaceType: WorkspaceType,
  options: CreateNodeOptions = {}
): CanvasNode {
  const now = getCurrentIsoTimestamp();

  return {
    id: options.id ?? generateEntityId(),
    title: options.title?.trim() || 'New Node',
    description: options.description ?? '',
    position: options.position ?? { x: 160, y: 160 },
    dimensions: options.dimensions ?? { ...DEFAULT_NODE_DIMENSIONS },
    colorToken: options.colorToken ?? 'neutral',
    category: options.category ?? '',
    tags: options.tags ? [...options.tags] : [],
    locked: options.locked ?? false,
    zIndex: options.zIndex ?? 1,
    createdAt: now,
    updatedAt: now,
    payload: options.payload ?? getDefaultPayloadForWorkspace(workspaceType),
  };
}

export interface CreateEdgeOptions {
  id?: EntityId;
  sourceNodeId: EntityId;
  targetNodeId: EntityId;
  sourcePort?: PortSide;
  targetPort?: PortSide;
  label?: string;
  routingStyle?: EdgeRoutingStyle;
  strokePattern?: EdgeStrokePattern;
  directed?: boolean;
  colorToken?: NodeColorToken;
}

/**
 * Creates a valid CanvasEdge instance.
 */
export function createEdge(options: CreateEdgeOptions): CanvasEdge {
  return {
    id: options.id ?? generateEntityId(),
    sourceNodeId: options.sourceNodeId,
    targetNodeId: options.targetNodeId,
    sourcePort: options.sourcePort ?? 'right',
    targetPort: options.targetPort ?? 'left',
    label: options.label ?? '',
    routingStyle: options.routingStyle ?? 'bezier',
    strokePattern: options.strokePattern ?? 'solid',
    directed: options.directed ?? true,
    ...(options.colorToken ? { colorToken: options.colorToken } : {}),
  };
}

/**
 * Creates a checklist item.
 */
export function createChecklistItem(
  text: string,
  category?: string
): ProjectChecklistItem {
  return {
    id: generateEntityId(),
    text: text.trim(),
    completed: false,
    ...(category ? { category } : {}),
  };
}
