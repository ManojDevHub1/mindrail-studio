import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNode, createProject } from '../../domain/factories';
import { CanvasViewport } from '../../canvas/CanvasViewport';
import { SettingsView } from '../views/SettingsView';
import { ToastProvider } from '../../design-system/components/Toast';
import * as projectRepo from '../../persistence/projectRepository';

vi.mock('../../persistence/projectRepository', async () => {
  const actual = await vi.importActual<typeof projectRepo>('../../persistence/projectRepository');
  return {
    ...actual,
    listProjects: vi.fn(),
    saveProject: vi.fn(),
    clearAllData: vi.fn(),
  };
});

describe('Product Audit & Hardening Enhancements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Canvas Accessibility & Announcer', () => {
    it('renders a polite screen reader announcer and announces single node selection', async () => {
      const nodeA = createNode('developer', {
        id: 'node-audit-1',
        title: 'Authentication Service',
        position: { x: 200, y: 150 },
      });
      const nodeB = createNode('developer', {
        id: 'node-audit-2',
        title: 'PostgreSQL DB',
        position: { x: 500, y: 150 },
      });

      const onSelectNode = vi.fn();
      const onSelectNodes = vi.fn();

      render(
        <CanvasViewport
          nodes={[nodeA, nodeB]}
          edges={[]}
          viewport={{ x: 0, y: 0, zoom: 1 }}
          selectedNodeId={null}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNode={onSelectNode}
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

      const announcer = document.getElementById('canvas-status-announcer');
      expect(announcer).not.toBeNull();
      expect(announcer?.getAttribute('aria-live')).toBe('polite');

      // Click Node A card to select it
      const nodeCard = screen.getByText('Authentication Service');
      fireEvent.click(nodeCard);

      expect(onSelectNode).toHaveBeenCalledWith('node-audit-1');
    });

    it('announces keyboard arrow movements when selected nodes are moved', async () => {
      const node = createNode('developer', {
        id: 'node-move-1',
        title: 'Queue Worker',
        position: { x: 100, y: 100 },
        locked: false,
      });

      const onMoveNodesCommit = vi.fn();

      render(
        <CanvasViewport
          nodes={[node]}
          edges={[]}
          viewport={{ x: 0, y: 0, zoom: 1 }}
          selectedNodeId="node-move-1"
          selectedNodeIds={['node-move-1']}
          selectedEdgeId={null}
          snapToGrid={false}
          onUpdateViewport={vi.fn()}
          onSelectNode={vi.fn()}
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

      // Press ArrowRight to nudge node
      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(onMoveNodesCommit).toHaveBeenCalledWith([
        {
          nodeId: 'node-move-1',
          position: { x: 116, y: 100 },
        },
      ]);

      const announcer = document.getElementById('canvas-status-announcer');
      expect(announcer?.textContent).toContain('Moved Queue Worker to position 116, 100');
    });
  });

  describe('Settings & Backup Archive Management', () => {
    it('renders project count, storage metrics and backup restore button', async () => {
      const p1 = createProject('developer', { title: 'Audit Test Architecture' });
      vi.mocked(projectRepo.listProjects).mockResolvedValue([p1]);

      render(
        <ToastProvider>
          <SettingsView />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Local Projects')).toBeDefined();
      });

      expect(screen.getByText('Export All Projects Backup (.json)')).toBeDefined();
      expect(screen.getByText('Restore Backup Archive (.json)')).toBeDefined();
      expect(screen.getByText('Clear All Local Studio Data')).toBeDefined();
    });
  });
});
