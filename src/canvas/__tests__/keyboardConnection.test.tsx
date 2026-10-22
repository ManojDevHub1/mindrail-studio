import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createNode } from '../../domain/factories';
import { CanvasViewport } from '../CanvasViewport';

describe('Phase 2 Canvas: Keyboard Connection System ("C" Mode)', () => {
  const defaultViewport = { x: 0, y: 0, zoom: 1 };

  it('enters connection mode on "C" key and cycles candidates with Tab', () => {
    const n1 = createNode('developer', { title: 'Auth Service', position: { x: 100, y: 100 } });
    const n2 = createNode('developer', { title: 'User Database', position: { x: 400, y: 100 } });
    const n3 = createNode('developer', { title: 'Cache Layer', position: { x: 400, y: 300 } });

    const onConnectPorts = vi.fn();

    render(
      <CanvasViewport
        nodes={[n1, n2, n3]}
        edges={[]}
        viewport={defaultViewport}
        selectedNodeIds={[n1.id]}
        selectedEdgeId={null}
        snapToGrid={false}
        onUpdateViewport={vi.fn()}
        onSelectNode={vi.fn()}
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

    // Press 'c' to enter connection mode
    fireEvent.keyDown(window, { key: 'c', code: 'KeyC' });

    // HUD Banner appears announcing connection mode
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getAllByText(/User Database/i).length).toBeGreaterThanOrEqual(1);

    // Press Tab to cycle to Cache Layer
    fireEvent.keyDown(window, { key: 'Tab', code: 'Tab' });
    expect(screen.getAllByText(/Cache Layer/i).length).toBeGreaterThanOrEqual(1);

    // Press Enter to confirm connection
    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });

    expect(onConnectPorts).toHaveBeenCalledWith(n1.id, 'right', n3.id, 'left');
    // Banner dismissed
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('cancels connection mode on Escape key without creating edges', () => {
    const n1 = createNode('developer', { title: 'Source Node' });
    const n2 = createNode('developer', { title: 'Target Node' });
    const onConnectPorts = vi.fn();

    render(
      <CanvasViewport
        nodes={[n1, n2]}
        edges={[]}
        viewport={defaultViewport}
        selectedNodeIds={[n1.id]}
        selectedEdgeId={null}
        snapToGrid={false}
        onUpdateViewport={vi.fn()}
        onSelectNode={vi.fn()}
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

    fireEvent.keyDown(window, { key: 'c' });
    expect(screen.getByRole('status')).toBeDefined();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onConnectPorts).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
