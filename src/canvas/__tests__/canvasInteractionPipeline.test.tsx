/**
 * Integration Test Suite for Canvas Interaction Pipeline:
 * - Priority A: Canvas Toolbar Buttons (Zoom In/Out, Percentage, Fit View, Grid Toggle, Minimap Toggle, Shortcuts, Stats)
 * - Priority B: Single-Click Node Selection & Isolation
 * - Priority C: Right-Click Custom Context Menu (Inspect, Lock, Duplicate, Connect, Delete, Keyboard & Click Outside)
 * - Priority D: Manual Connections with Port Highlighting & Endpoint Snapping
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasViewport } from '../CanvasViewport';
import { createNode, createEdge } from '../../domain/factories';

describe('Canvas Interaction Pipeline Integration Suite', () => {
  const defaultViewport = { x: 0, y: 0, zoom: 1 };

  beforeEach(() => {
    if (typeof document !== 'undefined' && !document.elementFromPoint) {
      document.elementFromPoint = () => null;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Priority A: Canvas Toolbar Buttons', () => {
    it('zoom in button increases viewport scale and centers on viewport', () => {
      const onUpdateViewport = vi.fn();
      render(
        <CanvasViewport
          nodes={[]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={true}
          onUpdateViewport={onUpdateViewport}
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

      const zoomInBtn = screen.getByRole('button', { name: 'Zoom In' });
      fireEvent.click(zoomInBtn);

      expect(onUpdateViewport).toHaveBeenCalled();
      const updatedVp = onUpdateViewport.mock.calls[0][0];
      expect(updatedVp.zoom).toBe(1.2);
    });

    it('zoom out button decreases viewport scale predictably', () => {
      const onUpdateViewport = vi.fn();
      render(
        <CanvasViewport
          nodes={[]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={true}
          onUpdateViewport={onUpdateViewport}
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

      const zoomOutBtn = screen.getByRole('button', { name: 'Zoom Out' });
      fireEvent.click(zoomOutBtn);

      expect(onUpdateViewport).toHaveBeenCalled();
      const updatedVp = onUpdateViewport.mock.calls[0][0];
      expect(updatedVp.zoom).toBeLessThan(1);
    });

    it('zoom percentage display shows current scale and clicking resets zoom to 100%', () => {
      const onUpdateViewport = vi.fn();
      render(
        <CanvasViewport
          nodes={[]}
          edges={[]}
          viewport={{ x: 100, y: 50, zoom: 1.5 }}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={true}
          onUpdateViewport={onUpdateViewport}
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

      const zoomLabel = screen.getByRole('button', { name: /Current zoom 150%/i });
      expect(zoomLabel).toBeDefined();
      expect(zoomLabel.textContent).toContain('150%');

      fireEvent.click(zoomLabel);
      expect(onUpdateViewport).toHaveBeenCalled();
      expect(onUpdateViewport.mock.calls[0][0].zoom).toBe(1.0);
    });

    it('fit to view / fullscreen button calculates a centered bounding box for nodes and requests fullscreen', () => {
      const nodeA = createNode('developer', { title: 'Node A', position: { x: 0, y: 0 } });
      const nodeB = createNode('developer', { title: 'Node B', position: { x: 600, y: 400 } });
      const onUpdateViewport = vi.fn();

      const requestFsSpy = vi.fn().mockResolvedValue(undefined);
      document.documentElement.requestFullscreen = requestFsSpy;

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={true}
          onUpdateViewport={onUpdateViewport}
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

      const fitBtn = screen.getByRole('button', { name: /Fit to View/i });
      fireEvent.click(fitBtn);

      expect(onUpdateViewport).toHaveBeenCalled();
      const updatedVp = onUpdateViewport.mock.calls[0][0];
      expect(updatedVp.zoom).toBeGreaterThan(0.2);
      expect(updatedVp.zoom).toBeLessThanOrEqual(1.2);
      expect(requestFsSpy).toHaveBeenCalled();
    });

    it('pointerdown on toolbar buttons does not bubble to canvas marquee selection', () => {
      const nodeA = createNode('developer', { title: 'Sample Node' });
      const onSelectNodes = vi.fn();

      const { container } = render(
        <CanvasViewport
          nodes={[nodeA]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[nodeA.id]}
          selectedEdgeId={null}
          snapToGrid={true}
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

      const zoomInBtn = screen.getByRole('button', { name: 'Zoom In' });
      // Full pointer sequence: pointerdown -> click -> pointerup
      fireEvent.pointerDown(zoomInBtn, { clientX: 100, clientY: 700, button: 0 });
      fireEvent.click(zoomInBtn);
      fireEvent.pointerUp(zoomInBtn, { clientX: 100, clientY: 700, button: 0 });

      // No marquee box created, and selection was NOT cleared
      expect(container.querySelector('[class*="selectionMarquee"]')).toBeNull();
      expect(onSelectNodes).not.toHaveBeenCalledWith([]);
    });

    it('grid toggle button toggles visual grid pattern and triggers snap callback', () => {
      const onToggleSnapGrid = vi.fn();
      const { container } = render(
        <CanvasViewport
          nodes={[]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={true}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={onToggleSnapGrid}
        />
      );

      const gridBtn = screen.getByLabelText(/Toggle Canvas Grid/i);
      expect(gridBtn.getAttribute('aria-pressed')).toBe('true');
      expect(container.querySelector('[class*="gridPattern"]')).not.toBeNull();

      fireEvent.click(gridBtn);
      expect(onToggleSnapGrid).toHaveBeenCalled();
      // Grid visually toggled off
      expect(container.querySelector('[class*="gridPattern"]')).toBeNull();
    });

    it('minimap toggle button shows and hides the minimap container', () => {
      render(
        <CanvasViewport
          nodes={[]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={true}
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

      const minimapBtn = screen.getByLabelText(/Toggle minimap/i);
      expect(screen.getByRole('region', { name: 'Canvas overview minimap' })).toBeDefined();

      fireEvent.click(minimapBtn);
      expect(screen.queryByRole('region', { name: 'Canvas overview minimap' })).toBeNull();
    });

    it('shortcuts help button invokes onOpenShortcutsModal', () => {
      const onOpenShortcutsModal = vi.fn();
      render(
        <CanvasViewport
          nodes={[]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={true}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={onOpenShortcutsModal}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const helpBtn = screen.getByRole('button', { name: 'View Keyboard Shortcuts' });
      fireEvent.click(helpBtn);
      expect(onOpenShortcutsModal).toHaveBeenCalled();
    });

    it('canvas statistics accurately reflect valid nodes and exclude orphaned edges', () => {
      const node1 = createNode('developer', { title: 'Node 1' });
      const node2 = createNode('developer', { title: 'Node 2' });
      // Valid edge
      const edgeValid = createEdge({ sourceNodeId: node1.id, targetNodeId: node2.id });
      // Orphan edge pointing to nonexistent node
      const edgeOrphan = createEdge({ sourceNodeId: node1.id, targetNodeId: 'nonexistent-id' });

      render(
        <CanvasViewport
          nodes={[node1, node2]}
          edges={[edgeValid, edgeOrphan]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={true}
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

      // Node count is 2, valid edge count is 1 (excluding orphan)
      expect(screen.getByText('2')).toBeDefined();
      expect(screen.getByText('nodes')).toBeDefined();
      expect(screen.getByText('1')).toBeDefined();
      expect(screen.getByText('connection')).toBeDefined();
    });
  });

  describe('Priority C: Right-Click Custom Context Menu', () => {
    it('right-clicking a node selects it and opens custom context menu at pointer location', () => {
      const nodeA = createNode('developer', { title: 'Backend API' });
      const onSelectNodes = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[]}
          selectedEdgeId={null}
          snapToGrid={true}
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

      const card = screen.getByText('Backend API').closest('[data-node-card="true"]')!;
      fireEvent.contextMenu(card, { clientX: 300, clientY: 200 });

      // Node selected
      expect(onSelectNodes).toHaveBeenCalledWith([nodeA.id]);
      // Context menu rendered with role="menu"
      const menu = screen.getByRole('menu', { name: /Node options for Backend API/i });
      expect(menu).toBeDefined();
      expect(screen.getByRole('menuitem', { name: /Inspect Node/i })).toBeDefined();
      expect(screen.getByRole('menuitem', { name: /Lock Position/i })).toBeDefined();
      expect(screen.getByRole('menuitem', { name: /Start Connection/i })).toBeDefined();
      expect(screen.getByRole('menuitem', { name: /Delete Node/i })).toBeDefined();
    });

    it('context menu Inspect Node action selects the node and closes menu', () => {
      const nodeA = createNode('developer', { title: 'Backend API' });
      const onSelectNodes = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[nodeA.id]}
          selectedEdgeId={null}
          snapToGrid={true}
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

      const card = screen.getByText('Backend API').closest('[data-node-card="true"]')!;
      fireEvent.contextMenu(card, { clientX: 300, clientY: 200 });

      const inspectItem = screen.getByRole('menuitem', { name: /Inspect Node/i });
      fireEvent.click(inspectItem);

      expect(onSelectNodes).toHaveBeenCalledWith([nodeA.id]);
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('context menu Lock/Unlock action toggles node lock state', () => {
      const nodeA = createNode('developer', { title: 'Backend API', locked: false });
      const onToggleLockNode = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[nodeA.id]}
          selectedEdgeId={null}
          snapToGrid={true}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={onToggleLockNode}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const card = screen.getByText('Backend API').closest('[data-node-card="true"]')!;
      fireEvent.contextMenu(card, { clientX: 300, clientY: 200 });

      const lockItem = screen.getByRole('menuitem', { name: /Lock Position/i });
      fireEvent.click(lockItem);

      expect(onToggleLockNode).toHaveBeenCalledWith(nodeA.id);
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('context menu Duplicate Node action invokes onDuplicateNode', () => {
      const nodeA = createNode('developer', { title: 'Backend API' });
      const onDuplicateNode = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[nodeA.id]}
          selectedEdgeId={null}
          snapToGrid={true}
          onUpdateViewport={vi.fn()}
          onSelectNodes={vi.fn()}
          onSelectEdge={vi.fn()}
          onMoveNodesCommit={vi.fn()}
          onDeleteNode={vi.fn()}
          onToggleLockNode={vi.fn()}
          onDuplicateNode={onDuplicateNode}
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const card = screen.getByText('Backend API').closest('[data-node-card="true"]')!;
      fireEvent.contextMenu(card, { clientX: 300, clientY: 200 });

      const duplicateItem = screen.getByRole('menuitem', { name: /Duplicate Node/i });
      fireEvent.click(duplicateItem);

      expect(onDuplicateNode).toHaveBeenCalledWith(nodeA.id);
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('context menu Delete Node action invokes onDeleteNode', () => {
      const nodeA = createNode('developer', { title: 'Backend API' });
      const onDeleteNode = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[nodeA.id]}
          selectedEdgeId={null}
          snapToGrid={true}
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

      const card = screen.getByText('Backend API').closest('[data-node-card="true"]')!;
      fireEvent.contextMenu(card, { clientX: 300, clientY: 200 });

      const deleteItem = screen.getByRole('menuitem', { name: /Delete Node/i });
      fireEvent.click(deleteItem);

      expect(onDeleteNode).toHaveBeenCalledWith(nodeA.id);
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('pressing Escape key closes the context menu', () => {
      const nodeA = createNode('developer', { title: 'Backend API' });

      render(
        <CanvasViewport
          nodes={[nodeA]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[nodeA.id]}
          selectedEdgeId={null}
          snapToGrid={true}
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

      const card = screen.getByText('Backend API').closest('[data-node-card="true"]')!;
      fireEvent.contextMenu(card, { clientX: 300, clientY: 200 });
      expect(screen.getByRole('menu')).toBeDefined();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('clicking outside closes the context menu', () => {
      const nodeA = createNode('developer', { title: 'Backend API' });

      render(
        <CanvasViewport
          nodes={[nodeA]}
          edges={[]}
          viewport={defaultViewport}
          selectedNodeIds={[nodeA.id]}
          selectedEdgeId={null}
          snapToGrid={true}
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

      const card = screen.getByText('Backend API').closest('[data-node-card="true"]')!;
      fireEvent.contextMenu(card, { clientX: 300, clientY: 200 });
      expect(screen.getByRole('menu')).toBeDefined();

      // Pointerdown on document outside
      fireEvent.pointerDown(document.body);
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  describe('Priority D: Manual Node Connections with Port Highlighting & Endpoint Snapping', () => {
    it('dragging from source port highlights source port and candidate destination ports', () => {
      const nodeA = createNode('developer', { title: 'Source Service', position: { x: 100, y: 100 } });
      const nodeB = createNode('developer', { title: 'Target Service', position: { x: 500, y: 100 } });

      const { container } = render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
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
          onConnectPorts={vi.fn()}
          onAddQuickNode={vi.fn()}
          onOpenShortcutsModal={vi.fn()}
          onToggleSnapGrid={vi.fn()}
        />
      );

      const cardA = screen.getByText('Source Service').closest('[data-node-card="true"]')!;
      const rightPortA = cardA.querySelector('[data-port-side="right"]')!;

      // Pointerdown on source port begins connection
      fireEvent.pointerDown(rightPortA, { clientX: 380, clientY: 180, button: 0 });

      // Source port has active source styling
      expect(rightPortA.className).toContain('portSource');

      // Candidate ports on target service receive candidate highlight
      const cardB = screen.getByText('Target Service').closest('[data-node-card="true"]')!;
      const leftPortB = cardB.querySelector('[data-port-side="left"]')!;
      expect(leftPortB.className).toContain('portCandidate');

      // Preview line SVG is rendered
      expect(container.querySelector('line[class*="tempLine"]')).not.toBeNull();
    });

    it('hovering over target port snaps preview line endpoint and applies portValidTarget class', () => {
      const nodeA = createNode('developer', { title: 'Gateway', position: { x: 100, y: 100 } });
      const nodeB = createNode('developer', { title: 'Database', position: { x: 500, y: 100 } });
      const onConnectPorts = vi.fn();

      const { container } = render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
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

      const cardA = screen.getByText('Gateway').closest('[data-node-card="true"]')!;
      const cardB = screen.getByText('Database').closest('[data-node-card="true"]')!;
      const rightPortA = cardA.querySelector('[data-port-side="right"]')!;
      const leftPortB = cardB.querySelector('[data-port-side="left"]')!;

      // Mock elementFromPoint to return leftPortB during drag hover
      vi.spyOn(document, 'elementFromPoint').mockReturnValue(leftPortB as Element);

      fireEvent.pointerDown(rightPortA, { clientX: 380, clientY: 180, button: 0 });

      const viewport = screen.getByLabelText('Interactive Canvas Viewport');
      fireEvent.pointerMove(viewport, { clientX: 500, clientY: 180 });

      // Target port receives valid target highlight
      expect(leftPortB.className).toContain('portValidTarget');

      // Line snaps and indicator circle appears
      const snappedLine = container.querySelector('line[class*="tempLineSnapped"]');
      expect(snappedLine).not.toBeNull();
      const snapCircle = container.querySelector('svg circle[fill="#10B981"]');
      expect(snapCircle).not.toBeNull();

      // Release over valid port creates connection
      fireEvent.pointerUp(viewport, { clientX: 500, clientY: 180 });
      expect(onConnectPorts).toHaveBeenCalledWith(nodeA.id, 'right', nodeB.id, 'left');
    });

    it('connected ports display connected indicator style', () => {
      const nodeA = createNode('developer', { title: 'Service 1' });
      const nodeB = createNode('developer', { title: 'Service 2' });
      const edge = createEdge({
        sourceNodeId: nodeA.id,
        sourcePort: 'right',
        targetNodeId: nodeB.id,
        targetPort: 'left',
      });

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

      const cardA = screen.getByText('Service 1').closest('[data-node-card="true"]')!;
      const rightPortA = cardA.querySelector('[data-port-side="right"]')!;
      expect(rightPortA.className).toContain('portConnected');

      const cardB = screen.getByText('Service 2').closest('[data-node-card="true"]')!;
      const leftPortB = cardB.querySelector('[data-port-side="left"]')!;
      expect(leftPortB.className).toContain('portConnected');
    });
  });
});
