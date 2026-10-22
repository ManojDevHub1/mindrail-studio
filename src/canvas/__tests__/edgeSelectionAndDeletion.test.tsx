/**
 * Comprehensive Test Suite for Connection Selection, Context Menu & Deletion UX
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEdge, createNode, createProject } from '../../domain/factories';
import { CanvasViewport } from '../CanvasViewport';
import { EdgeInspector } from '../../workspaces/EdgeInspector';
import { projectReducer } from '../../state/projectReducer';

describe('Connection Selection & Deletion UX Suite', () => {
  const defaultViewport = { x: 0, y: 0, zoom: 1 };

  beforeEach(() => {
    if (typeof document !== 'undefined' && !document.elementFromPoint) {
      document.elementFromPoint = () => null;
    }
  });

  describe('Edge Selection & Hit Testing', () => {
    it('clicking an edge selects that edge and clears any node selection', () => {
      const nodeA = createNode('developer', { id: 'node-a', title: 'API Gateway', position: { x: 100, y: 100 } });
      const nodeB = createNode('developer', { id: 'node-b', title: 'Auth Service', position: { x: 400, y: 100 } });
      const edge = createEdge({ id: 'edge-1', sourceNodeId: 'node-a', targetNodeId: 'node-b', sourcePort: 'right', targetPort: 'left' });

      const onSelectEdge = vi.fn();
      const onSelectNodes = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[edge]}
          viewport={defaultViewport}
          selectedNodeIds={['node-a']}
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

      // Locate the edge group or hit area
      const edgeHitArea = document.querySelector('[data-edge-hit-area="true"]');
      expect(edgeHitArea).not.toBeNull();

      fireEvent.click(edgeHitArea!);

      expect(onSelectEdge).toHaveBeenCalledWith('edge-1');
      expect(onSelectNodes).toHaveBeenCalledWith([]);
    });

    it('supports selecting edges with bezier, orthogonal, and straight routing via wide hit area', () => {
      const nodeA = createNode('developer', { id: 'node-1', position: { x: 50, y: 50 } });
      const nodeB = createNode('developer', { id: 'node-2', position: { x: 300, y: 50 } });
      const nodeC = createNode('developer', { id: 'node-3', position: { x: 300, y: 300 } });

      const edgeBezier = createEdge({ id: 'edge-bezier', sourceNodeId: 'node-1', targetNodeId: 'node-2', routingStyle: 'bezier' });
      const edgeOrtho = createEdge({ id: 'edge-ortho', sourceNodeId: 'node-2', targetNodeId: 'node-3', routingStyle: 'orthogonal' });
      const edgeStraight = createEdge({ id: 'edge-straight', sourceNodeId: 'node-1', targetNodeId: 'node-3', routingStyle: 'straight' });

      const onSelectEdge = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB, nodeC]}
          edges={[edgeBezier, edgeOrtho, edgeStraight]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
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

      const hitAreas = document.querySelectorAll('[data-edge-hit-area="true"]');
      expect(hitAreas.length).toBe(3);

      // Click each routing style
      fireEvent.click(hitAreas[0]!);
      expect(onSelectEdge).toHaveBeenCalledWith('edge-bezier');

      fireEvent.click(hitAreas[1]!);
      expect(onSelectEdge).toHaveBeenCalledWith('edge-ortho');

      fireEvent.click(hitAreas[2]!);
      expect(onSelectEdge).toHaveBeenCalledWith('edge-straight');
    });

    it('displays the subtle selection halo and selected class when selectedEdgeId matches', () => {
      const nodeA = createNode('developer', { id: 'node-1', position: { x: 50, y: 50 } });
      const nodeB = createNode('developer', { id: 'node-2', position: { x: 300, y: 50 } });
      const edge = createEdge({ id: 'edge-selected-test', sourceNodeId: 'node-1', targetNodeId: 'node-2' });

      const { rerender } = render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[edge]}
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
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      // Initially not selected
      let edgeGroup = document.querySelector('[data-edge-id="edge-selected-test"]');
      expect(edgeGroup?.getAttribute('aria-label')).toContain('unselected');
      expect(document.querySelector('._edgeSelectionHalo_2f68de')).toBeNull();

      // Rerender with selectedEdgeId set
      rerender(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[edge]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId="edge-selected-test"
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
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

      edgeGroup = document.querySelector('[data-edge-id="edge-selected-test"]');
      expect(edgeGroup?.getAttribute('aria-label')).toContain('selected');
      const halo = document.querySelector('._edgeSelectionHalo_2f68de');
      expect(halo).not.toBeNull();
    });

    it('clicking an edge stops propagation so marquee drag or canvas panning does not start', () => {
      const nodeA = createNode('developer', { id: 'n1', position: { x: 0, y: 0 } });
      const nodeB = createNode('developer', { id: 'n2', position: { x: 200, y: 0 } });
      const edge = createEdge({ id: 'e1', sourceNodeId: 'n1', targetNodeId: 'n2' });

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[edge]}
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
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const hitArea = document.querySelector('[data-edge-hit-area="true"]');
      expect(hitArea).not.toBeNull();

      // Trigger pointerdown on edge
      fireEvent.pointerDown(hitArea!, { clientX: 100, clientY: 10, button: 0 });

      // No marquee box should exist
      expect(document.querySelector('._selectionMarquee_ea4bbd')).toBeNull();
    });
  });

  describe('Keyboard Shortcuts (Delete & Backspace & Escape)', () => {
    it('pressing Delete when an edge is selected deletes only that edge', () => {
      const nodeA = createNode('developer', { id: 'n1', title: 'Node 1', position: { x: 0, y: 0 } });
      const nodeB = createNode('developer', { id: 'n2', title: 'Node 2', position: { x: 200, y: 0 } });
      const edge = createEdge({ id: 'edge-to-del', sourceNodeId: 'n1', targetNodeId: 'n2' });

      const onDeleteEdge = vi.fn();
      const onSelectEdge = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[edge]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId="edge-to-del"
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={onSelectEdge}
          onDeleteEdge={onDeleteEdge}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      fireEvent.keyDown(window, { key: 'Delete' });

      expect(onDeleteEdge).toHaveBeenCalledWith('edge-to-del');
      expect(onSelectEdge).toHaveBeenCalledWith(null);

      const announcer = document.getElementById('canvas-status-announcer');
      expect(announcer?.textContent).toContain('Deleted connection');
    });

    it('pressing Backspace deletes the selected edge as well', () => {
      const nodeA = createNode('developer', { id: 'n1', position: { x: 0, y: 0 } });
      const nodeB = createNode('developer', { id: 'n2', position: { x: 200, y: 0 } });
      const edge = createEdge({ id: 'edge-backspace', sourceNodeId: 'n1', targetNodeId: 'n2' });

      const onDeleteEdge = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[edge]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId="edge-backspace"
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onDeleteEdge={onDeleteEdge}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      fireEvent.keyDown(window, { key: 'Backspace' });

      expect(onDeleteEdge).toHaveBeenCalledWith('edge-backspace');
    });

    it('pressing Escape clears edge selection without modifying data', () => {
      const onSelectEdge = vi.fn();

      render(
        <CanvasViewport
          nodes={[]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId="edge-active"
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
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

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(onSelectEdge).toHaveBeenCalledWith(null);
    });

    it('does not delete edges when Delete/Backspace is pressed inside a text input', () => {
      const onDeleteEdge = vi.fn();

      render(
        <div>
          <input type="text" data-testid="test-input" defaultValue="hello" />
          <CanvasViewport
            nodes={[]}
            edges={[]}
            viewport={defaultViewport}
            selectedNodeIds={[]}
            selectedEdgeId="edge-protected"
            snapToGrid={false}
            onUpdateViewport={vi.fn()}
            onSelectNodes={vi.fn()}
            onSelectEdge={vi.fn()}
            onDeleteEdge={onDeleteEdge}
            onMoveNodesCommit={vi.fn()}
            onDeleteNode={vi.fn()}
            onToggleLockNode={vi.fn()}
            onConnectPorts={vi.fn()}
            onAddQuickNode={vi.fn()}
            onOpenShortcutsModal={vi.fn()}
            onToggleSnapGrid={vi.fn()}
          />
        </div>
      );

      const input = screen.getByTestId('test-input');
      input.focus();

      fireEvent.keyDown(input, { key: 'Delete' });
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onDeleteEdge).not.toHaveBeenCalled();
    });
  });

  describe('Right-Click Connection Menu', () => {
    it('right-clicking an edge opens the EdgeContextMenu with routing options and Delete action', () => {
      const nodeA = createNode('developer', { id: 'n1', title: 'Orders Service', position: { x: 50, y: 50 } });
      const nodeB = createNode('developer', { id: 'n2', title: 'Inventory DB', position: { x: 300, y: 50 } });
      const edge = createEdge({ id: 'edge-ctx', sourceNodeId: 'n1', targetNodeId: 'n2', routingStyle: 'bezier' });

      const onSelectEdge = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[edge]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
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

      const hitArea = document.querySelector('[data-edge-hit-area="true"]');
      expect(hitArea).not.toBeNull();

      fireEvent.contextMenu(hitArea!, { clientX: 180, clientY: 70 });

      // Check context menu appeared
      expect(screen.getByRole('menu')).toBeDefined();
      expect(screen.getByText('Orders Service → Inventory DB')).toBeDefined();
      expect(screen.getByText('Inspect Connection')).toBeDefined();
      expect(screen.getByText('Routing: Smooth Bezier')).toBeDefined();
      expect(screen.getByText('Routing: Orthogonal')).toBeDefined();
      expect(screen.getByText('Routing: Straight Line')).toBeDefined();
      expect(screen.getByText('Delete Connection')).toBeDefined();
    });

    it('changing routing style in context menu triggers onUpdateEdge', () => {
      const nodeA = createNode('developer', { id: 'n1', title: 'Service A', position: { x: 0, y: 0 } });
      const nodeB = createNode('developer', { id: 'n2', title: 'Service B', position: { x: 200, y: 0 } });
      const edge = createEdge({ id: 'edge-route', sourceNodeId: 'n1', targetNodeId: 'n2', routingStyle: 'bezier' });

      const onUpdateEdge = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[edge]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onUpdateEdge={onUpdateEdge}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const hitArea = document.querySelector('[data-edge-hit-area="true"]');
      fireEvent.contextMenu(hitArea!, { clientX: 100, clientY: 50 });

      const orthoBtn = screen.getByText('Routing: Orthogonal');
      fireEvent.click(orthoBtn);

      expect(onUpdateEdge).toHaveBeenCalledWith('edge-route', { routingStyle: 'orthogonal' });
    });

    it('clicking Delete Connection in the context menu deletes the edge', () => {
      const nodeA = createNode('developer', { id: 'n1', title: 'Service A', position: { x: 0, y: 0 } });
      const nodeB = createNode('developer', { id: 'n2', title: 'Service B', position: { x: 200, y: 0 } });
      const edge = createEdge({ id: 'edge-ctx-del', sourceNodeId: 'n1', targetNodeId: 'n2' });

      const onDeleteEdge = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[edge]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onDeleteEdge={onDeleteEdge}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const hitArea = document.querySelector('[data-edge-hit-area="true"]');
      fireEvent.contextMenu(hitArea!, { clientX: 100, clientY: 50 });

      const delBtn = screen.getByText('Delete Connection');
      fireEvent.click(delBtn);

      expect(onDeleteEdge).toHaveBeenCalledWith('edge-ctx-del');
    });

    it('pressing Escape closes the edge context menu', () => {
      const nodeA = createNode('developer', { id: 'n1', position: { x: 0, y: 0 } });
      const nodeB = createNode('developer', { id: 'n2', position: { x: 200, y: 0 } });
      const edge = createEdge({ id: 'edge-esc', sourceNodeId: 'n1', targetNodeId: 'n2' });

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[edge]}
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
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const hitArea = document.querySelector('[data-edge-hit-area="true"]');
      fireEvent.contextMenu(hitArea!, { clientX: 100, clientY: 50 });

      expect(screen.getByRole('menu')).toBeDefined();

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  describe('Edge Inspector Display & Deletion', () => {
    it('EdgeInspector renders actual source and target titles, endpoints, and calls onDeleteEdge', () => {
      const edge = createEdge({
        id: 'inspect-edge-1',
        sourceNodeId: 'src-1',
        targetNodeId: 'tgt-1',
        sourcePort: 'top',
        targetPort: 'bottom',
        label: 'Calls Auth',
        routingStyle: 'orthogonal',
      });

      const onUpdateEdge = vi.fn();
      const onDeleteEdge = vi.fn();
      const onClose = vi.fn();

      render(
        <EdgeInspector
          edge={edge}
          sourceNodeTitle="Client App"
          targetNodeTitle="Authentication Gateway"
          onUpdateEdge={onUpdateEdge}
          onDeleteEdge={onDeleteEdge}
          onClose={onClose}
        />
      );

      expect(screen.getByText('Client App')).toBeDefined();
      expect(screen.getByText('(top port)')).toBeDefined();
      expect(screen.getByText('Authentication Gateway')).toBeDefined();
      expect(screen.getByText('(bottom port)')).toBeDefined();

      // Click Delete Connection in inspector
      const deleteBtn = screen.getByRole('button', { name: 'Delete Connection' });
      fireEvent.click(deleteBtn);

      expect(onDeleteEdge).toHaveBeenCalledWith('inspect-edge-1');
    });
  });

  describe('Canonical Edge Deletion & Reducer Integrity', () => {
    it('deleting an edge preserves both endpoint nodes and unrelated edges with full undo/redo', () => {
      const nodeA = createNode('developer', { id: 'node-A', title: 'Web App' });
      const nodeB = createNode('developer', { id: 'node-B', title: 'Backend' });
      const nodeC = createNode('developer', { id: 'node-C', title: 'Database' });

      const edge1 = createEdge({ id: 'edge-AB', sourceNodeId: 'node-A', targetNodeId: 'node-B' });
      const edge2 = createEdge({ id: 'edge-BC', sourceNodeId: 'node-B', targetNodeId: 'node-C' });

      const project = createProject('developer', {
        nodes: [nodeA, nodeB, nodeC],
        edges: [edge1, edge2],
      });

      const initialState = {
        project,
        undoStack: [],
        redoStack: [],
        revision: 1,
      };

      // 1. Delete edge-AB
      const stateAfterDelete = projectReducer(initialState, {
        type: 'DELETE_EDGES',
        edgeIds: ['edge-AB'],
      });

      // Assert edge-AB was deleted
      expect(stateAfterDelete.project.edges).toHaveLength(1);
      expect(stateAfterDelete.project.edges[0]?.id).toBe('edge-BC');

      // Assert all 3 nodes are completely preserved
      expect(stateAfterDelete.project.nodes).toHaveLength(3);
      expect(stateAfterDelete.project.nodes.map((n) => n.id)).toEqual(['node-A', 'node-B', 'node-C']);

      // Assert undo stack recorded the action
      expect(stateAfterDelete.undoStack).toHaveLength(1);

      // 2. Undo
      const stateAfterUndo = projectReducer(stateAfterDelete, { type: 'UNDO' });
      expect(stateAfterUndo.project.edges).toHaveLength(2);
      expect(stateAfterUndo.project.edges.map((e) => e.id)).toContain('edge-AB');

      // 3. Redo
      const stateAfterRedo = projectReducer(stateAfterUndo, { type: 'REDO' });
      expect(stateAfterRedo.project.edges).toHaveLength(1);
      expect(stateAfterRedo.project.edges[0]?.id).toBe('edge-BC');
    });
  });
});
