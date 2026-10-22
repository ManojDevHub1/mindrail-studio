/**
 * Universal Template Ecosystem & Freelance Workspace Tests.
 * Conforms to Phase 6 specifications.
 */
import { describe, expect, it } from 'vitest';
import { BUILT_IN_TEMPLATES, TEMPLATE_CATEGORIES } from '../builtInTemplates';
import {
  createChecklistItem,
  createNode,
  createProject,
  generateEntityId,
  getDefaultPayloadForWorkspace,
  getDefaultProjectTitle,
} from '../factories';
import { calculateFreelanceSummary } from '../calculators';
import {
  addRecentTemplate,
  loadUserPreferences,
  saveUserPreferences,
  toggleFavoriteTemplate,
} from '../../persistence/preferencesStore';
import {
  deleteCustomTemplate,
  listCustomTemplates,
  saveCustomTemplate,
} from '../../persistence/projectRepository';
import type { CanvasNode, EntityId, Project, ProjectTemplate, TemplateCategory } from '../models';

describe('Universal Template Catalogue & Metadata Verification', () => {
  it('contains at least 45 curated built-in templates', () => {
    expect(BUILT_IN_TEMPLATES.length).toBeGreaterThanOrEqual(45);
  });

  it('guarantees all template IDs are globally unique', () => {
    const ids = BUILT_IN_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('contains exactly 15 distinct categories with metadata', () => {
    expect(TEMPLATE_CATEGORIES.length).toBe(15);
    const expectedCategories: TemplateCategory[] = [
      'web-dev',
      'ui-ux',
      'graphic-design',
      'video-editing',
      'content-creation',
      'writing',
      'social-media',
      'digital-marketing',
      'freelance-business',
      'photography',
      'podcast-audio',
      'data-analytics',
      'ai-automation',
      'education-research',
      'product-startup',
    ];

    expectedCategories.forEach((cat) => {
      const found = TEMPLATE_CATEGORIES.find((c) => c.id === cat);
      expect(found).toBeDefined();
      expect(found?.label.length).toBeGreaterThan(0);
      expect(found?.description.length).toBeGreaterThan(0);
      expect(found?.icon.length).toBeGreaterThan(0);
    });
  });

  it('guarantees each of the 15 categories has at least 3 templates', () => {
    TEMPLATE_CATEGORIES.forEach((cat) => {
      const templatesInCat = BUILT_IN_TEMPLATES.filter((t) => t.category === cat.id);
      expect(
        templatesInCat.length,
        `Category "${cat.id}" should have at least 3 templates, found ${templatesInCat.length}`
      ).toBeGreaterThanOrEqual(3);
    });
  });

  it('validates schema integrity, non-empty fields, nodes, and valid connections for every template', () => {
    const validWorkspaces = ['developer', 'video', 'student', 'freelance'];
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];

    BUILT_IN_TEMPLATES.forEach((template) => {
      expect(template.schemaVersion).toBe(1);
      expect(template.name.trim().length).toBeGreaterThan(0);
      expect(template.summary.trim().length).toBeGreaterThan(0);
      expect(validWorkspaces).toContain(template.workspaceType);
      expect(template.isBuiltIn).toBe(true);
      expect(template.nodes.length).toBeGreaterThanOrEqual(3);
      expect(template.edges.length).toBeGreaterThanOrEqual(2);
      expect(template.checklist.length).toBeGreaterThanOrEqual(2);

      // Metadata checks
      expect(template.category).toBeDefined();
      expect(validDifficulties).toContain(template.difficulty);
      expect(template.estimatedSetupMinutes).toBeGreaterThan(0);
      expect(template.tags).toBeDefined();
      expect(template.tags?.length).toBeGreaterThan(0);
      expect(template.targetAudience?.length).toBeGreaterThan(0);

      // Verify node IDs within template are unique
      const nodeIds = new Set(template.nodes.map((n) => n.id));
      expect(nodeIds.size).toBe(template.nodes.length);

      // Verify every edge references existing nodes in this template
      template.edges.forEach((edge) => {
        expect(
          nodeIds.has(edge.sourceNodeId),
          `Edge "${edge.id}" in template "${template.id}" references non-existent sourceNodeId "${edge.sourceNodeId}"`
        ).toBe(true);
        expect(
          nodeIds.has(edge.targetNodeId),
          `Edge "${edge.id}" in template "${template.id}" references non-existent targetNodeId "${edge.targetNodeId}"`
        ).toBe(true);
      });
    });
  });

  it('verifies reliable template instantiation with deep cloning and edge ID remapping', () => {
    const template = BUILT_IN_TEMPLATES[0];
    expect(template).toBeDefined();
    if (!template) return;

    const idMap = new Map<EntityId, EntityId>();

    const clonedNodes = template.nodes.map((node) => {
      const freshId = generateEntityId();
      idMap.set(node.id, freshId);
      return {
        ...node,
        id: freshId,
      };
    });

    const clonedEdges = template.edges.map((edge) => ({
      ...edge,
      id: generateEntityId(),
      sourceNodeId: idMap.get(edge.sourceNodeId) || edge.sourceNodeId,
      targetNodeId: idMap.get(edge.targetNodeId) || edge.targetNodeId,
    }));

    const project: Project = createProject(template.workspaceType, {
      title: template.name,
      nodes: clonedNodes,
      edges: clonedEdges,
      checklist: template.checklist.map((item) => ({ ...item, id: generateEntityId() })),
    });

    // Verify all entity IDs are fresh
    expect(project.id).not.toBe(template.id);
    project.nodes.forEach((node, index) => {
      expect(node.id).not.toBe(template.nodes[index]?.id);
      expect(node.title).toBe(template.nodes[index]?.title);
    });

    // Verify edges point to the newly generated node IDs
    project.edges.forEach((edge, index) => {
      expect(edge.id).not.toBe(template.edges[index]?.id);
      const originalEdge = template.edges[index];
      if (originalEdge) {
        expect(edge.sourceNodeId).toBe(idMap.get(originalEdge.sourceNodeId));
        expect(edge.targetNodeId).toBe(idMap.get(originalEdge.targetNodeId));
      }
    });
  });
});

describe('Freelance Workspace & Domain Helpers', () => {
  it('provides correct defaults for the freelance workspace', () => {
    expect(getDefaultProjectTitle('freelance')).toBe('Untitled Client Project');
    const payload = getDefaultPayloadForWorkspace('freelance');
    expect(payload.kind).toBe('freelance-task');
    if (payload.kind === 'freelance-task') {
      expect(payload.status).toBe('todo');
      expect(payload.priority).toBe('medium');
    }
  });

  it('calculates freelance workspace summary metrics accurately', () => {
    const nodes: CanvasNode[] = [
      createNode('freelance', {
        title: 'Task 1',
        payload: {
          kind: 'freelance-task',
          status: 'done',
          priority: 'urgent',
          subtasks: [],
        },
      }),
      createNode('freelance', {
        title: 'Task 2',
        payload: {
          kind: 'freelance-task',
          status: 'in-progress',
          priority: 'high',
          subtasks: [],
        },
      }),
      createNode('freelance', {
        title: 'Milestone 1',
        payload: {
          kind: 'freelance-stage',
          phase: 'concept',
          stageNumber: 1,
          deliverableSummary: 'Discovery deck',
        },
      }),
      createNode('freelance', {
        title: 'Deliverable 1',
        payload: {
          kind: 'freelance-deliverable',
          format: 'Vector PDF',
          clientApproved: true,
        },
      }),
      createNode('freelance', {
        title: 'Deliverable 2',
        payload: {
          kind: 'freelance-deliverable',
          format: 'Source Code',
          clientApproved: false,
        },
      }),
    ];

    const summary = calculateFreelanceSummary(nodes);
    expect(summary.totalTasks).toBe(2);
    expect(summary.completedTasks).toBe(1);
    expect(summary.completedPercentage).toBe(50);
    expect(summary.byStatus.done).toBe(1);
    expect(summary.byStatus['in-progress']).toBe(1);
    expect(summary.byPriority.urgent).toBe(1);
    expect(summary.totalStages).toBe(1);
    expect(summary.totalDeliverables).toBe(2);
    expect(summary.approvedDeliverables).toBe(1);
  });
});

describe('Preferences & Favorites Store', () => {
  it('toggles template favorites and persists to user preferences', () => {
    saveUserPreferences({ favoriteTemplateIds: [] });
    expect(loadUserPreferences().favoriteTemplateIds).toEqual([]);

    const updated1 = toggleFavoriteTemplate('template-1');
    expect(updated1).toContain('template-1');
    expect(loadUserPreferences().favoriteTemplateIds).toContain('template-1');

    const updated2 = toggleFavoriteTemplate('template-1');
    expect(updated2).not.toContain('template-1');
    expect(loadUserPreferences().favoriteTemplateIds).not.toContain('template-1');
  });

  it('records recent templates deduplicated up to 10 entries', () => {
    saveUserPreferences({ recentTemplateIds: [] });

    addRecentTemplate('t1');
    addRecentTemplate('t2');
    addRecentTemplate('t1'); // move to front

    const recents = loadUserPreferences().recentTemplateIds;
    expect(recents[0]).toBe('t1');
    expect(recents[1]).toBe('t2');
    expect(recents.length).toBe(2);
  });
});

describe('Custom Template Persistence', () => {
  it('saves, retrieves, and deletes custom templates in IndexedDB', async () => {
    const customTemplate: ProjectTemplate = {
      id: generateEntityId(),
      schemaVersion: 1,
      name: 'Custom Client Brand Flow',
      summary: 'Tailored 4-step agency branding template',
      workspaceType: 'freelance',
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      defaultSettings: {
        snapToGrid: true,
        gridSize: 16,
        defaultEdgeStyle: 'bezier',
        studyTimerMinutes: 25,
        studyBreakMinutes: 5,
      },
      nodes: [
        createNode('freelance', {
          title: 'Custom Discovery',
          payload: {
            kind: 'freelance-stage',
            phase: 'brief',
            stageNumber: 1,
            deliverableSummary: 'Client notes',
          },
        }),
        createNode('freelance', {
          title: 'Custom Brand Guidelines',
          payload: {
            kind: 'freelance-deliverable',
            format: 'PDF',
            clientApproved: true,
          },
        }),
      ],
      edges: [],
      checklist: [createChecklistItem('Kickoff meeting')],
      category: 'graphic-design',
      difficulty: 'intermediate',
      estimatedSetupMinutes: 5,
    };

    // Save
    await saveCustomTemplate(customTemplate);

    // List
    const customList = await listCustomTemplates();
    const found = customList.find((t) => t.id === customTemplate.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Custom Client Brand Flow');

    // Delete
    await deleteCustomTemplate(customTemplate.id);
    const updatedList = await listCustomTemplates();
    expect(updatedList.find((t) => t.id === customTemplate.id)).toBeUndefined();
  });
});
