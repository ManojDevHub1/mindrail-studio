/**
 * Pure derived calculation helpers (docs/DATA_MODEL.md section 7).
 */
import type { CanvasNode, Project } from './models';
import type {
  DevTaskPriority,
  DevTaskStatus,
  FreelanceTaskPriority,
  FreelanceTaskStatus,
  MasteryLevel,
  ShotProductionStatus,
} from './workspaceTypes';

/**
 * Formats seconds into MM:SS or HH:MM:SS format.
 */
export function formatSecondsToTimecode(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculates total video runtime across video-scene nodes.
 */
export function calculateVideoTotalRuntimeSeconds(nodes: readonly CanvasNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (node.payload.kind === 'video-scene') {
      total += Math.max(0, node.payload.durationSeconds);
    }
  }
  return total;
}

export interface VideoProductionSummary {
  readonly totalRuntimeSeconds: number;
  readonly sceneCount: number;
  readonly statusCounts: Record<ShotProductionStatus, number>;
}

export function calculateVideoSummary(nodes: readonly CanvasNode[]): VideoProductionSummary {
  let totalRuntimeSeconds = 0;
  let sceneCount = 0;
  const statusCounts: Record<ShotProductionStatus, number> = {
    planned: 0,
    scripted: 0,
    filmed: 0,
    edited: 0,
  };

  for (const node of nodes) {
    if (node.payload.kind === 'video-scene') {
      sceneCount++;
      totalRuntimeSeconds += Math.max(0, node.payload.durationSeconds);
      statusCounts[node.payload.productionStatus]++;
    } else if (node.payload.kind === 'video-shot-item') {
      statusCounts[node.payload.status]++;
    }
  }

  return {
    totalRuntimeSeconds,
    sceneCount,
    statusCounts,
  };
}

export interface StudentMasterySummary {
  readonly totalConcepts: number;
  readonly totalFlashcards: number;
  readonly masteryCounts: Record<MasteryLevel, number>;
  readonly masteryPercentage: number;
}

export function calculateStudentSummary(nodes: readonly CanvasNode[]): StudentMasterySummary {
  let totalConcepts = 0;
  let totalFlashcards = 0;
  const masteryCounts: Record<MasteryLevel, number> = {
    new: 0,
    learning: 0,
    reviewing: 0,
    mastered: 0,
  };

  for (const node of nodes) {
    if (node.payload.kind === 'student-concept') {
      totalConcepts++;
      masteryCounts[node.payload.mastery]++;
    } else if (node.payload.kind === 'student-note') {
      totalConcepts++;
      masteryCounts[node.payload.mastery]++;
    } else if (node.payload.kind === 'student-flashcard') {
      totalFlashcards++;
    }
  }

  const masteredCount = masteryCounts.mastered;
  const masteryPercentage = totalConcepts > 0 ? Math.round((masteredCount / totalConcepts) * 100) : 0;

  return {
    totalConcepts,
    totalFlashcards,
    masteryCounts,
    masteryPercentage,
  };
}

export interface DeveloperTaskSummary {
  readonly totalTasks: number;
  readonly byStatus: Record<DevTaskStatus, number>;
  readonly byPriority: Record<DevTaskPriority, number>;
  readonly completedPercentage: number;
}

export function calculateDeveloperSummary(nodes: readonly CanvasNode[]): DeveloperTaskSummary {
  let totalTasks = 0;
  const byStatus: Record<DevTaskStatus, number> = {
    backlog: 0,
    todo: 0,
    'in-progress': 0,
    review: 0,
    done: 0,
  };
  const byPriority: Record<DevTaskPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const node of nodes) {
    if (node.payload.kind === 'dev-task') {
      totalTasks++;
      byStatus[node.payload.status]++;
      byPriority[node.payload.priority]++;
    }
  }

  const doneCount = byStatus.done;
  const completedPercentage = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return {
    totalTasks,
    byStatus,
    byPriority,
    completedPercentage,
  };
}

export interface FreelanceSummary {
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly byStatus: Record<FreelanceTaskStatus, number>;
  readonly byPriority: Record<FreelanceTaskPriority, number>;
  readonly completedPercentage: number;
  readonly totalStages: number;
  readonly totalDeliverables: number;
  readonly approvedDeliverables: number;
}

export function calculateFreelanceSummary(nodes: readonly CanvasNode[]): FreelanceSummary {
  let totalTasks = 0;
  let totalStages = 0;
  let totalDeliverables = 0;
  let approvedDeliverables = 0;

  const byStatus: Record<FreelanceTaskStatus, number> = {
    todo: 0,
    'in-progress': 0,
    review: 0,
    done: 0,
  };

  const byPriority: Record<FreelanceTaskPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };

  for (const node of nodes) {
    if (node.payload.kind === 'freelance-task') {
      totalTasks++;
      byStatus[node.payload.status]++;
      byPriority[node.payload.priority]++;
    } else if (node.payload.kind === 'freelance-stage') {
      totalStages++;
    } else if (node.payload.kind === 'freelance-deliverable') {
      totalDeliverables++;
      if (node.payload.clientApproved) {
        approvedDeliverables++;
      }
    }
  }

  const completedTasks = byStatus.done;
  const completedPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    byStatus,
    byPriority,
    completedPercentage,
    totalStages,
    totalDeliverables,
    approvedDeliverables,
  };
}

export function calculateProjectMetrics(project: Project) {
  const checklistTotal = project.checklist.length;
  const checklistCompleted = project.checklist.filter((item) => item.completed).length;

  return {
    nodeCount: project.nodes.length,
    edgeCount: project.edges.length,
    checklistTotal,
    checklistCompleted,
  };
}
