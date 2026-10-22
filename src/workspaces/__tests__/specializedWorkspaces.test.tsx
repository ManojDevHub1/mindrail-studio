import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createChecklistItem, createEdge, createNode, createProject } from '../../domain/factories';
import {
  calculateDeveloperSummary,
  calculateStudentSummary,
  calculateVideoSummary,
  formatSecondsToTimecode,
} from '../../domain/calculators';
import { NodeInspector } from '../NodeInspector';
import { EdgeInspector } from '../EdgeInspector';
import { WorkspaceSummaryBar } from '../WorkspaceSummaryBar';
import { FlashcardStudyModal } from '../student/FlashcardStudyModal';
import { clearAllData, getProject, saveProject } from '../../persistence/projectRepository';
import { copyToClipboard } from '../../utils/clipboard';

describe('Phase 4: Specialized Workspaces Suite', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  describe('Workspace A: Developer Studio', () => {
    it('creates, inspects, and modifies architecture and task nodes', () => {
      const handleUpdateNode = vi.fn();
      const handleDeleteNode = vi.fn();
      const handleClose = vi.fn();

      const taskNode = createNode('developer', {
        title: 'Auth Microservice Task',
        category: 'Task',
        payload: {
          kind: 'dev-task',
          issueType: 'task',
          status: 'todo',
          priority: 'high',
          estimatePoints: 5,
          subtasks: [createChecklistItem('Subtask 1'), createChecklistItem('Subtask 2')],
        },
      });

      const { rerender } = render(
        <NodeInspector
          node={taskNode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onClose={handleClose}
        />
      );

      // Verify task tracking section is displayed
      expect(screen.getByText('Task Tracking')).toBeInTheDocument();
      expect(screen.getByLabelText('Issue Type')).toHaveValue('task');
      expect(screen.getByLabelText('Status')).toHaveValue('todo');
      expect(screen.getByLabelText('Priority')).toHaveValue('high');
      expect(screen.getByLabelText('Estimate Points')).toHaveValue(5);

      // Verify subtasks are rendered
      expect(screen.getByText('Subtask 1')).toBeInTheDocument();
      expect(screen.getByText('Subtask 2')).toBeInTheDocument();

      // Change status to in-progress
      fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'in-progress' } });
      expect(handleUpdateNode).toHaveBeenCalledWith(
        taskNode.id,
        expect.objectContaining({
          payload: expect.objectContaining({ status: 'in-progress' }),
        }),
        undefined
      );

      // Change priority to critical
      fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'critical' } });
      expect(handleUpdateNode).toHaveBeenCalledWith(
        taskNode.id,
        expect.objectContaining({
          payload: expect.objectContaining({ priority: 'critical' }),
        }),
        undefined
      );

      // Test Architecture Node
      const archNode = createNode('developer', {
        title: 'PostgreSQL Database',
        category: 'Database',
        payload: {
          kind: 'dev-architecture',
          componentKind: 'database',
          techStack: 'PostgreSQL 16',
          status: 'healthy',
          environment: 'production',
          endpointHint: 'postgres://db.internal:5432',
        },
      });

      rerender(
        <NodeInspector
          node={archNode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onClose={handleClose}
        />
      );

      expect(screen.getByText('Architecture Details')).toBeInTheDocument();
      expect(screen.getByLabelText('Component Kind')).toHaveValue('database');
      expect(screen.getByLabelText('Tech Stack')).toHaveValue('PostgreSQL 16');
      expect(screen.getByLabelText('Health Status')).toHaveValue('healthy');
      expect(screen.getByLabelText('Environment')).toHaveValue('production');
      expect(screen.getByLabelText('Endpoint URL Hint')).toHaveValue('postgres://db.internal:5432');
    });

    it('calculates accurate developer workspace metrics', () => {
      const arch1 = createNode('developer', {
        payload: { kind: 'dev-architecture', componentKind: 'service', techStack: 'Node.js', status: 'healthy' },
      });
      const arch2 = createNode('developer', {
        payload: { kind: 'dev-architecture', componentKind: 'database', techStack: 'Postgres', status: 'healthy' },
      });
      const task1 = createNode('developer', {
        payload: {
          kind: 'dev-task',
          issueType: 'task',
          status: 'done',
          priority: 'high',
          subtasks: [],
        },
      });
      const task2 = createNode('developer', {
        payload: {
          kind: 'dev-task',
          issueType: 'bug',
          status: 'in-progress',
          priority: 'critical',
          subtasks: [],
        },
      });
      const snippet = createNode('developer', {
        payload: { kind: 'dev-code-snippet', language: 'typescript', code: 'console.log("ok");' },
      });

      const nodes = [arch1, arch2, task1, task2, snippet];
      const summary = calculateDeveloperSummary(nodes);

      expect(summary.totalTasks).toBe(2);
      expect(summary.byStatus.done).toBe(1);
      expect(summary.byStatus['in-progress']).toBe(1);
      expect(summary.completedPercentage).toBe(50);
      expect(summary.byPriority.critical).toBe(1);
      expect(summary.byPriority.high).toBe(1);

      // Verify rendering inside WorkspaceSummaryBar
      render(
        <WorkspaceSummaryBar
          workspaceType="developer"
          nodes={nodes}
          edges={[]}
        />
      );

      expect(screen.getByText('Components:')).toBeInTheDocument();
      expect(screen.getByText('1/2 Done')).toBeInTheDocument();
      expect(screen.getByText('Snippets:')).toBeInTheDocument();
    });

    it('copies snippet content to clipboard safely', async () => {
      const ok = await copyToClipboard('const answer = 42;');
      expect(typeof ok).toBe('boolean');
    });
  });

  describe('Workspace B: Video Creator Studio', () => {
    it('handles scene and script planning with duration calculations', () => {
      const scene1 = createNode('video', {
        title: 'Intro Scene',
        payload: {
          kind: 'video-scene',
          sceneNumber: 1,
          durationSeconds: 45,
          framing: 'close-up',
          scriptText: 'Welcome to MindRail Studio!',
          voiceOverNotes: 'Enthusiastic tone',
          typographyNotes: 'Big intro title',
          transitionAndSfxNotes: 'Bass drop',
          productionStatus: 'filmed',
          checklist: [],
        },
      });

      const scene2 = createNode('video', {
        title: 'Walkthrough Scene',
        payload: {
          kind: 'video-scene',
          sceneNumber: 2,
          durationSeconds: 90,
          framing: 'screen-recording',
          scriptText: 'Here is how you connect nodes.',
          voiceOverNotes: 'Calm tutorial tone',
          typographyNotes: 'Shortcut indicators',
          transitionAndSfxNotes: 'Keyboard clicks',
          productionStatus: 'scripted',
          checklist: [],
        },
      });

      const shot = createNode('video', {
        payload: {
          kind: 'video-shot-item',
          shotCode: 'SH-01',
          framing: 'medium',
          locationOrSetup: 'Studio Desk',
          audioCue: 'Mic A',
          status: 'planned',
        },
      });

      const nodes = [scene1, scene2, shot];
      const summary = calculateVideoSummary(nodes);

      expect(summary.sceneCount).toBe(2);
      expect(summary.totalRuntimeSeconds).toBe(135);
      expect(formatSecondsToTimecode(summary.totalRuntimeSeconds)).toBe('02:15');
      expect(summary.statusCounts.filmed).toBe(1);
      expect(summary.statusCounts.scripted).toBe(1);
      expect(summary.statusCounts.planned).toBe(1);

      // Verify rendering inside WorkspaceSummaryBar
      render(
        <WorkspaceSummaryBar
          workspaceType="video"
          nodes={nodes}
          edges={[]}
        />
      );

      expect(screen.getByText('Total Planned Runtime:')).toBeInTheDocument();
      expect(screen.getByText('02:15')).toBeInTheDocument();
      expect(screen.getByText('Scenes:')).toBeInTheDocument();
      expect(screen.getByText('Shots:')).toBeInTheDocument();
    });

    it('gracefully handles missing, zero, and fractional durations', () => {
      expect(formatSecondsToTimecode(0)).toBe('00:00');
      expect(formatSecondsToTimecode(-10)).toBe('00:00');
      expect(formatSecondsToTimecode(NaN)).toBe('00:00');
      expect(formatSecondsToTimecode(3665)).toBe('01:01:05'); // 1h 1m 5s
    });
  });

  describe('Workspace C: Student Studio & Interactive Flashcard Study Mode', () => {
    it('calculates mastery distribution and updates flashcard confidence', () => {
      const concept1 = createNode('student', {
        title: 'Virtual Memory',
        payload: {
          kind: 'student-concept',
          isRootTopic: true,
          mastery: 'mastered',
          summaryNotes: 'Paging and TLB',
          keyTerms: ['Paging', 'TLB', 'Page Table'],
        },
      });

      const concept2 = createNode('student', {
        title: 'Deadlocks',
        payload: {
          kind: 'student-concept',
          isRootTopic: false,
          mastery: 'learning',
          summaryNotes: 'Four Coffman conditions',
          keyTerms: ['Mutual Exclusion', 'Hold and Wait'],
        },
      });

      const card = createNode('student', {
        title: 'Paging Card',
        payload: {
          kind: 'student-flashcard',
          frontPrompt: 'What causes a page fault?',
          backAnswer: 'Accessing a virtual page not present in physical RAM.',
          hint: 'Think about physical memory presence.',
          lastConfidence: 'good',
          reviewCount: 2,
        },
      });

      const nodes = [concept1, concept2, card];
      const summary = calculateStudentSummary(nodes);

      expect(summary.totalConcepts).toBe(2);
      expect(summary.totalFlashcards).toBe(1);
      expect(summary.masteryCounts.mastered).toBe(1);
      expect(summary.masteryCounts.learning).toBe(1);
      expect(summary.masteryPercentage).toBe(50);

      // Verify rendering inside WorkspaceSummaryBar
      const handleOpenStudy = vi.fn();
      render(
        <WorkspaceSummaryBar
          workspaceType="student"
          nodes={nodes}
          edges={[]}
          onOpenStudyMode={handleOpenStudy}
        />
      );

      expect(screen.getByText('Concepts:')).toBeInTheDocument();
      expect(screen.getByText('Flashcards:')).toBeInTheDocument();
      expect(screen.getByText(/1\/2 \(50%\)/)).toBeInTheDocument();

      const studyBtn = screen.getByRole('button', { name: /Study Flashcards \(1\)/i });
      fireEvent.click(studyBtn);
      expect(handleOpenStudy).toHaveBeenCalledTimes(1);
    });

    it('interactively flips flashcards, reveals hints, and rates recall in Study Mode', () => {
      const handleUpdateCard = vi.fn();
      const handleClose = vi.fn();

      const card1 = createNode('student', {
        id: 'card-1',
        title: 'Question 1',
        payload: {
          kind: 'student-flashcard',
          frontPrompt: 'What is ACID in databases?',
          backAnswer: 'Atomicity, Consistency, Isolation, Durability',
          hint: 'Transactions properties',
          lastConfidence: 'unrated',
          reviewCount: 0,
        },
      });

      const card2 = createNode('student', {
        id: 'card-2',
        title: 'Question 2',
        payload: {
          kind: 'student-flashcard',
          frontPrompt: 'What is a Foreign Key?',
          backAnswer: 'A field referencing a primary key in another table.',
          lastConfidence: 'unrated',
          reviewCount: 0,
        },
      });

      render(
        <FlashcardStudyModal
          isOpen={true}
          cards={[card1, card2]}
          onClose={handleClose}
          onUpdateCard={handleUpdateCard}
        />
      );

      // Initial state: Question visible, Answer hidden
      expect(screen.getByText('What is ACID in databases?')).toBeInTheDocument();
      expect(screen.queryByText(/Atomicity, Consistency/i)).not.toBeInTheDocument();
      expect(screen.getByText('Card 1 of 2')).toBeInTheDocument();

      // Show hint
      const hintBtn = screen.getByRole('button', { name: 'Show Hint' });
      fireEvent.click(hintBtn);
      expect(screen.getByText(/Transactions properties/i)).toBeInTheDocument();

      // Reveal Answer
      const revealBtn = screen.getByRole('button', { name: /Reveal Answer/i });
      fireEvent.click(revealBtn);

      // Answer now visible
      expect(screen.getByText('Atomicity, Consistency, Isolation, Durability')).toBeInTheDocument();

      // Confidence ratings visible
      const goodBtn = screen.getByTitle(/Rate: Good/i);
      fireEvent.click(goodBtn);

      // Verify onUpdateCard was called with reviewCount incremented and confidence recorded
      expect(handleUpdateCard).toHaveBeenCalledWith(
        'card-1',
        expect.objectContaining({
          lastConfidence: 'good',
          reviewCount: 1,
        })
      );

      // Modal automatically advances to card 2
      expect(screen.getByText('What is a Foreign Key?')).toBeInTheDocument();
      expect(screen.getByText('Card 2 of 2')).toBeInTheDocument();
    });
  });

  describe('Connection Semantics & Edge Inspector', () => {
    it('allows updating relationship labels, routing style, stroke pattern, and deletion', () => {
      const handleUpdateEdge = vi.fn();
      const handleDeleteEdge = vi.fn();
      const handleClose = vi.fn();

      const edge = createEdge({
        id: 'edge-123',
        sourceNodeId: 'node-a',
        targetNodeId: 'node-b',
        sourcePort: 'right',
        targetPort: 'left',
        label: 'HTTP REST /v1/users',
        routingStyle: 'bezier',
        strokePattern: 'solid',
        directed: true,
      });

      render(
        <EdgeInspector
          edge={edge}
          sourceNodeTitle="API Gateway"
          targetNodeTitle="User Service"
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
          onClose={handleClose}
        />
      );

      // Endpoints visible
      expect(screen.getByText('API Gateway')).toBeInTheDocument();
      expect(screen.getByText('User Service')).toBeInTheDocument();

      // Label input
      const labelInput = screen.getByLabelText('Relationship Label');
      expect(labelInput).toHaveValue('HTTP REST /v1/users');

      // Update label
      fireEvent.change(labelInput, { target: { value: 'gRPC stream' } });
      expect(handleUpdateEdge).toHaveBeenCalledWith('edge-123', { label: 'gRPC stream' });

      // Routing style select
      const routingSelect = screen.getByLabelText('Routing Style');
      fireEvent.change(routingSelect, { target: { value: 'orthogonal' } });
      expect(handleUpdateEdge).toHaveBeenCalledWith('edge-123', { routingStyle: 'orthogonal' });

      // Delete connection
      const deleteBtn = screen.getByRole('button', { name: /Delete Connection/i });
      fireEvent.click(deleteBtn);
      expect(handleDeleteEdge).toHaveBeenCalledWith('edge-123');
    });
  });

  describe('Local-First Persistence for Specialized Payloads', () => {
    it('persists and restores specialized nodes across all three workspaces', async () => {
      const p = createProject('developer', { title: 'Persistence Test' });
      const devNode = createNode('developer', {
        title: 'Backend API',
        payload: {
          kind: 'dev-architecture',
          componentKind: 'service',
          techStack: 'FastAPI / Python',
          status: 'healthy',
        },
      });
      const vidNode = createNode('video', {
        title: 'Teaser Scene',
        payload: {
          kind: 'video-scene',
          sceneNumber: 1,
          durationSeconds: 15,
          framing: 'close-up',
          scriptText: 'Check this out!',
          voiceOverNotes: 'Whisper',
          typographyNotes: 'Fade in',
          transitionAndSfxNotes: 'Subtle boom',
          productionStatus: 'filmed',
          checklist: [],
        },
      });
      const stuNode = createNode('student', {
        title: 'Flashcard 1',
        payload: {
          kind: 'student-flashcard',
          frontPrompt: 'What is Shannon Entropy?',
          backAnswer: 'A measure of information content or uncertainty.',
          lastConfidence: 'easy',
          reviewCount: 5,
        },
      });

      const edge = createEdge({
        sourceNodeId: devNode.id,
        targetNodeId: vidNode.id,
        label: 'Documents',
      });

      const fullProject = {
        ...p,
        nodes: [devNode, vidNode, stuNode],
        edges: [edge],
      };

      await saveProject(fullProject);

      const recovered = await getProject(p.id);
      expect(recovered).toBeDefined();
      expect(recovered?.nodes.length).toBe(3);
      expect(recovered?.edges.length).toBe(1);
      expect(recovered?.edges[0]?.label).toBe('Documents');

      const restoredDev = recovered?.nodes.find((n) => n.id === devNode.id);
      expect(restoredDev?.payload.kind).toBe('dev-architecture');
      if (restoredDev?.payload.kind === 'dev-architecture') {
        expect(restoredDev.payload.techStack).toBe('FastAPI / Python');
      }

      const restoredStu = recovered?.nodes.find((n) => n.id === stuNode.id);
      expect(restoredStu?.payload.kind).toBe('student-flashcard');
      if (restoredStu?.payload.kind === 'student-flashcard') {
        expect(restoredStu.payload.reviewCount).toBe(5);
        expect(restoredStu.payload.lastConfidence).toBe('easy');
      }
    });
  });
});
