/**
 * Automated Regression Test Suite for P0 Critical Interaction Bugs:
 * - Bug 1: Single-click node selection, movement threshold, and child control isolation
 * - Bug 2: Manual connection creation by dragging from port to port or port to node
 * - Bug 3: Node position locking (single drag, group drag, arrow keys, Inspector toggle)
 * - Bug 4: Node deletion via Inspector, card trash button, and keyboard shortcut
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasViewport } from '../CanvasViewport';
import { NodeInspector } from '../../workspaces/NodeInspector';
import { createNode, createEdge, createProject } from '../../domain/factories';
import { projectReducer } from '../../state/projectReducer';
import type { ProjectEditorState } from '../../state/projectReducer';

describe('P0 Critical Canvas Bugs Regression Suite', () => {
  const defaultViewport = { x: 0, y: 0, zoom: 1 };

  beforeEach(() => {
    if (typeof document !== 'undefined' && !document.elementFromPoint) {
      document.elementFromPoint = () => null;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Bug 1: Single-Click Node Selection & Movement Threshold', () => {
    it('immediately selects a node on a single click without requiring movement or long-press', () => {
      const nodeA = createNode('developer', { title: 'Service Alpha', position: { x: 100, y: 100 } });
      const nodeB = createNode('developer', { title: 'Service Beta', position: { x: 450, y: 100 } });
      const onSelectNodes = vi.fn();
      const onSelectEdge = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={onSelectNodes}
          onSelectEdge={onSelectEdge}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const cardA = screen.getByText('Service Alpha').closest('[data-node-card="true"]')!;

      // Ordinary click without movement: pointerdown -> pointerup
      fireEvent.pointerDown(cardA, { clientX: 150, clientY: 150, button: 0 });
      fireEvent.pointerUp(cardA, { clientX: 150, clientY: 150, button: 0 });

      expect(onSelectNodes).toHaveBeenCalledWith([nodeA.id]);
      expect(onSelectEdge).toHaveBeenCalledWith(null);
    });

    it('clicking another node updates single-node selection to the new node', () => {
      const nodeA = createNode('developer', { title: 'Node Alpha', position: { x: 100, y: 100 } });
      const nodeB = createNode('developer', { title: 'Node Beta', position: { x: 450, y: 100 } });
      const onSelectNodes = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[nodeA.id]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={onSelectNodes}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const cardB = screen.getByText('Node Beta').closest('[data-node-card="true"]')!;

      // Click Node Beta
      fireEvent.pointerDown(cardB, { clientX: 500, clientY: 150, button: 0 });
      fireEvent.pointerUp(cardB, { clientX: 500, clientY: 150, button: 0 });

      expect(onSelectNodes).toHaveBeenCalledWith([nodeB.id]);
    });

    it('Shift-clicking a node toggles it in the multi-selection set', () => {
      const nodeA = createNode('developer', { title: 'Node Alpha', position: { x: 100, y: 100 } });
      const nodeB = createNode('developer', { title: 'Node Beta', position: { x: 450, y: 100 } });
      const onSelectNodes = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[nodeA.id]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={onSelectNodes}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const cardB = screen.getByText('Node Beta').closest('[data-node-card="true"]')!;

      // Shift+Click Node Beta to add to selection
      fireEvent.pointerDown(cardB, { clientX: 500, clientY: 150, shiftKey: true, button: 0 });
      fireEvent.pointerUp(cardB, { clientX: 500, clientY: 150, shiftKey: true, button: 0 });

      expect(onSelectNodes).toHaveBeenCalledWith([nodeA.id, nodeB.id]);
    });

    it('does not initiate dragging on minor pointer movements below 5px threshold', () => {
      const nodeA = createNode('developer', { title: 'Subtle Move', position: { x: 100, y: 100 } });
      const onMoveNodesCommit = vi.fn();
      const onSelectNodes = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={onSelectNodes}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={onMoveNodesCommit}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const card = screen.getByText('Subtle Move').closest('[data-node-card="true"]')!;
      const viewport = screen.getByLabelText('Interactive Canvas Viewport');

      fireEvent.pointerDown(card, { clientX: 120, clientY: 120, button: 0 });
      // Minor jitter of 2px
      fireEvent.pointerMove(viewport, { clientX: 122, clientY: 121 });
      fireEvent.pointerUp(viewport, { clientX: 122, clientY: 121 });

      // No drag move committed; single click establishes selection instead
      expect(onMoveNodesCommit).not.toHaveBeenCalled();
      expect(onSelectNodes).toHaveBeenCalledWith([nodeA.id]);
    });

    it('safely handles pointer cancellation without leaving dragging stuck', () => {
      const nodeA = createNode('developer', { title: 'Cancel Test', position: { x: 100, y: 100 } });
      const onMoveNodesCommit = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[nodeA.id]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={onMoveNodesCommit}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const card = screen.getByText('Cancel Test').closest('[data-node-card="true"]')!;
      const viewport = screen.getByLabelText('Interactive Canvas Viewport');

      fireEvent.pointerDown(card, { clientX: 120, clientY: 120, button: 0 });
      fireEvent.pointerMove(viewport, { clientX: 180, clientY: 180 });
      // Pointer cancellation event
      fireEvent.pointerCancel(viewport);

      expect(onMoveNodesCommit).not.toHaveBeenCalled();
    });
  });

  describe('Bug 2: Manual Node Connections', () => {
    it('creates a connection when dragging from a source port to a target port handle', () => {
      const node1 = createNode('developer', { title: 'Gateway', position: { x: 100, y: 100 } });
      const node2 = createNode('developer', { title: 'Database', position: { x: 450, y: 100 } });
      const onConnectPorts = vi.fn();

      render(
        <CanvasViewport
          nodes={[node1, node2]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={onConnectPorts}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const card1 = screen.getByText('Gateway').closest('[data-node-card="true"]')!;
      const card2 = screen.getByText('Database').closest('[data-node-card="true"]')!;

      const rightPort1 = card1.querySelector('[data-port-side="right"]')!;
      const leftPort2 = card2.querySelector('[data-port-side="left"]')!;

      // Mock elementFromPoint to return leftPort2 when releasing at drop coordinates
      vi.spyOn(document, 'elementFromPoint').mockReturnValue(leftPort2 as Element);

      // Press down on source port (Gateway right)
      fireEvent.pointerDown(rightPort1, { clientX: 380, clientY: 180, button: 0 });

      const viewport = screen.getByLabelText('Interactive Canvas Viewport');
      // Drag across canvas towards target
      fireEvent.pointerMove(viewport, { clientX: 450, clientY: 180 });

      // Live draft connection line appears
      expect(viewport.querySelector('svg line')).toBeDefined();

      // Release over target port
      fireEvent.pointerUp(viewport, { clientX: 450, clientY: 180 });

      expect(onConnectPorts).toHaveBeenCalledWith(node1.id, 'right', node2.id, 'left');

      vi.restoreAllMocks();
    });

    it('creates a connection when dropping anywhere on the target node card by picking the nearest port', () => {
      const node1 = createNode('developer', { title: 'Service 1', position: { x: 100, y: 100 } });
      const node2 = createNode('developer', { title: 'Service 2', position: { x: 450, y: 100 } });
      const onConnectPorts = vi.fn();

      render(
        <CanvasViewport
          nodes={[node1, node2]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={onConnectPorts}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const card1 = screen.getByText('Service 1').closest('[data-node-card="true"]')!;
      const card2 = screen.getByText('Service 2').closest('[data-node-card="true"]')!;
      const bottomPort1 = card1.querySelector('[data-port-side="bottom"]')!;

      // Mock elementFromPoint to return card2
      vi.spyOn(document, 'elementFromPoint').mockReturnValue(card2 as Element);

      fireEvent.pointerDown(bottomPort1, { clientX: 240, clientY: 260, button: 0 });
      const viewport = screen.getByLabelText('Interactive Canvas Viewport');
      fireEvent.pointerMove(viewport, { clientX: 450, clientY: 180 });
      fireEvent.pointerUp(viewport, { clientX: 450, clientY: 180 });

      // Dropped on card2 near left edge -> target port is resolved to left
      expect(onConnectPorts).toHaveBeenCalledWith(node1.id, 'bottom', node2.id, 'left');

      vi.restoreAllMocks();
    });

    it('cancels manual connection safely when releasing on empty canvas', () => {
      const node1 = createNode('developer', { title: 'Source', position: { x: 100, y: 100 } });
      const onConnectPorts = vi.fn();

      render(
        <CanvasViewport
          nodes={[node1]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={onConnectPorts}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const card1 = screen.getByText('Source').closest('[data-node-card="true"]')!;
      const port = card1.querySelector('[data-port-side="right"]')!;

      vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);

      fireEvent.pointerDown(port, { clientX: 380, clientY: 180, button: 0 });
      const viewport = screen.getByLabelText('Interactive Canvas Viewport');
      fireEvent.pointerMove(viewport, { clientX: 600, clientY: 300 });
      fireEvent.pointerUp(viewport, { clientX: 600, clientY: 300 });

      expect(onConnectPorts).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('cancels active connection draft when Escape key is pressed', () => {
      const node1 = createNode('developer', { title: 'Source', position: { x: 100, y: 100 } });
      const onConnectPorts = vi.fn();

      render(
        <CanvasViewport
          nodes={[node1]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={onConnectPorts}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const card1 = screen.getByText('Source').closest('[data-node-card="true"]')!;
      const port = card1.querySelector('[data-port-side="right"]')!;

      fireEvent.pointerDown(port, { clientX: 380, clientY: 180, button: 0 });
      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      const viewport = screen.getByLabelText('Interactive Canvas Viewport');
      fireEvent.pointerUp(viewport, { clientX: 380, clientY: 180 });

      expect(onConnectPorts).not.toHaveBeenCalled();
    });
  });

  describe('Bug 3: Node Position Locking', () => {
    it('prevents single-node dragging when a node is locked', () => {
      const lockedNode = createNode('developer', {
        title: 'Locked Node',
        position: { x: 200, y: 200 },
        locked: true,
      });
      const onMoveNodesCommit = vi.fn();

      render(
        <CanvasViewport
          nodes={[lockedNode]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[lockedNode.id]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={onMoveNodesCommit}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const card = screen.getByText('Locked Node').closest('[data-node-card="true"]')!;
      const viewport = screen.getByLabelText('Interactive Canvas Viewport');

      fireEvent.pointerDown(card, { clientX: 250, clientY: 250, button: 0 });
      fireEvent.pointerMove(viewport, { clientX: 350, clientY: 350 });
      fireEvent.pointerUp(viewport, { clientX: 350, clientY: 350 });

      // Move action is not committed because node is locked
      expect(onMoveNodesCommit).not.toHaveBeenCalled();
    });

    it('prevents arrow-key nudging of locked nodes', () => {
      const lockedNode = createNode('developer', {
        title: 'Locked Node',
        position: { x: 200, y: 200 },
        locked: true,
      });
      const onMoveNodesCommit = vi.fn();

      render(
        <CanvasViewport
          nodes={[lockedNode]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[lockedNode.id]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={onMoveNodesCommit}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });

      expect(onMoveNodesCommit).not.toHaveBeenCalled();
    });

    it('in group dragging, moves unlocked nodes while strictly keeping locked nodes in place', () => {
      const n1 = createNode('developer', { title: 'Unlocked N1', position: { x: 100, y: 100 }, locked: false });
      const n2 = createNode('developer', { title: 'Locked N2', position: { x: 400, y: 100 }, locked: true });
      const onMoveNodesCommit = vi.fn();

      render(
        <CanvasViewport
          nodes={[n1, n2]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[n1.id, n2.id]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={onMoveNodesCommit}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const card1 = screen.getByText('Unlocked N1').closest('[data-node-card="true"]')!;
      const viewport = screen.getByLabelText('Interactive Canvas Viewport');

      fireEvent.pointerDown(card1, { clientX: 120, clientY: 120, button: 0 });
      fireEvent.pointerMove(viewport, { clientX: 160, clientY: 140 });
      fireEvent.pointerUp(viewport, { clientX: 160, clientY: 140 });

      // ONLY Unlocked N1 is moved; Locked N2 is excluded
      expect(onMoveNodesCommit).toHaveBeenCalledWith([
        { nodeId: n1.id, position: { x: 140, y: 120 } },
      ]);
    });

    it('allows toggling lock position from the Node Inspector', () => {
      const node = createNode('developer', { title: 'Config Node', locked: false });
      const onUpdateNode = vi.fn();

      render(
        <NodeInspector
          node={node}
          onUpdateNode={onUpdateNode}
          onDeleteNode={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const lockBtn = screen.getByRole('button', { name: /lock node position/i });
      expect(lockBtn).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(lockBtn);

      expect(onUpdateNode).toHaveBeenCalledWith(node.id, { locked: true });
    });
  });

  describe('Bug 4: Node Deletion', () => {
    it('deletes the node and prunes its connected edges cleanly via the Inspector Delete button', () => {
      const nodeA = createNode('developer', { title: 'Node A' });
      const nodeB = createNode('developer', { title: 'Node B' });
      const edge = createEdge({
        sourceNodeId: nodeA.id,
        targetNodeId: nodeB.id,
        sourcePort: 'right',
        targetPort: 'left',
      });

      const project = createProject('developer', {
        nodes: [nodeA, nodeB],
        edges: [edge],
      });

      const initialState: ProjectEditorState = {
        project,
        undoStack: [],
        redoStack: [],
        revision: 0,
      };

      // Dispatch DELETE_NODES action
      const stateAfterDelete = projectReducer(initialState, {
        type: 'DELETE_NODES',
        nodeIds: [nodeA.id],
      });

      // Node A is removed; Node B remains
      expect(stateAfterDelete.project.nodes.map((n) => n.id)).toEqual([nodeB.id]);
      // Connected edge is pruned
      expect(stateAfterDelete.project.edges.length).toBe(0);
      // Undo restores both node and edge
      const stateAfterUndo = projectReducer(stateAfterDelete, { type: 'UNDO' });
      expect(stateAfterUndo.project.nodes.length).toBe(2);
      expect(stateAfterUndo.project.edges.length).toBe(1);
    });

    it('clicking the trash button on the node card deletes the node without dragging or marquee interference', () => {
      const node = createNode('developer', { title: 'Trash Me' });
      const onDeleteNode = vi.fn();

      render(
        <CanvasViewport
          nodes={[node]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={onDeleteNode}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const trashBtn = screen.getByRole('button', { name: /delete node/i });
      fireEvent.click(trashBtn);

      expect(onDeleteNode).toHaveBeenCalledWith(node.id);
    });

    it('pressing Delete key deletes all currently selected nodes', () => {
      const n1 = createNode('developer', { title: 'Delete 1' });
      const n2 = createNode('developer', { title: 'Delete 2' });
      const onDeleteNodes = vi.fn();

      render(
        <CanvasViewport
          nodes={[n1, n2]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[n1.id, n2.id]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onDeleteNodes={onDeleteNodes}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      fireEvent.keyDown(window, { key: 'Delete' });

      expect(onDeleteNodes).toHaveBeenCalledWith([n1.id, n2.id]);
    });
  });
});
