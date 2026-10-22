/**
 * Canonical Data Model interfaces for MindRail Studio.
 * Matching docs/DATA_MODEL.md (schemaVersion: 1)
 */
import type { WorkspaceNodePayload } from './workspaceTypes';

/** Current canonical schema version for MindRail Studio projects and templates. */
export const CURRENT_SCHEMA_VERSION = 1 as const;

/** Stable UUID string identifier (e.g., generated via crypto.randomUUID()). */
export type EntityId = string;

/** ISO-8601 UTC timestamp string (e.g., "2026-10-22T06:00:00.000Z"). */
export type IsoTimestamp = string;

/** The four primary product workspaces. */
export type WorkspaceType = 'developer' | 'video' | 'student' | 'freelance';

/** Template categories matching the universal professional catalog. */
export type TemplateCategory =
  | 'web-dev'
  | 'ui-ux'
  | 'graphic-design'
  | 'video-editing'
  | 'content-creation'
  | 'writing'
  | 'social-media'
  | 'digital-marketing'
  | 'freelance-business'
  | 'photography'
  | 'podcast-audio'
  | 'data-analytics'
  | 'ai-automation'
  | 'education-research'
  | 'product-startup';

export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** Semantic node color roles defined in docs/DESIGN_SYSTEM.md. */
export type NodeColorToken =
  | 'neutral'
  | 'blue'
  | 'purple'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'orange';

/** 2D Cartesian coordinate on the infinite canvas (in logical pixels). */
export interface CanvasPosition {
  readonly x: number;
  readonly y: number;
}

/** Bounding box dimensions for a canvas node (in logical pixels). */
export interface CanvasDimensions {
  readonly width: number;
  readonly height: number;
}

/** Saved camera/viewport state for a project canvas. */
export interface ViewportState {
  readonly x: number;
  readonly y: number;
  /** Zoom multiplier clamped to [0.15, 3.0]. Default: 1.0 */
  readonly zoom: number;
}

export type PortSide = 'top' | 'right' | 'bottom' | 'left';

export type EdgeRoutingStyle = 'bezier' | 'orthogonal' | 'straight';

export type EdgeStrokePattern = 'solid' | 'dashed' | 'dotted';

export interface CanvasEdge {
  readonly id: EntityId;
  readonly sourceNodeId: EntityId;
  readonly targetNodeId: EntityId;
  readonly sourcePort: PortSide;
  readonly targetPort: PortSide;
  readonly label?: string;
  readonly routingStyle: EdgeRoutingStyle;
  readonly strokePattern: EdgeStrokePattern;
  readonly directed: boolean;
  readonly colorToken?: NodeColorToken;
}

/** Base properties shared by every node on the canvas regardless of workspace. */
export interface CanvasNodeBase {
  readonly id: EntityId;
  readonly title: string;
  readonly description: string;
  readonly position: CanvasPosition;
  readonly dimensions: CanvasDimensions;
  readonly colorToken: NodeColorToken;
  readonly category?: string;
  readonly tags: readonly string[];
  readonly locked: boolean;
  readonly zIndex: number;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CanvasNode extends CanvasNodeBase {
  readonly payload: WorkspaceNodePayload;
}

export interface ProjectSettings {
  /** Snap node drag/resize movements to the canvas grid. Default: true */
  readonly snapToGrid: boolean;
  /** Logical grid spacing in pixels. Allowed: 8 | 16 | 32. Default: 16 */
  readonly gridSize: 8 | 16 | 32;
  /** Default visual routing style for newly created connections. Default: 'bezier' */
  readonly defaultEdgeStyle: EdgeRoutingStyle;
  /** Student workspace study timer duration in minutes. Default: 25 */
  readonly studyTimerMinutes: number;
  /** Student workspace break timer duration in minutes. Default: 5 */
  readonly studyBreakMinutes: number;
}

export interface ProjectMetadata {
  readonly description: string;
  readonly tags: readonly string[];
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly lastExportedAt?: IsoTimestamp;
  /** Optional ID of the template this project was initialized from. */
  readonly sourceTemplateId?: EntityId;
  /** Student workspace cumulative completed focus minutes stored locally. Default: 0 */
  readonly completedStudyMinutes: number;
  /** Student workspace completed focus session count. Default: 0 */
  readonly completedStudySessions: number;
}

export interface ProjectChecklistItem {
  readonly id: EntityId;
  readonly text: string;
  readonly completed: boolean;
  readonly category?: string;
}

export interface Project {
  readonly id: EntityId;
  readonly schemaVersion: number;
  readonly title: string;
  readonly workspaceType: WorkspaceType;
  readonly metadata: ProjectMetadata;
  readonly settings: ProjectSettings;
  readonly viewport: ViewportState;
  readonly nodes: readonly CanvasNode[];
  readonly edges: readonly CanvasEdge[];
  readonly checklist: readonly ProjectChecklistItem[];
}

export interface ProjectTemplate {
  readonly id: EntityId;
  readonly schemaVersion: number;
  readonly name: string;
  readonly summary: string;
  readonly workspaceType: WorkspaceType;
  readonly isBuiltIn: boolean;
  readonly createdAt: IsoTimestamp;
  readonly defaultSettings: ProjectSettings;
  readonly nodes: readonly CanvasNode[];
  readonly edges: readonly CanvasEdge[];
  readonly checklist: readonly ProjectChecklistItem[];
  readonly category?: TemplateCategory;
  readonly subCategory?: string;
  readonly tags?: readonly string[];
  readonly targetAudience?: string;
  readonly difficulty?: TemplateDifficulty;
  readonly estimatedSetupMinutes?: number;
  readonly featured?: boolean;
  readonly version?: string;
}
