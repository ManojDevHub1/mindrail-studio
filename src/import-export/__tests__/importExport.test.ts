import { describe, expect, it } from 'vitest';
import { createChecklistItem, createEdge, createNode, createProject } from '../../domain/factories';
import { generateExportFilename, serializeProjectToEnvelopeJson } from '../exportProjectJson';
import { validateBackupArchive, validateProjectImport } from '../validateProjectImport';

describe('Import and Export Specification', () => {
  it('generates a slugified date-stamped filename', () => {
    const project = createProject('developer', { title: 'Order Processing Architecture' });
    const fixedDate = new Date('2026-10-22T06:00:00.000Z');
    const filename = generateExportFilename(project, fixedDate);
    expect(filename).toBe('order-processing-architecture-2026-10-22.mindrail.json');
  });

  it('rejects files larger than 10 MB', () => {
    const hugeText = ' '.repeat(10 * 1024 * 1024 + 10);
    const result = validateProjectImport(hugeText);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('ERR_FILE_TOO_LARGE');
    }
  });

  it('blocks prototype pollution payloads safely', () => {
    const maliciousJson = '{"format":"mindrail-project","schemaVersion":1,"__proto__":{"polluted":true}}';
    const result = validateProjectImport(maliciousJson);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('ERR_PROTOTYPE_POLLUTION');
    }
    expect((Object.prototype as Record<string, unknown>)['polluted']).toBeUndefined();
  });

  it('rejects unsupported future schema versions', () => {
    const futureJson = JSON.stringify({
      format: 'mindrail-project',
      schemaVersion: 99,
      project: { schemaVersion: 99 },
    });
    const result = validateProjectImport(futureJson);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('ERR_UNSUPPORTED_SCHEMA_VERSION');
    }
  });

  it('detects dangling edges and supports recovery via stripping', () => {
    const node = createNode('developer');
    const danglingEdge = createEdge({ sourceNodeId: node.id, targetNodeId: 'non-existent' });
    const project = createProject('developer', {
      nodes: [node],
      edges: [danglingEdge],
    });

    const json = serializeProjectToEnvelopeJson(project);

    // Strict validation without stripping fails
    const strictResult = validateProjectImport(json);
    expect(strictResult.success).toBe(false);
    if (!strictResult.success) {
      expect(strictResult.code).toBe('ERR_DANGLING_EDGE_REFERENCE');
      expect(strictResult.recoverableWithEdgeStripping).toBe(true);
    }

    // Validation with stripBrokenEdges recovers
    const recoveredResult = validateProjectImport(json, { stripBrokenEdges: true });
    expect(recoveredResult.success).toBe(true);
    if (recoveredResult.success) {
      expect(recoveredResult.danglingEdgesRemoved).toBe(1);
      expect(recoveredResult.project.edges).toHaveLength(0);
      expect(recoveredResult.project.nodes).toHaveLength(1);
    }
  });

  it('performs lossless round-trip serialization across Developer, Video, and Student projects', () => {
    // 1. Developer Project with architecture & code snippet
    const devNode1 = createNode('developer', {
      title: 'Auth Service',
      description: 'Handles JWT tokens',
      colorToken: 'blue',
      category: 'Security',
      payload: {
        kind: 'dev-architecture',
        componentKind: 'service',
        techStack: 'Fastify / TS',
        environment: 'production',
        status: 'healthy',
      },
    });

    const devNode2 = createNode('developer', {
      title: 'Database Snippet',
      description: 'Connection pool helper',
      colorToken: 'cyan',
      payload: {
        kind: 'dev-code-snippet',
        language: 'typescript',
        code: 'const pool = new Pool();',
      },
    });

    const edge = createEdge({
      sourceNodeId: devNode1.id,
      targetNodeId: devNode2.id,
      label: 'Executes Query',
      routingStyle: 'orthogonal',
    });

    const devProject = createProject('developer', {
      title: 'Developer Cloud Stack',
      nodes: [devNode1, devNode2],
      edges: [edge],
      checklist: [createChecklistItem('Review security group')],
    });

    const serialized = serializeProjectToEnvelopeJson(devProject);
    const roundTripResult = validateProjectImport(serialized);

    expect(roundTripResult.success).toBe(true);
    if (roundTripResult.success) {
      const p = roundTripResult.project;
      expect(p.id).toBe(devProject.id);
      expect(p.title).toBe(devProject.title);
      expect(p.workspaceType).toBe('developer');
      expect(p.nodes).toHaveLength(2);
      expect(p.edges).toHaveLength(1);
      expect(p.checklist).toHaveLength(1);
      expect(p.nodes[0]?.payload.kind).toBe('dev-architecture');
      expect(p.nodes[1]?.payload.kind).toBe('dev-code-snippet');
    }

    // 2. Video Storyboard Project
    const videoNode = createNode('video', {
      title: 'Scene 1: Intro Hook',
      payload: {
        kind: 'video-scene',
        sceneNumber: 1,
        durationSeconds: 45,
        framing: 'close-up',
        scriptText: 'Welcome back to the channel.',
        voiceOverNotes: 'Energetic delivery',
        typographyNotes: 'Pop-in logo',
        transitionAndSfxNotes: 'Whoosh SFX',
        productionStatus: 'filmed',
        checklist: [],
      },
    });

    const videoProject = createProject('video', {
      title: 'YouTube Episode 42',
      nodes: [videoNode],
      edges: [],
    });

    const videoSerialized = serializeProjectToEnvelopeJson(videoProject);
    const videoResult = validateProjectImport(videoSerialized);
    expect(videoResult.success).toBe(true);
    if (videoResult.success) {
      expect(videoResult.project.workspaceType).toBe('video');
      expect(videoResult.project.nodes[0]?.payload.kind).toBe('video-scene');
    }

    // 3. Student Mind Map Project
    const studentConcept = createNode('student', {
      title: 'Computer Science: Concurrency',
      payload: {
        kind: 'student-concept',
        isRootTopic: true,
        mastery: 'learning',
        summaryNotes: 'Threads, locks, race conditions',
        keyTerms: ['Deadlock', 'Mutex'],
      },
    });

    const flashcard = createNode('student', {
      title: 'Mutex vs Semaphore',
      payload: {
        kind: 'student-flashcard',
        frontPrompt: 'What is the main difference between a mutex and a semaphore?',
        backAnswer: 'A mutex is a locking mechanism; a semaphore is a signaling mechanism.',
        lastConfidence: 'good',
        reviewCount: 4,
      },
    });

    const studentProject = createProject('student', {
      title: 'Operating Systems Revision',
      nodes: [studentConcept, flashcard],
      edges: [],
    });

    const studentSerialized = serializeProjectToEnvelopeJson(studentProject);
    const studentResult = validateProjectImport(studentSerialized);
    expect(studentResult.success).toBe(true);
    if (studentResult.success) {
      expect(studentResult.project.workspaceType).toBe('student');
      expect(studentResult.project.nodes).toHaveLength(2);
    }
  });

  it('detects a multi-project backup archive and provides actionable guidance', () => {
    const archiveJson = JSON.stringify({
      format: 'mindrail-backup-archive',
      exportedAt: new Date().toISOString(),
      projectCount: 2,
      projects: [],
    });

    const result = validateProjectImport(archiveJson);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('ERR_INVALID_ENVELOPE');
      expect(result.message).toContain('Settings > Restore Backup Archive');
    }
  });

  it('validates and restores multi-project backup archive payloads via validateBackupArchive', () => {
    const p1 = createProject('developer', { title: 'Backend Cloud Services' });
    const p2 = createProject('video', { title: 'Product Launch Video' });
    const p3 = createProject('freelance', { title: 'Client Brand Identity' });

    const archivePayload = {
      format: 'mindrail-backup-archive',
      exportedAt: new Date().toISOString(),
      projectCount: 3,
      projects: [
        JSON.parse(serializeProjectToEnvelopeJson(p1)),
        JSON.parse(serializeProjectToEnvelopeJson(p2)),
        JSON.parse(serializeProjectToEnvelopeJson(p3)),
      ],
    };

    const archiveJson = JSON.stringify(archivePayload);
    const validation = validateBackupArchive(archiveJson);

    expect(validation.success).toBe(true);
    expect(validation.projectCount).toBe(3);
    expect(validation.projects).toHaveLength(3);
    expect(validation.projects[0]?.title).toBe('Backend Cloud Services');
    expect(validation.projects[1]?.workspaceType).toBe('video');
    expect(validation.projects[2]?.workspaceType).toBe('freelance');
  });
});
