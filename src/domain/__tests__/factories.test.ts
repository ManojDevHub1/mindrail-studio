import { describe, expect, it } from 'vitest';
import {
  createChecklistItem,
  createEdge,
  createNode,
  createProject,
  generateEntityId,
} from '../factories';
import { CURRENT_SCHEMA_VERSION } from '../models';

describe('Domain Factories', () => {
  it('generates unique entity IDs', () => {
    const id1 = generateEntityId();
    const id2 = generateEntityId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('creates a project with canonical default values', () => {
    const project = createProject('developer');
    expect(project.id).toBeTruthy();
    expect(project.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(project.title).toBe('Untitled Architecture Project');
    expect(project.workspaceType).toBe('developer');
    expect(project.settings.snapToGrid).toBe(true);
    expect(project.settings.gridSize).toBe(16);
    expect(project.viewport.zoom).toBe(1.0);
    expect(project.nodes).toHaveLength(0);
    expect(project.edges).toHaveLength(0);
  });

  it('creates valid nodes with default dimensions and correct workspace payload', () => {
    const devNode = createNode('developer', { title: 'Backend Service' });
    expect(devNode.id).toBeTruthy();
    expect(devNode.title).toBe('Backend Service');
    expect(devNode.dimensions.width).toBe(280);
    expect(devNode.dimensions.height).toBe(160);
    expect(devNode.payload.kind).toBe('dev-architecture');

    const videoNode = createNode('video');
    expect(videoNode.payload.kind).toBe('video-scene');

    const studentNode = createNode('student');
    expect(studentNode.payload.kind).toBe('student-concept');
  });

  it('creates an edge connecting two nodes', () => {
    const n1 = generateEntityId();
    const n2 = generateEntityId();
    const edge = createEdge({
      sourceNodeId: n1,
      targetNodeId: n2,
      sourcePort: 'right',
      targetPort: 'left',
      label: 'Request',
    });
    expect(edge.sourceNodeId).toBe(n1);
    expect(edge.targetNodeId).toBe(n2);
    expect(edge.label).toBe('Request');
    expect(edge.routingStyle).toBe('bezier');
    expect(edge.directed).toBe(true);
  });

  it('creates a checklist item with defaults', () => {
    const item = createChecklistItem('Complete unit test', 'QA');
    expect(item.id).toBeTruthy();
    expect(item.text).toBe('Complete unit test');
    expect(item.completed).toBe(false);
    expect(item.category).toBe('QA');
  });
});
