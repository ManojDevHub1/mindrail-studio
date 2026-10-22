/**
 * Workspace-specific node payload schemas matching docs/DATA_MODEL.md
 */
import type { IsoTimestamp, ProjectChecklistItem } from './models';

/* -------------------------------------------------------------------------- */
/* Developer Workspace Payloads                                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Video Creator Workspace Payloads                                           */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Student Workspace Payloads                                                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Freelance & Business Workspace Payloads                                    */
/* -------------------------------------------------------------------------- */

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

export type WorkspaceNodePayload =
  | DeveloperNodePayload
  | VideoNodePayload
  | StudentNodePayload
  | FreelanceNodePayload;
