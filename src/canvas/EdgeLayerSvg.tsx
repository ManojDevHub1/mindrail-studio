/**
 * SVG Edge Layer rendering connections between canvas nodes.
 */
import React from 'react';
import type {
  CanvasDimensions,
  CanvasEdge,
  CanvasPosition,
  EntityId,
  PortSide,
} from '../domain/models';
import styles from './EdgeLayerSvg.module.css';

export interface EdgeLayerProps {
  edges: readonly CanvasEdge[];
  nodesMap: ReadonlyMap<EntityId, { position: CanvasPosition; dimensions: CanvasDimensions; title?: string }>;
  selectedEdgeId?: EntityId | null;
  onSelectEdge?: (edgeId: EntityId) => void;
  onContextMenuEdge?: (edgeId: EntityId, e: React.MouseEvent) => void;
}

export function getPortCoordinate(
  position: CanvasPosition,
  dimensions: CanvasDimensions,
  port: PortSide
): { x: number; y: number } {
  switch (port) {
    case 'top':
      return { x: position.x + dimensions.width / 2, y: position.y };
    case 'bottom':
      return { x: position.x + dimensions.width / 2, y: position.y + dimensions.height };
    case 'left':
      return { x: position.x, y: position.y + dimensions.height / 2 };
    case 'right':
      return { x: position.x + dimensions.width, y: position.y + dimensions.height / 2 };
  }
}

export function generatePathData(
  source: { x: number; y: number },
  target: { x: number; y: number },
  routingStyle: 'bezier' | 'orthogonal' | 'straight' = 'bezier',
  sourcePort: PortSide = 'right',
  targetPort: PortSide = 'left'
): string {
  if (routingStyle === 'straight') {
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }

  if (routingStyle === 'orthogonal') {
    const midX = (source.x + target.x) / 2;
    return `M ${source.x} ${source.y} L ${midX} ${source.y} L ${midX} ${target.y} L ${target.x} ${target.y}`;
  }

  // Smooth Bezier Curve with port-direction awareness
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  const curvature = Math.max(40, Math.min(180, distance * 0.45));

  let cp1x = source.x;
  let cp1y = source.y;
  let cp2x = target.x;
  let cp2y = target.y;

  if (sourcePort === 'right') cp1x += curvature;
  else if (sourcePort === 'left') cp1x -= curvature;
  else if (sourcePort === 'bottom') cp1y += curvature;
  else if (sourcePort === 'top') cp1y -= curvature;

  if (targetPort === 'right') cp2x += curvature;
  else if (targetPort === 'left') cp2x -= curvature;
  else if (targetPort === 'bottom') cp2y += curvature;
  else if (targetPort === 'top') cp2y -= curvature;

  return `M ${source.x} ${source.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${target.x} ${target.y}`;
}

export const EdgeLayerSvg: React.FC<EdgeLayerProps> = React.memo(
  ({ edges, nodesMap, selectedEdgeId, onSelectEdge, onContextMenuEdge }) => {
    return (
      <svg className={styles.svgLayer} aria-hidden="true">
        <defs>
          <marker
            id="arrowhead-default"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--mr-border-strong)" />
          </marker>
          <marker
            id="arrowhead-selected"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--mr-accent-primary)" />
          </marker>
        </defs>

        {edges.map((edge) => {
          const sourceNode = nodesMap.get(edge.sourceNodeId);
          const targetNode = nodesMap.get(edge.targetNodeId);

          if (!sourceNode || !targetNode) return null;

          const sourceCoord = getPortCoordinate(sourceNode.position, sourceNode.dimensions, edge.sourcePort);
          const targetCoord = getPortCoordinate(targetNode.position, targetNode.dimensions, edge.targetPort);

          const pathD = generatePathData(
            sourceCoord,
            targetCoord,
            edge.routingStyle,
            edge.sourcePort,
            edge.targetPort
          );

          const isSelected = selectedEdgeId === edge.id;
          const midX = (sourceCoord.x + targetCoord.x) / 2;
          const midY = (sourceCoord.y + targetCoord.y) / 2;

          let strokeDasharray = undefined;
          if (edge.strokePattern === 'dashed') strokeDasharray = '6,4';
          else if (edge.strokePattern === 'dotted') strokeDasharray = '2,4';

          const edgeAriaLabel = `Connection from ${sourceNode.title || 'Source'} (${edge.sourcePort} port) to ${
            targetNode.title || 'Target'
          } (${edge.targetPort} port), ${isSelected ? 'selected' : 'unselected'}`;

          return (
            <g
              key={edge.id}
              data-edge-group="true"
              data-edge-id={edge.id}
              tabIndex={0}
              role="button"
              aria-label={edgeAriaLabel}
              className={`${styles.edgeGroup} ${isSelected ? styles.edgeSelected : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEdge?.(edge.id);
              }}
              onPointerDown={(e) => {
                // Prevent bubbling to canvas background panning or marquee selection
                e.stopPropagation();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectEdge?.(edge.id);
                onContextMenuEdge?.(edge.id, e);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSelectEdge?.(edge.id);
                }
              }}
            >
              {/* Subtle halo when selected */}
              {isSelected && (
                <path
                  d={pathD}
                  className={styles.edgeSelectionHalo}
                  aria-hidden="true"
                />
              )}

              {/* Generous transparent hit area (24px) for reliable click/tap across all routing types */}
              <path
                d={pathD}
                data-edge-hit-area="true"
                data-edge-id={edge.id}
                className={styles.edgeHitArea}
              />

              {/* Visible edge line */}
              <path
                d={pathD}
                data-edge-id={edge.id}
                className={styles.edgePath}
                strokeDasharray={strokeDasharray}
                markerEnd={
                  edge.directed !== false
                    ? isSelected
                      ? 'url(#arrowhead-selected)'
                      : 'url(#arrowhead-default)'
                    : undefined
                }
              />

              {/* Edge label pill if present */}
              {edge.label && (
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x={-((edge.label.length * 7 + 16) / 2)}
                    y={-11}
                    width={edge.label.length * 7 + 16}
                    height={22}
                    className={styles.edgeLabelBackground}
                  />
                  <text y={4} className={styles.edgeLabel}>
                    {edge.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    );
  }
);

EdgeLayerSvg.displayName = 'EdgeLayerSvg';
