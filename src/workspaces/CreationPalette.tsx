/**
 * Left Creation Palette for spawning workspace nodes.
 */
import type { CanvasNode, NodeColorToken, WorkspaceType } from '../domain/models';
import { createNode } from '../domain/factories';
import styles from './CreationPalette.module.css';

export interface CreationPaletteProps {
  workspaceType: WorkspaceType;
  onAddNode: (node: CanvasNode) => void;
  viewportCenter: { x: number; y: number };
  isOpen?: boolean;
  onClose?: () => void;
}

interface PaletteItemDef {
  label: string;
  color: NodeColorToken;
  create: (workspaceType: WorkspaceType, center: { x: number; y: number }) => CanvasNode;
}

const DEVELOPER_PALETTE: readonly PaletteItemDef[] = [
  {
    label: 'Service Node',
    color: 'blue',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Backend Service',
        category: 'Service',
        colorToken: 'blue',
        position: center,
        payload: {
          kind: 'dev-architecture',
          componentKind: 'service',
          techStack: 'Node.js / TypeScript',
          status: 'healthy',
        },
      }),
  },
  {
    label: 'Database Node',
    color: 'emerald',
    create: (ws, center) =>
      createNode(ws, {
        title: 'PostgreSQL Database',
        category: 'Database',
        colorToken: 'emerald',
        position: center,
        payload: {
          kind: 'dev-architecture',
          componentKind: 'database',
          techStack: 'PostgreSQL 16',
          status: 'healthy',
        },
      }),
  },
  {
    label: 'Message Queue',
    color: 'amber',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Event Queue',
        category: 'Queue',
        colorToken: 'amber',
        position: center,
        payload: {
          kind: 'dev-architecture',
          componentKind: 'queue',
          techStack: 'Redis Streams',
          status: 'planned',
        },
      }),
  },
  {
    label: 'Code Snippet',
    color: 'cyan',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Auth Handler',
        category: 'Code',
        colorToken: 'cyan',
        position: center,
        payload: {
          kind: 'dev-code-snippet',
          language: 'typescript',
          code: 'export async function handleAuth(req: Request) {\n  // JWT validation\n}',
        },
      }),
  },
  {
    label: 'Engineering Task',
    color: 'purple',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Implement OAuth Login',
        category: 'Task',
        colorToken: 'purple',
        position: center,
        payload: {
          kind: 'dev-task',
          issueType: 'task',
          status: 'todo',
          priority: 'high',
          subtasks: [],
        },
      }),
  },
  {
    label: 'API Gateway',
    color: 'blue',
    create: (ws, center) =>
      createNode(ws, {
        title: 'API Gateway',
        category: 'Ingress',
        colorToken: 'blue',
        position: center,
        payload: {
          kind: 'dev-architecture',
          componentKind: 'boundary',
          techStack: 'Envoy / NGINX',
          status: 'healthy',
          endpointHint: 'https://api.example.com/v1',
        },
      }),
  },
  {
    label: 'Technical Note',
    color: 'neutral',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Architecture Decision Record',
        category: 'ADR',
        colorToken: 'neutral',
        position: center,
        payload: {
          kind: 'dev-note',
          markdownBody: '### Decision\nAdopt local-first persistence via IndexedDB.\n\n### Rationale\nEnsures zero backend operating cost and offline privacy.',
        },
      }),
  },
];

const VIDEO_PALETTE: readonly PaletteItemDef[] = [
  {
    label: 'Scene Card',
    color: 'orange',
    create: (ws, center) =>
      createNode(ws, {
        title: 'New Scene',
        category: 'Scene',
        colorToken: 'orange',
        position: center,
        payload: {
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
        },
      }),
  },
  {
    label: 'Script Beat',
    color: 'rose',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Hook / Teaser',
        category: 'Script Beat',
        colorToken: 'rose',
        position: center,
        payload: {
          kind: 'video-script-beat',
          beatType: 'hook',
          scriptText: 'Have you ever wondered...',
          targetDurationSeconds: 15,
        },
      }),
  },
  {
    label: 'Shot Item',
    color: 'amber',
    create: (ws, center) =>
      createNode(ws, {
        title: 'A-Roll Talking Head',
        category: 'Shot',
        colorToken: 'amber',
        position: center,
        payload: {
          kind: 'video-shot-item',
          shotCode: 'SH-01',
          framing: 'medium',
          locationOrSetup: 'Studio Desk',
          audioCue: 'Mic A',
          status: 'planned',
        },
      }),
  },
  {
    label: 'Production Note',
    color: 'neutral',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Audio & SFX Notes',
        category: 'Audio',
        colorToken: 'neutral',
        position: center,
        payload: {
          kind: 'video-note',
          noteCategory: 'sfx-transition',
          content: 'Keep background music at -18dB during voiceover, bring up to -6dB during transitions.',
        },
      }),
  },
];

const STUDENT_PALETTE: readonly PaletteItemDef[] = [
  {
    label: 'Concept Node',
    color: 'emerald',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Core Concept',
        category: 'Concept',
        colorToken: 'emerald',
        position: center,
        payload: {
          kind: 'student-concept',
          isRootTopic: false,
          mastery: 'new',
          summaryNotes: '',
          keyTerms: [],
        },
      }),
  },
  {
    label: 'Flashcard',
    color: 'blue',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Recall Card',
        category: 'Flashcard',
        colorToken: 'blue',
        position: center,
        payload: {
          kind: 'student-flashcard',
          frontPrompt: 'What is the key principle?',
          backAnswer: 'The core answer goes here.',
          lastConfidence: 'unrated',
          reviewCount: 0,
        },
      }),
  },
  {
    label: 'Study Note',
    color: 'purple',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Lecture Note',
        category: 'Note',
        colorToken: 'purple',
        position: center,
        payload: {
          kind: 'student-note',
          topicArea: 'Chapter 1',
          markdownBody: '',
          mastery: 'learning',
        },
      }),
  },
  {
    label: 'Revision Block',
    color: 'amber',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Final Exam Preparation',
        category: 'Revision',
        colorToken: 'amber',
        position: center,
        payload: {
          kind: 'student-revision-block',
          priority: 'high',
          items: [],
        },
      }),
  },
];

const FREELANCE_PALETTE: readonly PaletteItemDef[] = [
  {
    label: 'Client Task',
    color: 'blue',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Deliverable Sprint Task',
        category: 'Task',
        colorToken: 'blue',
        position: center,
        payload: {
          kind: 'freelance-task',
          status: 'todo',
          priority: 'medium',
          subtasks: [],
        },
      }),
  },
  {
    label: 'Project Milestone / Stage',
    color: 'purple',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Phase 1: Discovery & Strategy',
        category: 'Milestone',
        colorToken: 'purple',
        position: center,
        payload: {
          kind: 'freelance-stage',
          phase: 'concept',
          stageNumber: 1,
          deliverableSummary: 'Initial discovery deck & moodboards',
        },
      }),
  },
  {
    label: 'Deliverable Asset',
    color: 'emerald',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Final Brand Guidelines PDF',
        category: 'Deliverable',
        colorToken: 'emerald',
        position: center,
        payload: {
          kind: 'freelance-deliverable',
          format: 'Vector PDF & Figma Assets',
          clientApproved: false,
        },
      }),
  },
  {
    label: 'Creative Brief & Notes',
    color: 'cyan',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Client Creative Brief',
        category: 'Brief',
        colorToken: 'cyan',
        position: center,
        payload: {
          kind: 'freelance-note',
          noteType: 'creative-brief',
          markdownBody: '### Goals & Audience\n- Target demographics: young professionals\n- Brand voice: modern, approachable, authoritative',
        },
      }),
  },
  {
    label: 'Client Review & Sign-Off',
    color: 'amber',
    create: (ws, center) =>
      createNode(ws, {
        title: 'Milestone Sign-Off',
        category: 'Review',
        colorToken: 'amber',
        position: center,
        payload: {
          kind: 'freelance-review-item',
          reviewer: 'Client Stakeholder',
          approved: false,
          checklist: [],
        },
      }),
  },
];

export function CreationPalette({
  workspaceType,
  onAddNode,
  viewportCenter,
  isOpen = false,
  onClose,
}: CreationPaletteProps) {
  let items = DEVELOPER_PALETTE;
  if (workspaceType === 'video') items = VIDEO_PALETTE;
  if (workspaceType === 'student') items = STUDENT_PALETTE;
  if (workspaceType === 'freelance') items = FREELANCE_PALETTE;

  return (
    <>
      {isOpen && onClose && (
        <div
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`${styles.palette} ${isOpen ? styles.paletteOpen : ''}`}
        aria-label="Creation Palette"
      >
        <div className={styles.header}>
          <span className={styles.title}>Add Nodes</span>
          {onClose && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close palette"
              title="Close palette"
            >
              &times;
            </button>
          )}
        </div>
        <div className={styles.nodeList}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={styles.nodeButton}
              onClick={() => {
                onAddNode(item.create(workspaceType, viewportCenter));
              }}
            >
              <span
                className={styles.colorIndicator}
                style={{ backgroundColor: `var(--mr-node-${item.color}-accent)` }}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
