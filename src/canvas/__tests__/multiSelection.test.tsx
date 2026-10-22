import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createNode } from '../../domain/factories';
import { CanvasViewport } from '../CanvasViewport';

describe('Phase 2 Canvas: Multi-Selection & Bulk Actions', () => {
  const defaultViewport = { x: 0, y: 0, zoom: 1 };

  it('renders multiple selected nodes with selection highlights', () => {
    const n1 = createNode('developer', { title: 'Node Alpha', position: { x: 50, y: 50 } });
    const n2 = createNode('developer', { title: 'Node Beta', position: { x: 300, y: 50 } });

    render(
      <CanvasViewport
        nodes={[n1, n2]}
        edges={[]}
        viewport={defaultViewport}
        selectedNodeIds={[n1.id, n2.id]}
        selectedEdgeId={null}
        snapToGrid={false}
        onUpdateViewport={vi.fn()}
        onSelectNode={vi.fn()}
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

    // Both nodes are rendered and the floating selection action bar is displayed!
    expect(screen.getByText('Node Alpha')).toBeDefined();
    expect(screen.getByText('Node Beta')).toBeDefined();
    expect(screen.getByText('nodes selected')).toBeDefined();
  });

  it('triggers bulk recolor when a color swatch in the selection action bar is clicked', () => {
    const n1 = createNode('developer', { title: 'Node 1', position: { x: 100, y: 100 } });
    const n2 = createNode('developer', { title: 'Node 2', position: { x: 350, y: 100 } });
    const onBulkRecolorNodes = vi.fn();

    render(
      <CanvasViewport
        nodes={[n1, n2]}
        edges={[]}
        viewport={defaultViewport}
        selectedNodeIds={[n1.id, n2.id]}
        selectedEdgeId={null}
        snapToGrid={false}
        onUpdateViewport={vi.fn()}
        onSelectNode={vi.fn()}
        onSelectNodes={vi.fn()}
        onSelectEdge={vi.fn()}
        onMoveNodesCommit={vi.fn()}
        onDeleteNode={vi.fn()}
        onBulkRecolorNodes={onBulkRecolorNodes}
        onToggleLockNode={vi.fn()}
        onConnectPorts={vi.fn()}
        onAddQuickNode={vi.fn()}
        onOpenShortcutsModal={vi.fn()}
        onToggleSnapGrid={vi.fn()}
      />
    );

    const emeraldSwatch = screen.getByLabelText('Color emerald');
    fireEvent.click(emeraldSwatch);

    expect(onBulkRecolorNodes).toHaveBeenCalledWith([n1.id, n2.id], 'emerald');
  });

  it('triggers bulk deletion when Delete All button is clicked', () => {
    const n1 = createNode('developer', { title: 'Node 1' });
    const n2 = createNode('developer', { title: 'Node 2' });
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
        onSelectNode={vi.fn()}
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

    const deleteBtn = screen.getByRole('button', { name: /delete 2 selected nodes/i });
    fireEvent.click(deleteBtn);

    expect(onDeleteNodes).toHaveBeenCalledWith([n1.id, n2.id]);
  });

  it('moves all selected nodes together during group drag', () => {
    const n1 = createNode('developer', { title: 'N1', position: { x: 100, y: 100 } });
    const n2 = createNode('developer', { title: 'N2', position: { x: 400, y: 200 } });
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
        onSelectNode={vi.fn()}
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

    const card = screen.getByText('N1').closest('[role="button"]')!;

    // Start drag on N1
    fireEvent.pointerDown(card, { clientX: 120, clientY: 120, button: 0 });

    const viewportEl = screen.getByLabelText('Interactive Canvas Viewport');
    // Move 50px right, 30px down
    fireEvent.pointerMove(viewportEl, { clientX: 170, clientY: 150 });
    // Release pointer
    fireEvent.pointerUp(viewportEl, { clientX: 170, clientY: 150 });

    expect(onMoveNodesCommit).toHaveBeenCalledWith([
      { nodeId: n1.id, position: { x: 150, y: 130 } },
      { nodeId: n2.id, position: { x: 450, y: 230 } },
    ]);
  });
});
