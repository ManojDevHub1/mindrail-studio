import { describe, expect, it } from 'vitest';
import { createChecklistItem, createEdge, createNode, createProject } from '../../domain/factories';
import { MAX_HISTORY_DEPTH, projectReducer, type ProjectEditorState } from '../projectReducer';

describe('Project Reducer and Undo/Redo Engine', () => {
  function getInitialState(workspace = 'developer' as const): ProjectEditorState {
    const project = createProject(workspace);
    return {
      project,
      undoStack: [],
      redoStack: [],
      revision: 0,
    };
  }

  it('updates project title and records undo step', () => {
    const state = getInitialState();
    const updated = projectReducer(state, { type: 'UPDATE_TITLE', title: 'New Architecture' });

    expect(updated.project.title).toBe('New Architecture');
    expect(updated.undoStack).toHaveLength(1);
    expect(updated.undoStack[0]?.label).toBe('Rename Project');
    expect(updated.revision).toBe(1);

    // Undo
    const undone = projectReducer(updated, { type: 'UNDO' });
    expect(undone.project.title).toBe('Untitled Architecture Project');
    expect(undone.undoStack).toHaveLength(0);
    expect(undone.redoStack).toHaveLength(1);

    // Redo
    const redone = projectReducer(undone, { type: 'REDO' });
    expect(redone.project.title).toBe('New Architecture');
  });

  it('adds and updates a node cleanly', () => {
    const state = getInitialState();
    const node = createNode('developer', { title: 'Auth Service' });

    const withNode = projectReducer(state, { type: 'ADD_NODE', node });
    expect(withNode.project.nodes).toHaveLength(1);
    expect(withNode.undoStack).toHaveLength(1);

    const withUpdatedNode = projectReducer(withNode, {
      type: 'UPDATE_NODE',
      nodeId: node.id,
      updates: { title: 'Auth & Session Service', colorToken: 'blue' },
    });

    expect(withUpdatedNode.project.nodes[0]?.title).toBe('Auth & Session Service');
    expect(withUpdatedNode.project.nodes[0]?.colorToken).toBe('blue');
    expect(withUpdatedNode.undoStack).toHaveLength(2);
  });

  it('commits node move and records a single history entry', () => {
    const state = getInitialState();
    const node = createNode('developer', { position: { x: 100, y: 100 } });
    const withNode = projectReducer(state, { type: 'ADD_NODE', node });

    const moved = projectReducer(withNode, {
      type: 'MOVE_NODES_COMMIT',
      moves: [{ nodeId: node.id, position: { x: 250, y: 300 } }],
    });

    expect(moved.project.nodes[0]?.position).toEqual({ x: 250, y: 300 });
    expect(moved.undoStack).toHaveLength(2);

    const undone = projectReducer(moved, { type: 'UNDO' });
    expect(undone.project.nodes[0]?.position).toEqual({ x: 100, y: 100 });
  });

  it('deleting a node automatically prunes attached edges', () => {
    const state = getInitialState();
    const n1 = createNode('developer', { title: 'Node 1' });
    const n2 = createNode('developer', { title: 'Node 2' });
    const edge = createEdge({ sourceNodeId: n1.id, targetNodeId: n2.id });

    let s = projectReducer(state, { type: 'ADD_NODE', node: n1 });
    s = projectReducer(s, { type: 'ADD_NODE', node: n2 });
    s = projectReducer(s, { type: 'ADD_EDGE', edge });

    expect(s.project.nodes).toHaveLength(2);
    expect(s.project.edges).toHaveLength(1);

    // Delete node 1
    const afterDelete = projectReducer(s, { type: 'DELETE_NODES', nodeIds: [n1.id] });
    expect(afterDelete.project.nodes).toHaveLength(1);
    expect(afterDelete.project.edges).toHaveLength(0); // Pruned!

    // Undo delete restores both node and edge
    const undone = projectReducer(afterDelete, { type: 'UNDO' });
    expect(undone.project.nodes).toHaveLength(2);
    expect(undone.project.edges).toHaveLength(1);
  });

  it('enforces maximum history stack depth cap', () => {
    let s = getInitialState();
    for (let i = 0; i < MAX_HISTORY_DEPTH + 15; i++) {
      s = projectReducer(s, { type: 'UPDATE_TITLE', title: `Title ${i}` });
    }
    expect(s.undoStack.length).toBeLessThanOrEqual(MAX_HISTORY_DEPTH);
  });

  it('manages checklist items', () => {
    const state = getInitialState();
    const item = createChecklistItem('Setup CI');

    const added = projectReducer(state, { type: 'ADD_CHECKLIST_ITEM', item });
    expect(added.project.checklist).toHaveLength(1);
    expect(added.project.checklist[0]?.completed).toBe(false);

    const toggled = projectReducer(added, { type: 'TOGGLE_CHECKLIST_ITEM', itemId: item.id });
    expect(toggled.project.checklist[0]?.completed).toBe(true);

    const deleted = projectReducer(toggled, { type: 'DELETE_CHECKLIST_ITEM', itemId: item.id });
    expect(deleted.project.checklist).toHaveLength(0);
  });

  it('bulk updates nodes color and creates a single undo entry', () => {
    const state = getInitialState();
    const n1 = createNode('developer', { title: 'Node 1', colorToken: 'blue' });
    const n2 = createNode('developer', { title: 'Node 2', colorToken: 'neutral' });
    const n3 = createNode('developer', { title: 'Node 3', colorToken: 'purple' });

    let s = projectReducer(state, { type: 'ADD_NODE', node: n1 });
    s = projectReducer(s, { type: 'ADD_NODE', node: n2 });
    s = projectReducer(s, { type: 'ADD_NODE', node: n3 });
    const baseUndoDepth = s.undoStack.length;

    // Bulk update n1 and n2 to emerald
    const recolored = projectReducer(s, {
      type: 'BULK_UPDATE_NODES_COLOR',
      nodeIds: [n1.id, n2.id],
      colorToken: 'emerald',
    });

    expect(recolored.project.nodes.find((n) => n.id === n1.id)?.colorToken).toBe('emerald');
    expect(recolored.project.nodes.find((n) => n.id === n2.id)?.colorToken).toBe('emerald');
    expect(recolored.project.nodes.find((n) => n.id === n3.id)?.colorToken).toBe('purple'); // untouched
    expect(recolored.undoStack).toHaveLength(baseUndoDepth + 1);

    // Undo reverts all recolored nodes in one step
    const undone = projectReducer(recolored, { type: 'UNDO' });
    expect(undone.project.nodes.find((n) => n.id === n1.id)?.colorToken).toBe('blue');
    expect(undone.project.nodes.find((n) => n.id === n2.id)?.colorToken).toBe('neutral');
  });

  it('coalesces rapid text editing into a single logical undo step', () => {
    const state = getInitialState();
    const node = createNode('developer', { title: 'Initial' });
    let s = projectReducer(state, { type: 'ADD_NODE', node });
    const initialUndoLength = s.undoStack.length;

    // Simulate typing "Hello World" rapidly
    const letters = ['H', 'He', 'Hel', 'Hell', 'Hello', 'Hello '];
    for (const text of letters) {
      s = projectReducer(s, {
        type: 'UPDATE_NODE',
        nodeId: node.id,
        updates: { title: text },
        coalesceKey: `${node.id}:title`,
      });
    }

    // Only 1 undo entry should have been created for the entire typing sequence!
    expect(s.undoStack).toHaveLength(initialUndoLength + 1);
    expect(s.project.nodes[0]?.title).toBe('Hello ');

    // Undo should revert straight back to "Initial"
    const undone = projectReducer(s, { type: 'UNDO' });
    expect(undone.project.nodes[0]?.title).toBe('Initial');

    // Redo brings back the completed text "Hello "
    const redone = projectReducer(undone, { type: 'REDO' });
    expect(redone.project.nodes[0]?.title).toBe('Hello ');
  });

  it('commits coalesce when field loses focus', () => {
    const state = getInitialState();
    const node = createNode('developer', { title: 'Init' });
    let s = projectReducer(state, { type: 'ADD_NODE', node });

    s = projectReducer(s, {
      type: 'UPDATE_NODE',
      nodeId: node.id,
      updates: { title: 'Phase 1' },
      coalesceKey: `${node.id}:title`,
    });

    // Explicit blur commits coalesce
    s = projectReducer(s, { type: 'COMMIT_COALESCE' });

    // Next edit will now create a new undo entry
    s = projectReducer(s, {
      type: 'UPDATE_NODE',
      nodeId: node.id,
      updates: { title: 'Phase 2' },
      coalesceKey: `${node.id}:title`,
    });

    // Undo reverts to Phase 1 first
    const undone1 = projectReducer(s, { type: 'UNDO' });
    expect(undone1.project.nodes[0]?.title).toBe('Phase 1');

    // Undo again reverts to Init
    const undone2 = projectReducer(undone1, { type: 'UNDO' });
    expect(undone2.project.nodes[0]?.title).toBe('Init');
  });
});
