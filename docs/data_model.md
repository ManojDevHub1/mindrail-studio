# Canonical Data Model (`docs/DATA_MODEL.md`)

> **Implementation Status:** Fully Implemented and Verified (`v0.1.0-release`). All canonical TypeScript data structures are implemented in `src/domain/models.ts` and `src/domain/workspaceTypes.ts` with comprehensive unit and referential integrity test coverage.

## 1. Design Goals

1. **Unified Multi-Workspace Model:** Support **Developer**, **Video Creator**, and **Student** workflows inside one cohesive `Project` schema rather than three incompatible storage systems.
2. **Normalized Referential Integrity:** Store nodes and edges as flat collections with deterministic UUID references (`sourceNodeId`, `targetNodeId`).
3. **Zero Redundant Derived State:** Do not persist transient selection arrays, hover states, undo/redo history stacks, or easily recomputed totals (such as total video runtime or percentage of mastered flashcards) inside the persisted `Project` record.
4. **Explicit Schema Versioning:** Every persisted `Project` and `Template` carries an integer `schemaVersion` (starting at `1`) to support deterministic forward migrations.

---

## 2. Core TypeScript Interfaces (`schemaVersion: 1`)

When Phase 0/Phase 1 begins, implement these canonical types in `src/domain/models.ts` and `src/domain/workspaceTypes.ts`.

### 2.1 Primitives & Enumerations

```typescript
/** Current canonical schema version for MindRail Studio projects and templates. */
export const CURRENT_SCHEMA_VERSION = 1 as const;

/** Stable UUID v4 string identifier (e.g., generated via crypto.randomUUID()). */
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
```

### 2.2 Project Document & Settings

```typescript
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
  /**
   * Project-level checklist items (e.g., Video pre-production checklist,
   * Student exam revision checklist, or Developer release checklist).
   */
  readonly checklist: readonly ProjectChecklistItem[];
}
```

### 2.3 Shared Canvas Node & Edge Model

```typescript
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

/** Discriminated union of all workspace-specific node data payloads. */
export type WorkspaceNodePayload =
  | DeveloperNodePayload
  | VideoNodePayload
  | StudentNodePayload
  | FreelanceNodePayload;

export interface CanvasNode extends CanvasNodeBase {
  readonly payload: WorkspaceNodePayload;
}
```

---

## 3. Workspace-Specific Node Payloads

### 3.1 Developer Workspace Payloads (`workspaceType: 'developer'`)

```typescript
export type ArchitectureComponentKind =
  | 'service'
  | 'database'
  | 'queue'
  | 'client'
  | 'external-api'
  | 'boundary';

export type DevTaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type DevTaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type DeveloperNodePayload =
  | {
      readonly kind: 'dev-architecture';
      readonly componentKind: ArchitectureComponentKind;
      readonly techStack: string;
      readonly environment?: 'local' | 'staging' | 'production';
      readonly status: 'healthy' | 'planned' | 'deprecated';
      readonly endpointHint?: string;
    }
  | {
      readonly kind: 'dev-workflow-step';
      readonly stepType: 'trigger' | 'action' | 'condition' | 'output';
      readonly executionOrder?: number;
      readonly conditionExpression?: string;
    }
  | {
      readonly kind: 'dev-code-snippet';
      readonly language: string;
      readonly filePathHint?: string;
      readonly code: string;
    }
  | {
      readonly kind: 'dev-task';
      readonly issueType: 'task' | 'bug';
      readonly status: DevTaskStatus;
      readonly priority: DevTaskPriority;
      readonly estimatePoints?: number;
      readonly subtasks: readonly ProjectChecklistItem[];
    }
  | {
      readonly kind: 'dev-note';
      readonly markdownBody: string;
    };
```

### 3.2 Video Creator Workspace Payloads (`workspaceType: 'video'`)

```typescript
export type ShotFramingType =
  | 'wide'
  | 'medium'
  | 'close-up'
  | 'extreme-close-up'
  | 'screen-recording'
  | 'b-roll'
  | 'motion-graphic';

export type ShotProductionStatus = 'planned' | 'scripted' | 'filmed' | 'edited';

export type VideoNodePayload =
  | {
      readonly kind: 'video-scene';
      readonly sceneNumber: number;
      readonly durationSeconds: number;
      readonly framing: ShotFramingType;
      readonly scriptText: string;
      readonly voiceOverNotes: string;
      readonly typographyNotes: string;
      readonly transitionAndSfxNotes: string;
      readonly productionStatus: ShotProductionStatus;
      readonly checklist: readonly ProjectChecklistItem[];
    }
  | {
      readonly kind: 'video-script-beat';
      readonly beatType: 'hook' | 'intro' | 'problem' | 'main-point' | 'demo' | 'cta' | 'outro';
      readonly scriptText: string;
      readonly targetDurationSeconds: number;
    }
  | {
      readonly kind: 'video-shot-item';
      readonly shotCode: string;
      readonly framing: ShotFramingType;
      readonly locationOrSetup: string;
      readonly audioCue: string;
      readonly status: ShotProductionStatus;
    }
  | {
      readonly kind: 'video-note';
      readonly noteCategory: 'voice-over' | 'typography' | 'sfx-transition' | 'general';
      readonly content: string;
    };
```

### 3.3 Student Workspace Payloads (`workspaceType: 'student'`)

```typescript
export type MasteryLevel = 'new' | 'learning' | 'reviewing' | 'mastered';
export type FlashcardConfidence = 'unrated' | 'again' | 'hard' | 'good' | 'easy';

export type StudentNodePayload =
  | {
      readonly kind: 'student-concept';
      readonly isRootTopic: boolean;
      readonly mastery: MasteryLevel;
      readonly summaryNotes: string;
      readonly keyTerms: readonly string[];
    }
  | {
      readonly kind: 'student-flashcard';
      readonly frontPrompt: string;
      readonly backAnswer: string;
      readonly hint?: string;
      readonly lastConfidence: FlashcardConfidence;
      readonly reviewCount: number;
      readonly lastReviewedAt?: IsoTimestamp;
    }
  | {
      readonly kind: 'student-note';
      readonly topicArea: string;
      readonly markdownBody: string;
      readonly mastery: MasteryLevel;
    }
  | {
      readonly kind: 'student-revision-block';
      readonly examOrGoalDate?: string;
      readonly priority: 'low' | 'medium' | 'high';
      readonly items: readonly ProjectChecklistItem[];
    };
```

### 3.4 Freelance & Business Workspace Payloads (`workspaceType: 'freelance'`)

```typescript
export type FreelanceTaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type FreelanceTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FreelanceStagePhase = 'brief' | 'concept' | 'execution' | 'review' | 'delivery';
export type FreelanceNoteType = 'client-feedback' | 'creative-brief' | 'meeting' | 'guideline';

export type FreelanceNodePayload =
  | {
      readonly kind: 'freelance-task';
      readonly status: FreelanceTaskStatus;
      readonly priority: FreelanceTaskPriority;
      readonly dueDate?: string;
      readonly subtasks: readonly ProjectChecklistItem[];
    }
  | {
      readonly kind: 'freelance-stage';
      readonly phase: FreelanceStagePhase;
      readonly stageNumber: number;
      readonly deliverableSummary: string;
    }
  | {
      readonly kind: 'freelance-deliverable';
      readonly format: string;
      readonly clientApproved: boolean;
      readonly reviewNotes?: string;
    }
  | {
      readonly kind: 'freelance-note';
      readonly noteType: FreelanceNoteType;
      readonly markdownBody: string;
    }
  | {
      readonly kind: 'freelance-review-item';
      readonly reviewer: string;
      readonly approved: boolean;
      readonly checklist: readonly ProjectChecklistItem[];
    };
```

---

## 4. Reusable Template Model

```typescript
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
```

---

## 5. Required vs. Optional Properties & Default Values

| Field | Requirement | Default Value (`createProject` / `createNode`) |
| :--- | :--- | :--- |
| `Project.id` | Required (`UUID`) | `crypto.randomUUID()` |
| `Project.schemaVersion` | Required (`number`) | `1` (`CURRENT_SCHEMA_VERSION`) |
| `Project.title` | Required (non-empty trimmed string, `1..120` chars) | `"Untitled Project"` |
| `Project.viewport` | Required | `{ x: 0, y: 0, zoom: 1.0 }` |
| `Project.settings` | Required | `{ snapToGrid: true, gridSize: 16, defaultEdgeStyle: 'bezier', studyTimerMinutes: 25, studyBreakMinutes: 5 }` |
| `CanvasNode.position` | Required (finite numbers) | `{ x: 0, y: 0 }` (or viewport center) |
| `CanvasNode.dimensions` | Required (`width >= 140`, `height >= 80`) | `{ width: 280, height: 180 }` |
| `CanvasNode.colorToken` | Required | `'neutral'` |
| `CanvasNode.locked` | Required | `false` |
| `CanvasEdge.routingStyle` | Required | Inherited from `Project.settings.defaultEdgeStyle` (`'bezier'`) |
| `CanvasEdge.directed` | Required | `true` |

---

## 6. Validation Rules & Referential Integrity

Every mutation in `src/domain/integrity.ts` and every import in `src/import-export/validateProjectImport.ts` must enforce these invariants:

1. **Unique Entity IDs:**
   - All `node.id` values within `project.nodes` must be strictly unique.
   - All `edge.id` values within `project.edges` must be strictly unique.
   - *Duplicate ID Handling:* During import validation, duplicate `node.id` or `edge.id` entries cause validation failure with a clear diagnostic message identifying the duplicate ID. When duplicating nodes or instantiating templates in the UI, always generate fresh UUIDs.
2. **Edge Endpoint Referential Integrity:**
   - For every `edge` in `project.edges`, `edge.sourceNodeId` **must** match an existing `node.id` in `project.nodes`, and `edge.targetNodeId` **must** match an existing `node.id` in `project.nodes`.
   - *Missing Endpoint Handling:*
     - When deleting a node (`DELETE_NODES`), the reducer automatically filters out all edges where `sourceNodeId` or `targetNodeId` matches a deleted node ID in the same atomic state transition.
     - During file import, if an edge references a missing node ID, strict validation flags the broken edge and gives the user the choice to cancel the import or strip dangling edges during import recovery.
3. **No Self-Loop Edges:**
   - `edge.sourceNodeId !== edge.targetNodeId` is enforced on creation and import.
4. **No Identical Duplicate Edges:**
   - At most one edge may connect the same `(sourceNodeId, sourcePort, targetNodeId, targetPort)` tuple.
5. **Finite Coordinate & Dimension Bounds:**
   - `position.x` and `position.y` must satisfy `Number.isFinite(val)` and lie within `[-100_000, 100_000]`.
   - `dimensions.width` must lie within `[120, 2400]` and `dimensions.height` within `[60, 2400]`.
   - `viewport.zoom` must lie within `[0.15, 3.0]`.
   - Video `durationSeconds` must be a finite number `>= 0` and `<= 86_400` (24 hours per scene ceiling).

---

## 7. Derived Data Calculations (Not Stored in `Project`)

To prevent stale or contradictory data, compute the following values on the fly via pure selector functions in `src/domain/calculators.ts`:

- **Video Creator Total Runtime:** Sum of `payload.durationSeconds` across all `video-scene` nodes in the project, plus topological sequence timecodes (`startTimeSeconds`, `endTimeSeconds`) ordered by connected scene chains or `sceneNumber`.
- **Video Shot & Checklist Readiness:** Count of `video-scene` and `video-shot-item` nodes grouped by `productionStatus` (`planned`, `scripted`, `filmed`, `edited`).
- **Student Mastery Breakdown:** Percentage and count of `student-concept` and `student-note` nodes in each `MasteryLevel` (`new`, `learning`, `reviewing`, `mastered`).
- **Developer Task Board Summary:** Count of `dev-task` nodes grouped by `DevTaskStatus` and `DevTaskPriority`.

---

## 8. Schema Migration Principles

1. **Monotonic Integer Versioning:** `schemaVersion` increments by `1` (`1 -> 2 -> 3`) whenever a persisted interface changes incompatibly.
2. **Pure Stepwise Migrators:** Each migration is a pure function `migrateV1ToV2(raw: ProjectV1): ProjectV2` registered in `src/import-export/migrateProject.ts`.
3. **Read-Time Upgrade:** When loading a record from `IndexedDB` or importing a `.mindrail.json` file with `schemaVersion < CURRENT_SCHEMA_VERSION`, run the sequential migration pipeline before validating against the current schema.
4. **Forward Version Protection:** If an imported file has `schemaVersion > CURRENT_SCHEMA_VERSION`, reject it safely without attempting to guess unknown future structures.
