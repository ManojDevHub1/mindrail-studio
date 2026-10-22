import { describe, expect, it } from 'vitest';
import { createEdge, createNode, createProject } from '../../domain/factories';
import {
  clearAllData,
  deleteProject,
  getProject,
  listProjects,
  saveProject,
} from '../../persistence/projectRepository';
import {
  serializeProjectToEnvelopeJson,
} from '../../import-export/exportProjectJson';
import { validateProjectImport } from '../../import-export/validateProjectImport';
import { projectReducer, type ProjectEditorState } from '../../state/projectReducer';

describe('End-to-End User Journey Verification (AT-01 & AT-04)', () => {
  it('executes full workflow: create, edit nodes, connect, persist locally, refresh, export, delete, and re-import', async () => {
    await clearAllData();

    // 1. User starts a new Developer project
    const initialProject = createProject('developer', {
      title: 'Order Processing System',
    });
    await saveProject(initialProject);

    const loaded = await getProject(initialProject.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.title).toBe('Order Processing System');
    expect(loaded?.nodes).toHaveLength(0);

    // 2. User adds two nodes on the canvas
    const nodeGateway = createNode('developer', {
      title: 'API Gateway',
      category: 'Ingress',
      colorToken: 'blue',
      position: { x: 160, y: 160 },
      payload: {
        kind: 'dev-architecture',
        componentKind: 'boundary',
        techStack: 'Envoy',
        environment: 'production',
        status: 'healthy',
      },
    });

    const nodeService = createNode('developer', {
      title: 'Orders Service',
      category: 'Service',
      colorToken: 'purple',
      position: { x: 540, y: 160 },
      payload: {
        kind: 'dev-architecture',
        componentKind: 'service',
        techStack: 'Node.js / TypeScript',
        environment: 'production',
        status: 'healthy',
      },
    });

    let editorState: ProjectEditorState = {
      project: loaded!,
      undoStack: [],
      redoStack: [],
      revision: 0,
    };

    editorState = projectReducer(editorState, { type: 'ADD_NODE', node: nodeGateway });
    editorState = projectReducer(editorState, { type: 'ADD_NODE', node: nodeService });
    expect(editorState.project.nodes).toHaveLength(2);

    // 3. User connects Node Gateway to Node Service
    const edge = createEdge({
      sourceNodeId: nodeGateway.id,
      targetNodeId: nodeService.id,
      sourcePort: 'right',
      targetPort: 'left',
      label: 'Proxy Order Requests',
    });
    editorState = projectReducer(editorState, { type: 'ADD_EDGE', edge });
    expect(editorState.project.edges).toHaveLength(1);

    // 4. User moves Node Service by 16px grid step
    editorState = projectReducer(editorState, {
      type: 'MOVE_NODES_COMMIT',
      moves: [{ nodeId: nodeService.id, position: { x: 576, y: 192 } }],
    });
    expect(editorState.project.nodes[1]?.position).toEqual({ x: 576, y: 192 });

    // 5. User updates Node Gateway properties in inspector
    editorState = projectReducer(editorState, {
      type: 'UPDATE_NODE',
      nodeId: nodeGateway.id,
      updates: {
        title: 'Edge Ingress Gateway',
        description: 'Terminates TLS and enforces rate limits',
        colorToken: 'cyan',
      },
    });
    expect(editorState.project.nodes[0]?.title).toBe('Edge Ingress Gateway');
    expect(editorState.project.nodes[0]?.colorToken).toBe('cyan');

    // 6. Autosave persists project to IndexedDB
    await saveProject(editorState.project);

    // 7. Simulating browser refresh: fetch fresh from IndexedDB
    const refreshedProject = await getProject(initialProject.id);
    expect(refreshedProject).not.toBeNull();
    expect(refreshedProject?.title).toBe('Order Processing System');
    expect(refreshedProject?.nodes).toHaveLength(2);
    expect(refreshedProject?.edges).toHaveLength(1);
    expect(refreshedProject?.nodes[0]?.title).toBe('Edge Ingress Gateway');
    expect(refreshedProject?.nodes[0]?.colorToken).toBe('cyan');
    expect(refreshedProject?.nodes[1]?.position).toEqual({ x: 576, y: 192 });
    expect(refreshedProject?.edges[0]?.label).toBe('Proxy Order Requests');

    // 8. User exports project to .mindrail.json
    const exportedJsonString = serializeProjectToEnvelopeJson(refreshedProject!);
    expect(exportedJsonString).toContain('mindrail-project');
    expect(exportedJsonString).toContain('Edge Ingress Gateway');

    // 9. User deletes project from IndexedDB
    await deleteProject(initialProject.id);
    const afterDelete = await getProject(initialProject.id);
    expect(afterDelete).toBeNull();
    const remainingProjects = await listProjects();
    expect(remainingProjects).toHaveLength(0);

    // 10. User imports the downloaded .mindrail.json file
    const importResult = validateProjectImport(exportedJsonString);
    expect(importResult.success).toBe(true);
    if (!importResult.success) return;

    // Save imported project
    await saveProject(importResult.project);

    // 11. Verify restored project
    const reloaded = await getProject(initialProject.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.title).toBe('Order Processing System');
    expect(reloaded?.nodes).toHaveLength(2);
    expect(reloaded?.edges).toHaveLength(1);
    expect(reloaded?.nodes[0]?.title).toBe('Edge Ingress Gateway');
    expect(reloaded?.nodes[1]?.position).toEqual({ x: 576, y: 192 });
    expect(reloaded?.edges[0]?.sourceNodeId).toBe(nodeGateway.id);
    expect(reloaded?.edges[0]?.targetNodeId).toBe(nodeService.id);
  });
});
