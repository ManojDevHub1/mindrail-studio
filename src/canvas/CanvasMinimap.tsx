/**
 * Canvas Minimap component with real-time viewport tracking and click/drag navigation.
 * Conforms to docs/DESIGN_SYSTEM.md and Phase 2 Feature E specifications.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { CanvasNode, EntityId, NodeColorToken, ViewportState } from '../domain/models';
import { Button } from '../design-system/components/Button';
import { CloseIcon, MapIcon } from '../design-system/components/Icons';
import styles from './CanvasMinimap.module.css';

export interface CanvasMinimapProps {
  nodes: readonly CanvasNode[];
  viewport: ViewportState;
  containerDimensions: { width: number; height: number };
  selectedNodeIds?: readonly EntityId[];
  onUpdateViewport: (vp: ViewportState) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 130;
const PADDING = 120;

const COLOR_MAP: Record<NodeColorToken, string> = {
  neutral: '#7E8BA6',
  blue: '#5E9EFF',
  purple: '#A855F7',
  cyan: '#06B6D4',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  orange: '#F97316',
};

export const CanvasMinimap: React.FC<CanvasMinimapProps> = ({
  nodes,
  viewport,
  containerDimensions,
  selectedNodeIds = [],
  onUpdateViewport,
  isOpen,
  onClose,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isNavigatingRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);

  // World dimensions calculation
  const { minX, minY, scale, offsetX, offsetY, vpBox } = useMemo(() => {
    const vpW = Math.max(100, containerDimensions.width);
    const vpH = Math.max(100, containerDimensions.height);

    const vpLeft = -viewport.x / viewport.zoom;
    const vpTop = -viewport.y / viewport.zoom;
    const vpRight = (vpW - viewport.x) / viewport.zoom;
    const vpBottom = (vpH - viewport.y) / viewport.zoom;

    let worldMinX = vpLeft;
    let worldMinY = vpTop;
    let worldMaxX = vpRight;
    let worldMaxY = vpBottom;

    if (nodes.length > 0) {
      for (const node of nodes) {
        worldMinX = Math.min(worldMinX, node.position.x);
        worldMinY = Math.min(worldMinY, node.position.y);
        worldMaxX = Math.max(worldMaxX, node.position.x + node.dimensions.width);
        worldMaxY = Math.max(worldMaxY, node.position.y + node.dimensions.height);
      }
    } else {
      worldMinX = Math.min(worldMinX, -400);
      worldMinY = Math.min(worldMinY, -300);
      worldMaxX = Math.max(worldMaxX, 400);
      worldMaxY = Math.max(worldMaxY, 300);
    }

    worldMinX -= PADDING;
    worldMinY -= PADDING;
    worldMaxX += PADDING;
    worldMaxY += PADDING;

    const worldW = Math.max(200, worldMaxX - worldMinX);
    const worldH = Math.max(150, worldMaxY - worldMinY);

    const s = Math.min(MINIMAP_WIDTH / worldW, MINIMAP_HEIGHT / worldH);
    const ox = (MINIMAP_WIDTH - worldW * s) / 2;
    const oy = (MINIMAP_HEIGHT - worldH * s) / 2;

    const vpBoxRect = {
      x: ox + (vpLeft - worldMinX) * s,
      y: oy + (vpTop - worldMinY) * s,
      width: Math.max(8, (vpRight - vpLeft) * s),
      height: Math.max(6, (vpBottom - vpTop) * s),
    };

    return {
      minX: worldMinX,
      minY: worldMinY,
      scale: s,
      offsetX: ox,
      offsetY: oy,
      vpBox: vpBoxRect,
    };
  }, [nodes, viewport, containerDimensions]);

  // Center camera on minimap point
  const navigateToMinimapPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clickMx = clientX - rect.left;
      const clickMy = clientY - rect.top;

      // Inverse map from minimap to world
      const worldX = minX + (clickMx - offsetX) / scale;
      const worldY = minY + (clickMy - offsetY) / scale;

      const vpW = Math.max(100, containerDimensions.width);
      const vpH = Math.max(100, containerDimensions.height);

      const targetViewportX = Math.round(vpW / 2 - worldX * viewport.zoom);
      const targetViewportY = Math.round(vpH / 2 - worldY * viewport.zoom);

      onUpdateViewport({
        ...viewport,
        x: targetViewportX,
        y: targetViewportY,
      });
    },
    [minX, minY, offsetX, offsetY, scale, containerDimensions, viewport, onUpdateViewport]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isNavigatingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    navigateToMinimapPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isNavigatingRef.current) return;
    e.stopPropagation();
    navigateToMinimapPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.minimapContainer}
      role="region"
      aria-label="Canvas overview minimap"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapIcon size={12} />
          <span className={styles.title}>Minimap</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close minimap"
          icon={<CloseIcon size={12} />}
        />
      </div>

      <svg
        ref={svgRef}
        data-testid="minimap-stage"
        className={styles.svgStage}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Nodes Layer */}
        {nodes.map((node) => {
          const nx = offsetX + (node.position.x - minX) * scale;
          const ny = offsetY + (node.position.y - minY) * scale;
          const nw = Math.max(3, node.dimensions.width * scale);
          const nh = Math.max(2, node.dimensions.height * scale);
          const isSelected = selectedSet.has(node.id);

          return (
            <rect
              key={node.id}
              x={nx}
              y={ny}
              width={nw}
              height={nh}
              fill={COLOR_MAP[node.colorToken] || '#7E8BA6'}
              className={`${styles.nodeRect} ${isSelected ? styles.selectedNodeRect : ''}`}
            />
          );
        })}

        {/* Viewport Camera Frame */}
        <rect
          x={vpBox.x}
          y={vpBox.y}
          width={vpBox.width}
          height={vpBox.height}
          rx={2}
          ry={2}
          className={styles.viewportIndicator}
          style={{
            fill: isHovered ? 'rgba(94, 158, 255, 0.25)' : 'rgba(94, 158, 255, 0.16)',
          }}
        />
      </svg>
    </div>
  );
};
