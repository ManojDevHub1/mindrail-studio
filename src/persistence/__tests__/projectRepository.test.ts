import { beforeEach, describe, expect, it } from 'vitest';
import { createNode, createProject } from '../../domain/factories';
import {
  clearAllData,
  deleteCustomTemplate,
  deleteProject,
  getProject,
  listCustomTemplates,
  listProjects,
  saveCustomTemplate,
  saveProject,
} from '../projectRepository';
import { DEFAULT_PROJECT_SETTINGS } from '../../domain/factories';

describe('Project Repository (IndexedDB)', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('saves and retrieves a project cleanly', async () => {
    const project = createProject('developer', {
      title: 'Payment Gateway',
      nodes: [createNode('developer', { title: 'Auth Service' })],
    });

    await saveProject(project);

    const loaded = await getProject(project.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(project.id);
    expect(loaded?.title).toBe('Payment Gateway');
    expect(loaded?.nodes).toHaveLength(1);
    expect(loaded?.nodes[0]?.title).toBe('Auth Service');
  });

  it('lists projects sorted by updatedAt descending and supports filtering', async () => {
    const p1 = createProject('developer', {
      title: 'Dev Project',
      metadata: {
        description: '',
        tags: [],
        createdAt: '2026-10-22T01:00:00.000Z',
        updatedAt: '2026-10-22T01:00:00.000Z',
        completedStudyMinutes: 0,
        completedStudySessions: 0,
      },
    });

    const p2 = createProject('video', {
      title: 'Video Project',
      metadata: {
        description: '',
        tags: [],
        createdAt: '2026-10-22T02:00:00.000Z',
        updatedAt: '2026-10-22T02:00:00.000Z',
        completedStudyMinutes: 0,
        completedStudySessions: 0,
      },
    });

    await saveProject(p1);
    await saveProject(p2);

    const all = await listProjects();
    expect(all).toHaveLength(2);
    expect(all[0]?.id).toBe(p2.id); // Newer first

    const videoOnly = await listProjects('video');
    expect(videoOnly).toHaveLength(1);
    expect(videoOnly[0]?.id).toBe(p2.id);

    const devOnly = await listProjects('developer');
    expect(devOnly).toHaveLength(1);
    expect(devOnly[0]?.id).toBe(p1.id);
  });

  it('deletes a project cleanly', async () => {
    const project = createProject('student');
    await saveProject(project);

    let loaded = await getProject(project.id);
    expect(loaded).not.toBeNull();

    await deleteProject(project.id);
    loaded = await getProject(project.id);
    expect(loaded).toBeNull();
  });

  it('handles custom templates', async () => {
    const template = {
      id: 'template-1',
      schemaVersion: 1,
      name: 'Custom Dev Template',
      summary: 'For microservices',
      workspaceType: 'developer' as const,
      isBuiltIn: false,
      createdAt: '2026-10-22T00:00:00.000Z',
      defaultSettings: DEFAULT_PROJECT_SETTINGS,
      nodes: [createNode('developer')],
      edges: [],
      checklist: [],
    };

    await saveCustomTemplate(template);
    const templates = await listCustomTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0]?.name).toBe('Custom Dev Template');

    await deleteCustomTemplate('template-1');
    const emptyTemplates = await listCustomTemplates();
    expect(emptyTemplates).toHaveLength(0);
  });
});
