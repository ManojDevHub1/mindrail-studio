/**
 * Untrusted JSON validator and sanitizer for imported project files.
 * Conforms to docs/IMPORT_EXPORT_SPEC.md and docs/DATA_MODEL.md.
 */
import {
  CURRENT_SCHEMA_VERSION,
  type CanvasDimensions,
  type CanvasEdge,
  type CanvasNode,
  type CanvasPosition,
  type EdgeRoutingStyle,
  type EdgeStrokePattern,
  type NodeColorToken,
  type PortSide,
  type Project,
  type ProjectChecklistItem,
  type ProjectSettings,
  type ViewportState,
  type WorkspaceType,
} from '../domain/models';
import type {
  ArchitectureComponentKind,
  DevTaskPriority,
  DevTaskStatus,
  FlashcardConfidence,
  FreelanceNoteType,
  FreelanceStagePhase,
  FreelanceTaskPriority,
  FreelanceTaskStatus,
  MasteryLevel,
  ShotFramingType,
  ShotProductionStatus,
  WorkspaceNodePayload,
} from '../domain/workspaceTypes';
import { sanitizeProjectEdges, validateProjectIntegrity } from '../domain/integrity';
import { migrateProjectToCurrentSchema, UnsupportedSchemaVersionError } from './migrateProject';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB Hard Ceiling
export const MAX_NODES_COUNT = 5_000;
export const MAX_EDGES_COUNT = 10_000;
export const MAX_CHECKLIST_COUNT = 2_000;

export interface ValidationSuccess {
  readonly success: true;
  readonly project: Project;
  readonly originalFileEnvelope?: {
    readonly format: string;
    readonly exportedAt?: string;
    readonly appVersion?: string;
  };
  readonly danglingEdgesRemoved: number;
}

export interface ValidationFailure {
  readonly success: false;
  readonly code:
    | 'ERR_FILE_TOO_LARGE'
    | 'ERR_INVALID_JSON'
    | 'ERR_PROTOTYPE_POLLUTION'
    | 'ERR_INVALID_ENVELOPE'
    | 'ERR_UNSUPPORTED_SCHEMA_VERSION'
    | 'ERR_LIMIT_EXCEEDED'
    | 'ERR_INVALID_SCHEMA'
    | 'ERR_DANGLING_EDGE_REFERENCE'
    | 'ERR_DUPLICATE_ENTITY_ID';
  readonly message: string;
  readonly details?: readonly string[];
  readonly recoverableWithEdgeStripping?: boolean;
}

export type ImportValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Safe JSON parser with prototype pollution protection.
 */
export function safeJsonParse(rawText: string): unknown {
  return JSON.parse(rawText, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error(`Prototype pollution attempt detected via key "${key}".`);
    }
    return value;
  });
}

function isValidWorkspaceType(val: unknown): val is WorkspaceType {
  return val === 'developer' || val === 'video' || val === 'student' || val === 'freelance';
}

function isValidColorToken(val: unknown): val is NodeColorToken {
  return (
    val === 'neutral' ||
    val === 'blue' ||
    val === 'purple' ||
    val === 'cyan' ||
    val === 'emerald' ||
    val === 'amber' ||
    val === 'rose' ||
    val === 'orange'
  );
}

function isValidPortSide(val: unknown): val is PortSide {
  return val === 'top' || val === 'right' || val === 'bottom' || val === 'left';
}

function isValidRoutingStyle(val: unknown): val is EdgeRoutingStyle {
  return val === 'bezier' || val === 'orthogonal' || val === 'straight';
}

function isValidStrokePattern(val: unknown): val is EdgeStrokePattern {
  return val === 'solid' || val === 'dashed' || val === 'dotted';
}

/**
 * Normalizes and validates a single node's workspace payload.
 */
function sanitizePayload(raw: unknown): WorkspaceNodePayload | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  const kind = p['kind'];

  if (typeof kind !== 'string') return null;

  // Developer payloads
  if (kind === 'dev-architecture') {
    const rawCk = String(p['componentKind']);
    const validKinds: ArchitectureComponentKind[] = [
      'service',
      'database',
      'queue',
      'client',
      'external-api',
      'boundary',
    ];
    if (!validKinds.includes(rawCk as ArchitectureComponentKind)) return null;

    const componentKind = rawCk as ArchitectureComponentKind;
    const techStack = typeof p['techStack'] === 'string' ? p['techStack'].slice(0, 100) : '';
    const rawEnv = String(p['environment']);
    const environment: 'local' | 'staging' | 'production' | undefined = ['local', 'staging', 'production'].includes(rawEnv)
      ? (rawEnv as 'local' | 'staging' | 'production')
      : undefined;

    const rawStatus = String(p['status']);
    const status: 'healthy' | 'planned' | 'deprecated' = ['healthy', 'planned', 'deprecated'].includes(rawStatus)
      ? (rawStatus as 'healthy' | 'planned' | 'deprecated')
      : 'planned';

    const endpointHint = typeof p['endpointHint'] === 'string' ? p['endpointHint'].slice(0, 500) : undefined;

    return {
      kind: 'dev-architecture',
      componentKind,
      techStack,
      status,
      ...(environment ? { environment } : {}),
      ...(endpointHint ? { endpointHint } : {}),
    };
  }

  if (kind === 'dev-code-snippet') {
    const filePathHint = typeof p['filePathHint'] === 'string' ? p['filePathHint'].slice(0, 250) : undefined;
    return {
      kind: 'dev-code-snippet',
      language: typeof p['language'] === 'string' ? p['language'].slice(0, 50) : 'typescript',
      code: typeof p['code'] === 'string' ? p['code'].slice(0, 100_000) : '',
      ...(filePathHint ? { filePathHint } : {}),
    };
  }

  if (kind === 'dev-task') {
    const rawStatus = String(p['status']);
    const status: DevTaskStatus = ['backlog', 'todo', 'in-progress', 'review', 'done'].includes(rawStatus)
      ? (rawStatus as DevTaskStatus)
      : 'todo';

    const rawPriority = String(p['priority']);
    const priority: DevTaskPriority = ['low', 'medium', 'high', 'critical'].includes(rawPriority)
      ? (rawPriority as DevTaskPriority)
      : 'medium';

    const estimatePoints =
      typeof p['estimatePoints'] === 'number' && Number.isFinite(p['estimatePoints'])
        ? p['estimatePoints']
        : undefined;

    const subtasks = Array.isArray(p['subtasks'])
      ? p['subtasks'].map((st: unknown) => {
          const item = (typeof st === 'object' && st !== null ? st : {}) as Record<string, unknown>;
          return {
            id: String(item['id'] || ''),
            text: String(item['text'] || '').slice(0, 250),
            completed: Boolean(item['completed']),
          };
        })
      : [];

    return {
      kind: 'dev-task',
      issueType: p['issueType'] === 'bug' ? 'bug' : 'task',
      status,
      priority,
      subtasks,
      ...(estimatePoints !== undefined ? { estimatePoints } : {}),
    };
  }

  if (kind === 'dev-note') {
    return {
      kind: 'dev-note',
      markdownBody: typeof p['markdownBody'] === 'string' ? p['markdownBody'].slice(0, 100_000) : '',
    };
  }

  // Video payloads
  if (kind === 'video-scene') {
    const rawFraming = String(p['framing']);
    const framing: ShotFramingType = [
      'wide',
      'medium',
      'close-up',
      'extreme-close-up',
      'screen-recording',
      'b-roll',
      'motion-graphic',
    ].includes(rawFraming)
      ? (rawFraming as ShotFramingType)
      : 'medium';

    const rawProdStatus = String(p['productionStatus']);
    const productionStatus: ShotProductionStatus = ['planned', 'scripted', 'filmed', 'edited'].includes(rawProdStatus)
      ? (rawProdStatus as ShotProductionStatus)
      : 'planned';

    return {
      kind: 'video-scene',
      sceneNumber: typeof p['sceneNumber'] === 'number' ? p['sceneNumber'] : 1,
      durationSeconds: typeof p['durationSeconds'] === 'number' && p['durationSeconds'] >= 0 ? p['durationSeconds'] : 30,
      framing,
      scriptText: typeof p['scriptText'] === 'string' ? p['scriptText'].slice(0, 100_000) : '',
      voiceOverNotes: typeof p['voiceOverNotes'] === 'string' ? p['voiceOverNotes'].slice(0, 100_000) : '',
      typographyNotes: typeof p['typographyNotes'] === 'string' ? p['typographyNotes'].slice(0, 100_000) : '',
      transitionAndSfxNotes: typeof p['transitionAndSfxNotes'] === 'string' ? p['transitionAndSfxNotes'].slice(0, 100_000) : '',
      productionStatus,
      checklist: Array.isArray(p['checklist'])
        ? p['checklist'].map((c: unknown) => {
            const item = (typeof c === 'object' && c !== null ? c : {}) as Record<string, unknown>;
            return {
              id: String(item['id'] || ''),
              text: String(item['text'] || '').slice(0, 250),
              completed: Boolean(item['completed']),
            };
          })
        : [],
    };
  }

  if (kind === 'video-script-beat') {
    const rawBeat = String(p['beatType']);
    const beatType: 'hook' | 'intro' | 'problem' | 'main-point' | 'demo' | 'cta' | 'outro' = [
      'hook',
      'intro',
      'problem',
      'main-point',
      'demo',
      'cta',
      'outro',
    ].includes(rawBeat)
      ? (rawBeat as 'hook' | 'intro' | 'problem' | 'main-point' | 'demo' | 'cta' | 'outro')
      : 'hook';

    return {
      kind: 'video-script-beat',
      beatType,
      scriptText: typeof p['scriptText'] === 'string' ? p['scriptText'].slice(0, 100_000) : '',
      targetDurationSeconds:
        typeof p['targetDurationSeconds'] === 'number' && p['targetDurationSeconds'] >= 0
          ? p['targetDurationSeconds']
          : 30,
    };
  }

  if (kind === 'video-shot-item') {
    const rawFraming = String(p['framing']);
    const framing: ShotFramingType = [
      'wide',
      'medium',
      'close-up',
      'extreme-close-up',
      'screen-recording',
      'b-roll',
      'motion-graphic',
    ].includes(rawFraming)
      ? (rawFraming as ShotFramingType)
      : 'medium';

    const rawProdStatus = String(p['status']);
    const status: ShotProductionStatus = ['planned', 'scripted', 'filmed', 'edited'].includes(rawProdStatus)
      ? (rawProdStatus as ShotProductionStatus)
      : 'planned';

    return {
      kind: 'video-shot-item',
      shotCode: typeof p['shotCode'] === 'string' ? p['shotCode'].slice(0, 50) : 'SHOT',
      framing,
      locationOrSetup: typeof p['locationOrSetup'] === 'string' ? p['locationOrSetup'].slice(0, 500) : '',
      audioCue: typeof p['audioCue'] === 'string' ? p['audioCue'].slice(0, 500) : '',
      status,
    };
  }

  if (kind === 'video-note') {
    const rawCat = String(p['noteCategory']);
    const noteCategory: 'voice-over' | 'typography' | 'sfx-transition' | 'general' = [
      'voice-over',
      'typography',
      'sfx-transition',
      'general',
    ].includes(rawCat)
      ? (rawCat as 'voice-over' | 'typography' | 'sfx-transition' | 'general')
      : 'general';

    return {
      kind: 'video-note',
      noteCategory,
      content: typeof p['content'] === 'string' ? p['content'].slice(0, 100_000) : '',
    };
  }

  // Student payloads
  if (kind === 'student-concept') {
    const rawMastery = String(p['mastery']);
    const mastery: MasteryLevel = ['new', 'learning', 'reviewing', 'mastered'].includes(rawMastery)
      ? (rawMastery as MasteryLevel)
      : 'new';

    return {
      kind: 'student-concept',
      isRootTopic: Boolean(p['isRootTopic']),
      mastery,
      summaryNotes: typeof p['summaryNotes'] === 'string' ? p['summaryNotes'].slice(0, 100_000) : '',
      keyTerms: Array.isArray(p['keyTerms']) ? p['keyTerms'].map((k: unknown) => String(k).slice(0, 100)) : [],
    };
  }

  if (kind === 'student-flashcard') {
    const hint = typeof p['hint'] === 'string' ? p['hint'].slice(0, 1000) : undefined;
    const lastReviewedAt = typeof p['lastReviewedAt'] === 'string' ? p['lastReviewedAt'] : undefined;
    const rawConf = String(p['lastConfidence']);
    const lastConfidence: FlashcardConfidence = ['unrated', 'again', 'hard', 'good', 'easy'].includes(rawConf)
      ? (rawConf as FlashcardConfidence)
      : 'unrated';

    return {
      kind: 'student-flashcard',
      frontPrompt: typeof p['frontPrompt'] === 'string' ? p['frontPrompt'].slice(0, 25_000) : '',
      backAnswer: typeof p['backAnswer'] === 'string' ? p['backAnswer'].slice(0, 25_000) : '',
      lastConfidence,
      reviewCount: typeof p['reviewCount'] === 'number' ? p['reviewCount'] : 0,
      ...(hint ? { hint } : {}),
      ...(lastReviewedAt ? { lastReviewedAt } : {}),
    };
  }

  if (kind === 'student-note') {
    const rawMastery = String(p['mastery']);
    const mastery: MasteryLevel = ['new', 'learning', 'reviewing', 'mastered'].includes(rawMastery)
      ? (rawMastery as MasteryLevel)
      : 'learning';

    return {
      kind: 'student-note',
      topicArea: typeof p['topicArea'] === 'string' ? p['topicArea'].slice(0, 250) : '',
      markdownBody: typeof p['markdownBody'] === 'string' ? p['markdownBody'].slice(0, 100_000) : '',
      mastery,
    };
  }

  if (kind === 'student-revision-block') {
    const rawPriority = String(p['priority']);
    const priority: 'low' | 'medium' | 'high' = ['low', 'medium', 'high'].includes(rawPriority)
      ? (rawPriority as 'low' | 'medium' | 'high')
      : 'medium';

    const examOrGoalDate = typeof p['examOrGoalDate'] === 'string' ? p['examOrGoalDate'].slice(0, 100) : undefined;

    return {
      kind: 'student-revision-block',
      priority,
      items: Array.isArray(p['items'])
        ? p['items'].map((c: unknown) => {
            const item = (typeof c === 'object' && c !== null ? c : {}) as Record<string, unknown>;
            return {
              id: String(item['id'] || ''),
              text: String(item['text'] || '').slice(0, 250),
              completed: Boolean(item['completed']),
            };
          })
        : [],
      ...(examOrGoalDate ? { examOrGoalDate } : {}),
    };
  }

  // Freelance & Business payloads
  if (kind === 'freelance-task') {
    const rawStatus = String(p['status']);
    const status: FreelanceTaskStatus = ['todo', 'in-progress', 'review', 'done'].includes(rawStatus)
      ? (rawStatus as FreelanceTaskStatus)
      : 'todo';

    const rawPriority = String(p['priority']);
    const priority: FreelanceTaskPriority = ['low', 'medium', 'high', 'urgent'].includes(rawPriority)
      ? (rawPriority as FreelanceTaskPriority)
      : 'medium';

    const dueDate = typeof p['dueDate'] === 'string' ? p['dueDate'].slice(0, 100) : undefined;

    const subtasks = Array.isArray(p['subtasks'])
      ? p['subtasks'].map((st: unknown) => {
          const item = (typeof st === 'object' && st !== null ? st : {}) as Record<string, unknown>;
          return {
            id: String(item['id'] || ''),
            text: String(item['text'] || '').slice(0, 250),
            completed: Boolean(item['completed']),
          };
        })
      : [];

    return {
      kind: 'freelance-task',
      status,
      priority,
      subtasks,
      ...(dueDate ? { dueDate } : {}),
    };
  }

  if (kind === 'freelance-stage') {
    const rawPhase = String(p['phase']);
    const phase: FreelanceStagePhase = ['brief', 'concept', 'execution', 'review', 'delivery'].includes(rawPhase)
      ? (rawPhase as FreelanceStagePhase)
      : 'brief';

    return {
      kind: 'freelance-stage',
      phase,
      stageNumber: typeof p['stageNumber'] === 'number' ? p['stageNumber'] : 1,
      deliverableSummary: typeof p['deliverableSummary'] === 'string' ? p['deliverableSummary'].slice(0, 5000) : '',
    };
  }

  if (kind === 'freelance-deliverable') {
    const reviewNotes = typeof p['reviewNotes'] === 'string' ? p['reviewNotes'].slice(0, 25_000) : undefined;
    return {
      kind: 'freelance-deliverable',
      format: typeof p['format'] === 'string' ? p['format'].slice(0, 100) : 'PDF / Assets',
      clientApproved: Boolean(p['clientApproved']),
      ...(reviewNotes ? { reviewNotes } : {}),
    };
  }

  if (kind === 'freelance-note') {
    const rawType = String(p['noteType']);
    const noteType: FreelanceNoteType = ['client-feedback', 'creative-brief', 'meeting', 'guideline'].includes(rawType)
      ? (rawType as FreelanceNoteType)
      : 'creative-brief';

    return {
      kind: 'freelance-note',
      noteType,
      markdownBody: typeof p['markdownBody'] === 'string' ? p['markdownBody'].slice(0, 100_000) : '',
    };
  }

  if (kind === 'freelance-review-item') {
    return {
      kind: 'freelance-review-item',
      reviewer: typeof p['reviewer'] === 'string' ? p['reviewer'].slice(0, 250) : 'Client',
      approved: Boolean(p['approved']),
      checklist: Array.isArray(p['checklist'])
        ? p['checklist'].map((c: unknown) => {
            const item = (typeof c === 'object' && c !== null ? c : {}) as Record<string, unknown>;
            return {
              id: String(item['id'] || ''),
              text: String(item['text'] || '').slice(0, 250),
              completed: Boolean(item['completed']),
            };
          })
        : [],
    };
  }

  // Fallback to dev note
  return {
    kind: 'dev-note',
    markdownBody: typeof p['markdownBody'] === 'string' ? p['markdownBody'].slice(0, 100_000) : '',
  };
}

export interface ValidateImportOptions {
  readonly stripBrokenEdges?: boolean;
}

/**
 * Validates untrusted raw JSON string according to docs/IMPORT_EXPORT_SPEC.md.
 */
export function validateProjectImport(
  rawJsonText: string,
  options: ValidateImportOptions = {}
): ImportValidationResult {
  // 1. Byte size check
  const byteSize = new Blob([rawJsonText]).size;
  if (byteSize > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      code: 'ERR_FILE_TOO_LARGE',
      message: `File size (${(byteSize / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB maximum limit.`,
    };
  }

  // 2. Safe JSON parse
  let parsed: unknown;
  try {
    parsed = safeJsonParse(rawJsonText);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON';
    if (msg.includes('Prototype pollution')) {
      return {
        success: false,
        code: 'ERR_PROTOTYPE_POLLUTION',
        message: 'Import blocked: file contains forbidden prototype pollution properties.',
      };
    }
    return {
      success: false,
      code: 'ERR_INVALID_JSON',
      message: `Failed to parse JSON: ${msg}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      success: false,
      code: 'ERR_INVALID_SCHEMA',
      message: 'Root JSON payload must be an object.',
    };
  }

  const root = parsed as Record<string, unknown>;

  // 3. Envelope check
  let rawProject: unknown;
  let envelopeMeta: { format: string; exportedAt?: string; appVersion?: string } | undefined;

  if (root['format'] === 'mindrail-project') {
    if (typeof root['schemaVersion'] !== 'number') {
      return {
        success: false,
        code: 'ERR_INVALID_ENVELOPE',
        message: 'File envelope missing numeric schemaVersion.',
      };
    }
    rawProject = root['project'];
    const expAt = typeof root['exportedAt'] === 'string' ? root['exportedAt'] : undefined;
    const aVer = typeof root['appVersion'] === 'string' ? root['appVersion'] : undefined;
    envelopeMeta = {
      format: 'mindrail-project',
      ...(expAt ? { exportedAt: expAt } : {}),
      ...(aVer ? { appVersion: aVer } : {}),
    };
  } else if (root['format'] === 'mindrail-backup-archive') {
    const count = Array.isArray(root['projects']) ? root['projects'].length : 0;
    return {
      success: false,
      code: 'ERR_INVALID_ENVELOPE',
      message: `This file is a multi-project backup archive containing ${count} project(s). To restore it, please use Settings > Restore Backup Archive.`,
    };
  } else if ('schemaVersion' in root && 'workspaceType' in root && 'nodes' in root) {
    rawProject = root;
  } else {
    return {
      success: false,
      code: 'ERR_INVALID_ENVELOPE',
      message: 'Invalid file format. File does not appear to be a MindRail Studio project.',
    };
  }

  // 4. Migration & Schema Version check
  let migratedProject: Project;
  try {
    migratedProject = migrateProjectToCurrentSchema(rawProject);
  } catch (err: unknown) {
    if (err instanceof UnsupportedSchemaVersionError) {
      return {
        success: false,
        code: 'ERR_UNSUPPORTED_SCHEMA_VERSION',
        message: err.message,
      };
    }
    return {
      success: false,
      code: 'ERR_INVALID_SCHEMA',
      message: err instanceof Error ? err.message : 'Schema migration failed.',
    };
  }

  const rawP = migratedProject as unknown as Record<string, unknown>;

  // 5. Reconstruct canonical Project strictly
  const id = typeof rawP['id'] === 'string' && rawP['id'].trim().length > 0 ? rawP['id'] : null;
  if (!id) {
    return {
      success: false,
      code: 'ERR_INVALID_SCHEMA',
      message: 'Project is missing a valid id.',
    };
  }

  const title = typeof rawP['title'] === 'string' ? rawP['title'].slice(0, 250).trim() || 'Imported Project' : 'Imported Project';

  const workspaceType = isValidWorkspaceType(rawP['workspaceType']) ? rawP['workspaceType'] : 'developer';

  // Metadata
  const rawMeta = typeof rawP['metadata'] === 'object' && rawP['metadata'] !== null ? (rawP['metadata'] as Record<string, unknown>) : {};
  const metadata = {
    description: typeof rawMeta['description'] === 'string' ? rawMeta['description'].slice(0, 25_000) : '',
    tags: Array.isArray(rawMeta['tags']) ? rawMeta['tags'].map((t) => String(t).slice(0, 50)) : [],
    createdAt: typeof rawMeta['createdAt'] === 'string' ? rawMeta['createdAt'] : new Date().toISOString(),
    updatedAt: typeof rawMeta['updatedAt'] === 'string' ? rawMeta['updatedAt'] : new Date().toISOString(),
    completedStudyMinutes: typeof rawMeta['completedStudyMinutes'] === 'number' ? rawMeta['completedStudyMinutes'] : 0,
    completedStudySessions: typeof rawMeta['completedStudySessions'] === 'number' ? rawMeta['completedStudySessions'] : 0,
    ...(typeof rawMeta['lastExportedAt'] === 'string' ? { lastExportedAt: rawMeta['lastExportedAt'] } : {}),
  };

  // Settings
  const rawSettings = typeof rawP['settings'] === 'object' && rawP['settings'] !== null ? (rawP['settings'] as Record<string, unknown>) : {};
  const settings: ProjectSettings = {
    snapToGrid: typeof rawSettings['snapToGrid'] === 'boolean' ? rawSettings['snapToGrid'] : true,
    gridSize: [8, 16, 32].includes(Number(rawSettings['gridSize'])) ? (Number(rawSettings['gridSize']) as 8 | 16 | 32) : 16,
    defaultEdgeStyle: isValidRoutingStyle(rawSettings['defaultEdgeStyle']) ? rawSettings['defaultEdgeStyle'] : 'bezier',
    studyTimerMinutes: typeof rawSettings['studyTimerMinutes'] === 'number' ? rawSettings['studyTimerMinutes'] : 25,
    studyBreakMinutes: typeof rawSettings['studyBreakMinutes'] === 'number' ? rawSettings['studyBreakMinutes'] : 5,
  };

  // Viewport
  const rawVp = typeof rawP['viewport'] === 'object' && rawP['viewport'] !== null ? (rawP['viewport'] as Record<string, unknown>) : {};
  const viewport: ViewportState = {
    x: typeof rawVp['x'] === 'number' && Number.isFinite(rawVp['x']) ? rawVp['x'] : 0,
    y: typeof rawVp['y'] === 'number' && Number.isFinite(rawVp['y']) ? rawVp['y'] : 0,
    zoom: typeof rawVp['zoom'] === 'number' && Number.isFinite(rawVp['zoom']) ? Math.min(3.0, Math.max(0.15, rawVp['zoom'])) : 1.0,
  };

  // Nodes
  if (!Array.isArray(rawP['nodes'])) {
    return {
      success: false,
      code: 'ERR_INVALID_SCHEMA',
      message: 'Project "nodes" field must be an array.',
    };
  }
  if (rawP['nodes'].length > MAX_NODES_COUNT) {
    return {
      success: false,
      code: 'ERR_LIMIT_EXCEEDED',
      message: `Node count (${rawP['nodes'].length}) exceeds maximum limit (${MAX_NODES_COUNT}).`,
    };
  }

  const nodes: CanvasNode[] = [];
  for (let i = 0; i < rawP['nodes'].length; i++) {
    const rawNode = rawP['nodes'][i];
    if (typeof rawNode !== 'object' || rawNode === null) continue;
    const n = rawNode as Record<string, unknown>;

    const nodeId = typeof n['id'] === 'string' ? n['id'].trim() : null;
    if (!nodeId) {
      return {
        success: false,
        code: 'ERR_INVALID_SCHEMA',
        message: `Node at index ${i} is missing a valid id.`,
      };
    }

    const pos = n['position'] as Record<string, unknown> | undefined;
    const position: CanvasPosition = {
      x: typeof pos?.['x'] === 'number' && Number.isFinite(pos['x']) ? pos['x'] : 0,
      y: typeof pos?.['y'] === 'number' && Number.isFinite(pos['y']) ? pos['y'] : 0,
    };

    const dims = n['dimensions'] as Record<string, unknown> | undefined;
    const dimensions: CanvasDimensions = {
      width: typeof dims?.['width'] === 'number' && Number.isFinite(dims['width']) ? Math.max(120, Math.min(2400, dims['width'])) : 280,
      height: typeof dims?.['height'] === 'number' && Number.isFinite(dims['height']) ? Math.max(60, Math.min(2400, dims['height'])) : 160,
    };

    const payload = sanitizePayload(n['payload']) ?? {
      kind: 'dev-note',
      markdownBody: '',
    };

    nodes.push({
      id: nodeId,
      title: typeof n['title'] === 'string' ? n['title'].slice(0, 250).trim() || 'Untitled Node' : 'Untitled Node',
      description: typeof n['description'] === 'string' ? n['description'].slice(0, 25_000) : '',
      position,
      dimensions,
      colorToken: isValidColorToken(n['colorToken']) ? n['colorToken'] : 'neutral',
      category: typeof n['category'] === 'string' ? n['category'].slice(0, 100) : '',
      tags: Array.isArray(n['tags']) ? n['tags'].map((t) => String(t).slice(0, 50)) : [],
      locked: Boolean(n['locked']),
      zIndex: typeof n['zIndex'] === 'number' ? n['zIndex'] : 1,
      createdAt: typeof n['createdAt'] === 'string' ? n['createdAt'] : new Date().toISOString(),
      updatedAt: typeof n['updatedAt'] === 'string' ? n['updatedAt'] : new Date().toISOString(),
      payload,
    });
  }

  // Edges
  if (!Array.isArray(rawP['edges'])) {
    return {
      success: false,
      code: 'ERR_INVALID_SCHEMA',
      message: 'Project "edges" field must be an array.',
    };
  }
  if (rawP['edges'].length > MAX_EDGES_COUNT) {
    return {
      success: false,
      code: 'ERR_LIMIT_EXCEEDED',
      message: `Edge count (${rawP['edges'].length}) exceeds maximum limit (${MAX_EDGES_COUNT}).`,
    };
  }

  const rawEdges: CanvasEdge[] = [];
  for (let i = 0; i < rawP['edges'].length; i++) {
    const rawEdge = rawP['edges'][i];
    if (typeof rawEdge !== 'object' || rawEdge === null) continue;
    const e = rawEdge as Record<string, unknown>;

    const edgeId = typeof e['id'] === 'string' ? e['id'].trim() : null;
    const sourceNodeId = typeof e['sourceNodeId'] === 'string' ? e['sourceNodeId'].trim() : null;
    const targetNodeId = typeof e['targetNodeId'] === 'string' ? e['targetNodeId'].trim() : null;

    if (!edgeId || !sourceNodeId || !targetNodeId) continue;

    rawEdges.push({
      id: edgeId,
      sourceNodeId,
      targetNodeId,
      sourcePort: isValidPortSide(e['sourcePort']) ? e['sourcePort'] : 'right',
      targetPort: isValidPortSide(e['targetPort']) ? e['targetPort'] : 'left',
      label: typeof e['label'] === 'string' ? e['label'].slice(0, 250) : '',
      routingStyle: isValidRoutingStyle(e['routingStyle']) ? e['routingStyle'] : 'bezier',
      strokePattern: isValidStrokePattern(e['strokePattern']) ? e['strokePattern'] : 'solid',
      directed: typeof e['directed'] === 'boolean' ? e['directed'] : true,
      ...(isValidColorToken(e['colorToken']) ? { colorToken: e['colorToken'] } : {}),
    });
  }

  // Checklist
  const checklist: ProjectChecklistItem[] = [];
  if (Array.isArray(rawP['checklist'])) {
    for (let i = 0; i < Math.min(rawP['checklist'].length, MAX_CHECKLIST_COUNT); i++) {
      const item = rawP['checklist'][i];
      if (typeof item !== 'object' || item === null) continue;
      const c = item as Record<string, unknown>;
      const itemId = typeof c['id'] === 'string' ? c['id'].trim() : null;
      if (!itemId) continue;
      const cat = typeof c['category'] === 'string' ? c['category'].slice(0, 100) : undefined;
      checklist.push({
        id: itemId,
        text: typeof c['text'] === 'string' ? c['text'].slice(0, 250) : '',
        completed: Boolean(c['completed']),
        ...(cat ? { category: cat } : {}),
      });
    }
  }

  // 6. Referential integrity check
  const candidateProject: Project = {
    id,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    title,
    workspaceType,
    metadata,
    settings,
    viewport,
    nodes,
    edges: rawEdges,
    checklist,
  };

  const integrity = validateProjectIntegrity(candidateProject);

  if (!integrity.isValid) {
    const hasDangling = integrity.issues.some(
      (i) => i.code === 'DANGLING_EDGE_SOURCE' || i.code === 'DANGLING_EDGE_TARGET' || i.code === 'SELF_LOOP_EDGE'
    );
    const hasDupId = integrity.issues.some((i) => i.code === 'DUPLICATE_NODE_ID' || i.code === 'DUPLICATE_EDGE_ID');

    if (hasDupId) {
      return {
        success: false,
        code: 'ERR_DUPLICATE_ENTITY_ID',
        message: 'Duplicate entity identifiers found in project file.',
        details: integrity.issues.map((i) => i.message),
      };
    }

    if (hasDangling) {
      if (options.stripBrokenEdges) {
        const sanitizedEdges = sanitizeProjectEdges(nodes, rawEdges);
        const removedCount = rawEdges.length - sanitizedEdges.length;
        const repairedProject: Project = {
          ...candidateProject,
          edges: sanitizedEdges,
        };
        return {
          success: true,
          project: repairedProject,
          ...(envelopeMeta ? { originalFileEnvelope: envelopeMeta } : {}),
          danglingEdgesRemoved: removedCount,
        };
      }

      return {
        success: false,
        code: 'ERR_DANGLING_EDGE_REFERENCE',
        message: 'Import failed: project contains invalid or broken connections.',
        details: integrity.issues.map((i) => i.message),
        recoverableWithEdgeStripping: true,
      };
    }

    return {
      success: false,
      code: 'ERR_INVALID_SCHEMA',
      message: 'Project failed integrity validation.',
      details: integrity.issues.map((i) => i.message),
    };
  }

  return {
    success: true,
    project: candidateProject,
    ...(envelopeMeta ? { originalFileEnvelope: envelopeMeta } : {}),
    danglingEdgesRemoved: 0,
  };
}

export interface BackupArchiveValidationResult {
  readonly success: boolean;
  readonly message?: string;
  readonly projectCount: number;
  readonly projects: readonly Project[];
  readonly errors: readonly string[];
}

/**
 * Validates a multi-project backup archive generated by SettingsView.
 */
export function validateBackupArchive(rawJsonText: string): BackupArchiveValidationResult {
  let parsed: unknown;
  try {
    parsed = safeJsonParse(rawJsonText);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON';
    return {
      success: false,
      message: `Failed to parse backup archive JSON: ${msg}`,
      projectCount: 0,
      projects: [],
      errors: [msg],
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      success: false,
      message: 'Backup archive root must be a JSON object.',
      projectCount: 0,
      projects: [],
      errors: ['Root is not an object'],
    };
  }

  const root = parsed as Record<string, unknown>;
  if (root['format'] !== 'mindrail-backup-archive' || !Array.isArray(root['projects'])) {
    return {
      success: false,
      message: 'Invalid backup format. Expected format "mindrail-backup-archive" with a projects array.',
      projectCount: 0,
      projects: [],
      errors: ['Format or projects array missing'],
    };
  }

  const validatedProjects: Project[] = [];
  const errors: string[] = [];

  for (let i = 0; i < root['projects'].length; i++) {
    const item = root['projects'][i];
    const itemJson = typeof item === 'string' ? item : JSON.stringify(item);
    const result = validateProjectImport(itemJson, { stripBrokenEdges: true });
    if (result.success) {
      validatedProjects.push(result.project);
    } else {
      errors.push(`Project #${i + 1}: ${result.message}`);
    }
  }

  return {
    success: validatedProjects.length > 0,
    message:
      validatedProjects.length > 0
        ? `Archive verified: found ${validatedProjects.length} valid project(s).`
        : 'No valid projects could be extracted from archive.',
    projectCount: validatedProjects.length,
    projects: validatedProjects,
    errors,
  };
}
