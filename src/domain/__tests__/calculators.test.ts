import { describe, expect, it } from 'vitest';
import {
  calculateDeveloperSummary,
  calculateProjectMetrics,
  calculateStudentSummary,
  calculateVideoSummary,
  formatSecondsToTimecode,
} from '../calculators';
import { createChecklistItem, createEdge, createNode, createProject } from '../factories';

describe('Calculators', () => {
  it('formats seconds to timecodes accurately', () => {
    expect(formatSecondsToTimecode(0)).toBe('00:00');
    expect(formatSecondsToTimecode(45)).toBe('00:45');
    expect(formatSecondsToTimecode(75)).toBe('01:15');
    expect(formatSecondsToTimecode(3665)).toBe('01:01:05');
  });

  it('calculates video summary metrics', () => {
    const s1 = createNode('video', {
      payload: {
        kind: 'video-scene',
        sceneNumber: 1,
        durationSeconds: 30,
        framing: 'wide',
        scriptText: '',
        voiceOverNotes: '',
        typographyNotes: '',
        transitionAndSfxNotes: '',
        productionStatus: 'scripted',
        checklist: [],
      },
    });
    const s2 = createNode('video', {
      payload: {
        kind: 'video-scene',
        sceneNumber: 2,
        durationSeconds: 45,
        framing: 'close-up',
        scriptText: '',
        voiceOverNotes: '',
        typographyNotes: '',
        transitionAndSfxNotes: '',
        productionStatus: 'filmed',
        checklist: [],
      },
    });

    const summary = calculateVideoSummary([s1, s2]);
    expect(summary.sceneCount).toBe(2);
    expect(summary.totalRuntimeSeconds).toBe(75);
    expect(summary.statusCounts.scripted).toBe(1);
    expect(summary.statusCounts.filmed).toBe(1);
  });

  it('calculates student mastery breakdown', () => {
    const c1 = createNode('student', {
      payload: {
        kind: 'student-concept',
        isRootTopic: false,
        mastery: 'learning',
        summaryNotes: '',
        keyTerms: [],
      },
    });
    const c2 = createNode('student', {
      payload: {
        kind: 'student-concept',
        isRootTopic: false,
        mastery: 'mastered',
        summaryNotes: '',
        keyTerms: [],
      },
    });
    const flashcard = createNode('student', {
      payload: {
        kind: 'student-flashcard',
        frontPrompt: 'What is ACID?',
        backAnswer: 'Atomicity, Consistency, Isolation, Durability',
        lastConfidence: 'good',
        reviewCount: 3,
      },
    });

    const summary = calculateStudentSummary([c1, c2, flashcard]);
    expect(summary.totalConcepts).toBe(2);
    expect(summary.totalFlashcards).toBe(1);
    expect(summary.masteryPercentage).toBe(50);
  });

  it('calculates developer task summary', () => {
    const t1 = createNode('developer', {
      payload: {
        kind: 'dev-task',
        issueType: 'task',
        status: 'done',
        priority: 'high',
        subtasks: [],
      },
    });
    const t2 = createNode('developer', {
      payload: {
        kind: 'dev-task',
        issueType: 'bug',
        status: 'in-progress',
        priority: 'critical',
        subtasks: [],
      },
    });

    const summary = calculateDeveloperSummary([t1, t2]);
    expect(summary.totalTasks).toBe(2);
    expect(summary.byStatus.done).toBe(1);
    expect(summary.byStatus['in-progress']).toBe(1);
    expect(summary.completedPercentage).toBe(50);
  });

  it('calculates general project metrics', () => {
    const project = createProject('developer', {
      nodes: [createNode('developer')],
      edges: [createEdge({ sourceNodeId: '1', targetNodeId: '2' })],
      checklist: [
        createChecklistItem('Task 1'),
        { ...createChecklistItem('Task 2'), completed: true },
      ],
    });

    const metrics = calculateProjectMetrics(project);
    expect(metrics.nodeCount).toBe(1);
    expect(metrics.edgeCount).toBe(1);
    expect(metrics.checklistTotal).toBe(2);
    expect(metrics.checklistCompleted).toBe(1);
  });
});
