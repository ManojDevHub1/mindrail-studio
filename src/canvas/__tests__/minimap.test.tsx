import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createNode } from '../../domain/factories';
import { CanvasMinimap } from '../CanvasMinimap';

describe('Phase 2 Canvas: Interactive Minimap', () => {
  it('renders nodes and viewport frame inside minimap', () => {
    const n1 = createNode('developer', { title: 'Node 1', position: { x: 100, y: 100 } });
    const n2 = createNode('developer', { title: 'Node 2', position: { x: 500, y: 300 } });

    render(
      <CanvasMinimap
        nodes={[n1, n2]}
        viewport={{ x: 0, y: 0, zoom: 1 }}
        containerDimensions={{ width: 1200, height: 800 }}
        selectedNodeIds={[n1.id]}
        onUpdateViewport={vi.fn()}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const minimap = screen.getByRole('region', { name: /canvas overview minimap/i });
    expect(minimap).toBeDefined();

    const svg = screen.getByTestId('minimap-stage');
    expect(svg).toBeDefined();

    // 2 node rects + 1 viewport camera frame rect = 3 rects
    const rects = svg.querySelectorAll('rect');
    expect(rects.length).toBe(3);
  });

  it('updates viewport when clicking on minimap', () => {
    const n1 = createNode('developer', { title: 'Node 1', position: { x: 100, y: 100 } });
    const onUpdateViewport = vi.fn();

    render(
      <CanvasMinimap
        nodes={[n1]}
        viewport={{ x: 0, y: 0, zoom: 1 }}
        containerDimensions={{ width: 1200, height: 800 }}
        selectedNodeIds={[]}
        onUpdateViewport={onUpdateViewport}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const svg = screen.getByTestId('minimap-stage');

    // Mock bounding client rect for test SVG
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 1000,
      top: 600,
      right: 1200,
      bottom: 730,
      width: 200,
      height: 130,
      x: 1000,
      y: 600,
      toJSON: () => {},
    });

    fireEvent.pointerDown(svg, { clientX: 1100, clientY: 665, button: 0 });

    expect(onUpdateViewport).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <CanvasMinimap
        nodes={[]}
        viewport={{ x: 0, y: 0, zoom: 1 }}
        containerDimensions={{ width: 1200, height: 800 }}
        onUpdateViewport={vi.fn()}
        isOpen={true}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByLabelText('Close minimap');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
