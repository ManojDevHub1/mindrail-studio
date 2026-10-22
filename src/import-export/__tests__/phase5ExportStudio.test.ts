/**
 * Phase 5 Automated Tests for Export Studio:
 * - Standalone SVG Architecture Diagram generation
 * - Content bounds calculation with negative coordinates and padding
 * - XML entity escaping
 * - Offscreen canvas PNG rasterization
 * - Markdown Storyboard & Study Guide generation
 */
import { describe, it, expect, vi } from 'vitest';
import {
  calculateDiagramBounds,
  escapeXml,
  exportSvgDiagram,
  generateSvgPath,
} from '../exportSvgDiagram';
import { exportPngDiagramBlob } from '../exportPngDiagram';
import {
  exportMarkdownStoryboard,
  exportMarkdownStudyGuide,
} from '../exportMarkdownStoryboard';
import { formatSecondsToTimecode } from '../../domain/calculators';
import { createProject, createNode, createEdge } from '../../domain/factories';
import type { CanvasNode, Project } from '../../domain/models';

describe('Phase 5: Export Studio Suite', () => {
  describe('SVG Diagram Generator (exportSvgDiagram.ts)', () => {
    it('escapes XML special characters safely', () => {
      expect(escapeXml('AT&T <script> "alert(\'XSS\')" & more')).toBe(
        'AT&amp;T &lt;script&gt; &quot;alert(&apos;XSS&apos;)&quot; &amp; more'
      );
      expect(escapeXml('')).toBe('');
      expect(escapeXml('Normal text 123')).toBe('Normal text 123');
    });

    it('calculates diagram bounds with proper padding and content coordinates', () => {
      const node1 = createNode('developer', {
        position: { x: 100, y: 200 },
        title: 'Node 1',
      });
      const node2 = createNode('developer', {
        position: { x: 500, y: 400 },
        title: 'Node 2',
      });

      const bounds = calculateDiagramBounds([node1, node2], 60);

      // node dims are 280 x 160
      // minX = 100 - 60 = 40
      // minY = 200 - 60 = 140
      // maxX = 500 + 280 + 60 = 840 (width = 840 - 40 = 800)
      // maxY = 400 + 160 + 60 = 620 (height = 620 - 140 = 480)
      expect(bounds.minX).toBe(40);
      expect(bounds.minY).toBe(140);
      expect(bounds.width).toBe(800);
      expect(bounds.height).toBe(480);
    });

    it('calculates diagram bounds correctly for negative coordinates', () => {
      const nodeNeg = createNode('developer', {
        position: { x: -300, y: -150 },
        title: 'Negative Node',
      });

      const bounds = calculateDiagramBounds([nodeNeg], 40);

      // minX = -300 - 40 = -340
      // minY = -150 - 40 = -190
      // maxX = -300 + 280 + 40 = 20 (width = 20 - (-340) = 360)
      // maxY = -150 + 160 + 40 = 50 (height = 50 - (-190) = 240)
      expect(bounds.minX).toBe(-340);
      expect(bounds.minY).toBe(-190);
      expect(bounds.width).toBe(360);
      expect(bounds.height).toBe(240);
    });

    it('provides graceful fallback bounds when canvas has no nodes', () => {
      const bounds = calculateDiagramBounds([], 60);
      expect(bounds.minX).toBe(0);
      expect(bounds.minY).toBe(0);
      expect(bounds.width).toBe(800);
      expect(bounds.height).toBe(500);
    });

    it('generates SVG bezier curves accurately between source and target points', () => {
      const pathRightToLeft = generateSvgPath({ x: 100, y: 100 }, { x: 300, y: 100 }, 'bezier', 'right', 'left');
      expect(pathRightToLeft).toContain('M 100 100');
      expect(pathRightToLeft).toContain('C');
      expect(pathRightToLeft).toContain('300 100');

      const pathBottomToTop = generateSvgPath({ x: 100, y: 100 }, { x: 100, y: 300 }, 'bezier', 'bottom', 'top');
      expect(pathBottomToTop).toContain('M 100 100');
      expect(pathBottomToTop).toContain('100 300');
    });

    it('renders a complete, self-contained SVG diagram with styling, nodes, and labeled edges', () => {
      const project: Project = createProject('developer', {
        title: 'Production Architecture',
        metadata: {
          description: 'Microservices diagram',
          tags: [],
          createdAt: '2026-10-22T00:00:00.000Z',
          updatedAt: '2026-10-22T00:00:00.000Z',
          completedStudyMinutes: 0,
          completedStudySessions: 0,
        },
      });

      const nodeA = createNode('developer', {
        title: 'API Gateway',
        description: 'Reverse proxy & auth token verification',
        position: { x: 100, y: 150 },
        colorToken: 'blue',
        category: 'Gateway',
      });

      const nodeB = createNode('developer', {
        title: 'Auth Service',
        description: 'Issues JWTs & validates sessions',
        position: { x: 500, y: 150 },
        colorToken: 'purple',
        category: 'Security',
      });

      const edge = createEdge({
        sourceNodeId: nodeA.id,
        targetNodeId: nodeB.id,
        sourcePort: 'right',
        targetPort: 'left',
        label: 'validates JWT',
      });

      const populatedProject: Project = {
        ...project,
        nodes: [nodeA, nodeB],
        edges: [edge],
      };

      const svg = exportSvgDiagram(populatedProject);

      // Verify SVG root tag and attributes
      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('viewBox=');
      expect(svg).toContain('Production Architecture');
      expect(svg).toContain('class="diagram-bg"');

      // Verify node rendering
      expect(svg).toContain('API Gateway');
      expect(svg).toContain('SERVICE • TypeScript (planned)');
      expect(svg).toContain('Auth Service');

      // Verify connection and label rendering
      expect(svg).toContain('<path d="M');
      expect(svg).toContain('validates JWT');
    });

    it('renders an informative placeholder in SVG when project has no nodes', () => {
      const emptyProject = createProject('developer', { title: 'Empty Diagram' });
      const svg = exportSvgDiagram(emptyProject);

      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('Empty Project Canvas');
    });
  });

  describe('PNG Raster Exporter (exportPngDiagram.ts)', () => {
    it('rasterizes SVG into a PNG blob using offscreen HTML5 canvas', async () => {
      const project = createProject('developer', { title: 'Raster Test' });

      // Mock URL methods
      const origCreateObjectUrl = globalThis.URL.createObjectURL;
      const origRevokeObjectUrl = globalThis.URL.revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      globalThis.URL.revokeObjectURL = vi.fn();

      // Mock HTMLCanvasElement in test environment
      const mockCanvas = document.createElement('canvas');
      const mockCtx = {
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: '',
        imageSmoothingEnabled: false,
        imageSmoothingQuality: '',
      };
      vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
      vi.spyOn(mockCanvas, 'toBlob').mockImplementation((callback) => {
        const dummyBlob = new Blob(['mock-png-data'], { type: 'image/png' });
        callback(dummyBlob);
      });
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') return mockCanvas;
        return document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
      });

      // Mock Image loading
      const originalImage = window.Image;
      class MockImage {
        width = 0;
        height = 0;
        src = '';
        crossOrigin = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor() {
          setTimeout(() => {
            this.width = 1200;
            this.height = 800;
            if (this.onload) this.onload();
          }, 10);
        }
      }
      // @ts-expect-error Mocking window.Image
      window.Image = MockImage;

      try {
        const blob = await exportPngDiagramBlob(project, { scale: 2 });
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('image/png');
        expect(mockCtx.drawImage).toHaveBeenCalled();
      } finally {
        window.Image = originalImage;
        globalThis.URL.createObjectURL = origCreateObjectUrl;
        globalThis.URL.revokeObjectURL = origRevokeObjectUrl;
        vi.restoreAllMocks();
      }
    });
  });

  describe('Markdown Storyboard Generator (exportMarkdownStoryboard.ts)', () => {
    it('formats seconds into MM:SS timecodes accurately', () => {
      expect(formatSecondsToTimecode(0)).toBe('00:00');
      expect(formatSecondsToTimecode(59)).toBe('00:59');
      expect(formatSecondsToTimecode(60)).toBe('01:00');
      expect(formatSecondsToTimecode(125)).toBe('02:05');
      expect(formatSecondsToTimecode(3605)).toBe('01:00:05');
    });

    it('generates a formatted Markdown storyboard with scenes, dialogue, and shot lists', () => {
      const project = createProject('video', {
        title: 'Cinematic Teaser',
        metadata: {
          description: 'Product launch trailer',
          tags: [],
          createdAt: '2026-10-22T00:00:00.000Z',
          updatedAt: '2026-10-22T00:00:00.000Z',
          completedStudyMinutes: 0,
          completedStudySessions: 0,
        },
      });

      const sceneNode: CanvasNode = {
        ...createNode('video', {
          title: 'Introduction Hook',
          description: 'Dark room illuminated by terminal glow',
          position: { x: 50, y: 100 },
        }),
        payload: {
          kind: 'video-scene',
          sceneNumber: 1,
          durationSeconds: 15,
          framing: 'close-up',
          productionStatus: 'scripted',
          scriptText: 'Everything changed when MindRail arrived.',
          voiceOverNotes: 'Subtle bass drone rising in pitch',
          typographyNotes: 'Title reveal',
          transitionAndSfxNotes: 'Mechanical clicks',
          checklist: [],
        },
      };

      const populatedProject: Project = {
        ...project,
        nodes: [sceneNode],
        checklist: [
          { id: 'c1', text: 'Calibrate anamorphic lens', completed: true },
          { id: 'c2', text: 'Record Foley audio', completed: false },
        ],
      };

      const md = exportMarkdownStoryboard(populatedProject);

      // Verify title & frontmatter/summary
      expect(md).toContain('# Cinematic Teaser');
      expect(md).toContain('> **Planned Total Runtime:** 00:15 (15s)');
      expect(md).toContain('> **Summary:** 1 Scenes');

      // Verify scene content
      expect(md).toContain('## Storyboard Scenes');
      expect(md).toContain('### Scene 1: Introduction Hook');
      expect(md).toContain('- **Planned Duration:** `00:15` (15s)');
      expect(md).toContain('- **Framing / Camera Angle:** close-up');
      expect(md).toContain('#### Spoken Dialogue');
      expect(md).toContain('> Everything changed when MindRail arrived.');
      expect(md).toContain('**Voice-Over Cue:** Subtle bass drone rising in pitch');

      // Verify production checklist
      expect(md).toContain('## Production Checklist');
      expect(md).toContain('- [x] Calibrate anamorphic lens');
      expect(md).toContain('- [ ] Record Foley audio');
    });

    it('generates a formatted Markdown study guide for Student projects', () => {
      const project = createProject('student', {
        title: 'Distributed Systems 101',
        metadata: {
          description: 'Exam preparation guide',
          tags: [],
          createdAt: '2026-10-22T00:00:00.000Z',
          updatedAt: '2026-10-22T00:00:00.000Z',
          completedStudyMinutes: 0,
          completedStudySessions: 0,
        },
      });

      const conceptNode: CanvasNode = {
        ...createNode('student', {
          title: 'CAP Theorem',
          description: 'Consistency, Availability, Partition tolerance trade-off',
          position: { x: 100, y: 100 },
        }),
        payload: {
          kind: 'student-concept',
          isRootTopic: true,
          mastery: 'mastered',
          keyTerms: ['CAP', 'Distributed'],
          summaryNotes: 'Consistency, Availability, Partition tolerance trade-off',
        },
      };

      const flashcardNode: CanvasNode = {
        ...createNode('student', {
          title: 'PACELC Definition',
          position: { x: 450, y: 100 },
        }),
        payload: {
          kind: 'student-flashcard',
          frontPrompt: 'What does the E and L in PACELC stand for?',
          backAnswer: 'Else: Latency versus Consistency',
          hint: 'Think of trade-offs when no network partition occurs',
          lastConfidence: 'good',
          reviewCount: 3,
        },
      };

      const populatedProject: Project = {
        ...project,
        nodes: [conceptNode, flashcardNode],
      };

      const md = exportMarkdownStudyGuide(populatedProject);

      expect(md).toContain('# Distributed Systems 101 — Study Guide');
      expect(md).toContain('> **Mastery:** 100% (1/1 Mastered)');
      expect(md).toContain('## Core Concepts & Definitions');
      expect(md).toContain('### ⭐ CAP Theorem');
      expect(md).toContain('- **Mastery Status:** `MASTERED`');
      expect(md).toContain('Consistency, Availability, Partition tolerance trade-off');
      expect(md).toContain('## Flashcard Practice Questions');
      expect(md).toContain('### Card 1: PACELC Definition');
      expect(md).toContain('**Prompt / Question:**');
      expect(md).toContain('> What does the E and L in PACELC stand for?');
      expect(md).toContain('*Hint: Think of trade-offs when no network partition occurs*');
      expect(md).toContain('**Answer:**');
      expect(md).toContain('> Else: Latency versus Consistency');
      expect(md).toContain('*(Reviewed: 3x • Last Confidence: `good`)*');
    });
  });
});
