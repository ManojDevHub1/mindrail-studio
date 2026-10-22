import { describe, expect, it } from 'vitest';
import { createEdge, createNode, createProject } from '../factories';
import {
  pruneEdgesConnectedToNodes,
  sanitizeProjectEdges,
  validateProjectIntegrity,
} from '../integrity';

describe('Referential Integrity', () => {
  it('validates a clean project without issues', () => {
    const project = createProject('developer');
    const n1 = createNode('developer', { title: 'Node 1' });
    const n2 = createNode('developer', { title: 'Node 2' });
    const edge = createEdge({ sourceNodeId: n1.id, targetNodeId: n2.id });

    const fullProject = {
      ...project,
      nodes: [n1, n2],
      edges: [edge],
    };

    const result = validateProjectIntegrity(fullProject);
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('detects duplicate node and edge IDs', () => {
    const n1 = createNode('developer', { id: 'dup-node-1' });
    const n2 = createNode('developer', { id: 'dup-node-1' });
    const edge1 = createEdge({ id: 'dup-edge-1', sourceNodeId: 'dup-node-1', targetNodeId: 'other' });
    const edge2 = createEdge({ id: 'dup-edge-1', sourceNodeId: 'dup-node-1', targetNodeId: 'other' });

    const project = createProject('developer', {
      nodes: [n1, n2],
      edges: [edge1, edge2],
    });

    const result = validateProjectIntegrity(project);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'DUPLICATE_NODE_ID')).toBe(true);
    expect(result.issues.some((i) => i.code === 'DUPLICATE_EDGE_ID')).toBe(true);
  });

  it('detects self-loop edges', () => {
    const n1 = createNode('developer');
    const selfEdge = createEdge({ sourceNodeId: n1.id, targetNodeId: n1.id });

    const project = createProject('developer', {
      nodes: [n1],
      edges: [selfEdge],
    });

    const result = validateProjectIntegrity(project);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'SELF_LOOP_EDGE')).toBe(true);
  });

  it('detects duplicate edges between identical ports', () => {
    const n1 = createNode('developer');
    const n2 = createNode('developer');
    const edge1 = createEdge({ sourceNodeId: n1.id, targetNodeId: n2.id, sourcePort: 'right', targetPort: 'left' });
    const edge2 = createEdge({ sourceNodeId: n1.id, targetNodeId: n2.id, sourcePort: 'right', targetPort: 'left' });

    const project = createProject('developer', {
      nodes: [n1, n2],
      edges: [edge1, edge2],
    });

    const result = validateProjectIntegrity(project);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'DUPLICATE_EDGE')).toBe(true);
  });

  it('detects dangling edge references', () => {
    const n1 = createNode('developer');
    const danglingEdge = createEdge({ sourceNodeId: n1.id, targetNodeId: 'non-existent' });

    const project = createProject('developer', {
      nodes: [n1],
      edges: [danglingEdge],
    });

    const result = validateProjectIntegrity(project);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'DANGLING_EDGE_TARGET')).toBe(true);
  });

  it('sanitizes dangling and duplicate edges cleanly', () => {
    const n1 = createNode('developer');
    const n2 = createNode('developer');
    const validEdge = createEdge({ sourceNodeId: n1.id, targetNodeId: n2.id, sourcePort: 'right', targetPort: 'left' });
    const dupEdge = createEdge({ sourceNodeId: n1.id, targetNodeId: n2.id, sourcePort: 'right', targetPort: 'left' });
    const selfEdge = createEdge({ sourceNodeId: n1.id, targetNodeId: n1.id });
    const danglingEdge = createEdge({ sourceNodeId: n1.id, targetNodeId: 'unknown' });

    const sanitized = sanitizeProjectEdges([n1, n2], [validEdge, dupEdge, selfEdge, danglingEdge]);
    expect(sanitized).toHaveLength(1);
    expect(sanitized[0]?.id).toBe(validEdge.id);
  });

  it('prunes edges connected to deleted nodes', () => {
    const n1 = createNode('developer');
    const n2 = createNode('developer');
    const n3 = createNode('developer');
    const e1 = createEdge({ sourceNodeId: n1.id, targetNodeId: n2.id });
    const e2 = createEdge({ sourceNodeId: n2.id, targetNodeId: n3.id });

    const pruned = pruneEdgesConnectedToNodes([e1, e2], new Set([n2.id]));
    expect(pruned).toHaveLength(0);
  });
});
