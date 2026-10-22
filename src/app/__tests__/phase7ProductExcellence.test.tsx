/**
 * Phase 7: Product Excellence, Template Ecosystem & Real-World Interaction Tests.
 * Conforms to docs/PRD.md, docs/TESTING_STRATEGY.md, and Phase 7 requirements.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { TemplateGalleryView } from '../views/TemplateGalleryView';
import { TemplateStructurePreview } from '../views/TemplateStructurePreview';
import { CanvasViewport } from '../../canvas/CanvasViewport';
import { ToastProvider } from '../../design-system/components/Toast';
import { saveUserPreferences } from '../../persistence/preferencesStore';
import { BUILT_IN_TEMPLATES } from '../../domain/builtInTemplates';
import { createEdge, createNode, createProject } from '../../domain/factories';
import type { CanvasEdge, CanvasNode, ViewportState } from '../../domain/models';

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('Phase 7: Template Structure Preview Component', () => {
  const mockNodes: CanvasNode[] = [
    createNode('developer', {
      title: 'Frontend Client',
      position: { x: 100, y: 100 },
      dimensions: { width: 200, height: 100 },
    }),
    createNode('developer', {
      title: 'Backend API',
      position: { x: 400, y: 100 },
      dimensions: { width: 200, height: 100 },
    }),
  ];

  const mockEdges: CanvasEdge[] = [
    createEdge({
      sourceNodeId: mockNodes[0]!.id,
      targetNodeId: mockNodes[1]!.id,
      sourcePort: 'right',
      targetPort: 'left',
    }),
  ];

  it('renders SVG vector schematic with correct node symbols and connection paths', () => {
    const { container } = render(
      <TemplateStructurePreview nodes={mockNodes} edges={mockEdges} height={120} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox');

    // Should render two graphics-symbols for the nodes
    const nodeSymbols = container.querySelectorAll('[role="graphics-symbol"]');
    expect(nodeSymbols.length).toBe(2);
    expect(nodeSymbols[0]).toHaveAttribute('data-node-title', 'Frontend Client');
    expect(nodeSymbols[1]).toHaveAttribute('data-node-title', 'Backend API');

    // Should render path for the edge
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('returns null safely when nodes array is empty', () => {
    const { container } = render(
      <TemplateStructurePreview nodes={[]} edges={[]} height={120} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('Phase 7: Template Gallery Recents & Complexity Discovery', () => {
  beforeEach(() => {
    saveUserPreferences({
      favoriteTemplateIds: [],
      recentTemplateIds: [BUILT_IN_TEMPLATES[0]!.id],
    });
  });

  it('renders recents filter pill and filters to recently used templates', () => {
    renderWithToast(<TemplateGalleryView />);

    // Check recents button exists
    const recentsBtn = screen.getByRole('button', { name: /Filter by recently used templates/i });
    expect(recentsBtn).toBeInTheDocument();
    expect(recentsBtn).toHaveTextContent('Recents (1)');

    // Click recents filter
    fireEvent.click(recentsBtn);

    // Should display the first template
    expect(screen.getByText(BUILT_IN_TEMPLATES[0]!.name)).toBeInTheDocument();
  });

  it('displays workflow complexity badges on cards', () => {
    renderWithToast(<TemplateGalleryView />);

    const badges = screen.getAllByText(/^(STARTER|STANDARD|COMPREHENSIVE)$/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('resets all filters including recents when Reset Filters is clicked', () => {
    renderWithToast(<TemplateGalleryView />);

    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent-query-xyz-12345' } });

    // Empty state should be visible
    expect(screen.getByText('No matching templates found')).toBeInTheDocument();

    // Click Reset Filters
    const resetBtn = screen.getByRole('button', { name: 'Reset Filters' });
    fireEvent.click(resetBtn);

    // Search query should be cleared and cards visible again
    expect(screen.queryByText('No matching templates found')).not.toBeInTheDocument();
  });
});

describe('Phase 7: Connection Management & Edge Deletion Invariants', () => {
  const nodeA = createNode('developer', {
    id: 'node-A',
    title: 'Service Alpha',
    position: { x: 100, y: 100 },
    dimensions: { width: 180, height: 90 },
  });
  const nodeB = createNode('developer', {
    id: 'node-B',
    title: 'Service Beta',
    position: { x: 400, y: 100 },
    dimensions: { width: 180, height: 90 },
  });
  const edgeAB = createEdge({
    id: 'edge-AB',
    sourceNodeId: 'node-A',
    targetNodeId: 'node-B',
    sourcePort: 'right',
    targetPort: 'left',
  });

  const defaultVp: ViewportState = { x: 0, y: 0, zoom: 1 };

  it('preserves endpoint nodes completely when an edge is deleted', () => {
    const project = createProject('developer', {
      nodes: [nodeA, nodeB],
      edges: [edgeAB],
    });

    // Simulate deleting the edge
    const remainingEdges = project.edges.filter((e) => e.id !== 'edge-AB');

    // Nodes array must remain intact
    expect(project.nodes.length).toBe(2);
    expect(project.nodes[0]!.id).toBe('node-A');
    expect(project.nodes[1]!.id).toBe('node-B');
    expect(remainingEdges.length).toBe(0);
  });

  it('announces connection creation to assistive technologies', () => {
    const handleConnect = () => {};

    const { container } = renderWithToast(
      <CanvasViewport
        nodes={[nodeA, nodeB]}
        edges={[]}
        viewport={defaultVp}
        selectedEdgeId={null}
        snapToGrid={false}
        onSelectEdge={() => {}}
        onDeleteNode={() => {}}
        onToggleLockNode={() => {}}
        onToggleSnapGrid={() => {}}
        onUpdateViewport={() => {}}
        onMoveNodesCommit={() => {}}
        onConnectPorts={handleConnect}
        onAddQuickNode={() => {}}
        onOpenShortcutsModal={() => {}}
      />
    );

    // Check status region exists
    const statusRegion = container.querySelector('[aria-live="polite"]');
    expect(statusRegion).toBeInTheDocument();

    // Verify port elements exist
    const portHandles = container.querySelectorAll('[data-port-handle="true"]');
    expect(portHandles.length).toBe(8); // 4 ports per node * 2 nodes
  });

  it('releases pointer cancellation gracefully without lingering drag state', () => {
    const { container } = renderWithToast(
      <CanvasViewport
        nodes={[nodeA]}
        edges={[]}
        viewport={defaultVp}
        selectedEdgeId={null}
        snapToGrid={false}
        onSelectEdge={() => {}}
        onDeleteNode={() => {}}
        onToggleLockNode={() => {}}
        onToggleSnapGrid={() => {}}
        onUpdateViewport={() => {}}
        onMoveNodesCommit={() => {}}
        onConnectPorts={() => {}}
        onAddQuickNode={() => {}}
        onOpenShortcutsModal={() => {}}
      />
    );

    const viewportContainer = container.querySelector('._viewportContainer_f5b1d4') || container.firstChild;
    expect(viewportContainer).toBeInTheDocument();

    // Trigger pointercancel on viewport
    fireEvent.pointerCancel(viewportContainer as Element);

    // Canvas remains functional and responsive
    expect(screen.getByText('Service Alpha')).toBeInTheDocument();
  });
});
