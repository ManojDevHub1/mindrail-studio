/**
 * Template Structure Preview Component.
 * Renders an accurate, lightweight, vector SVG schematic of a template's node layout
 * and directed connections. Conforms to docs/DESIGN_SYSTEM.md and Phase 7 requirements.
 */
import React, { useId } from 'react';
import type { CanvasEdge, CanvasNode, NodeColorToken } from '../../domain/models';
import { getPortCoordinate } from '../../canvas/EdgeLayerSvg';

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

export interface TemplateStructurePreviewProps {
  nodes: readonly CanvasNode[];
  edges: readonly CanvasEdge[];
  height?: number;
  className?: string;
}

export const TemplateStructurePreview: React.FC<TemplateStructurePreviewProps> = ({
  nodes,
  edges,
  height = 110,
  className,
}) => {
  const markerId = useId().replace(/:/g, '');

  if (nodes.length === 0) {
    return null;
  }

  // Calculate bounding box across all nodes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.y < minY) minY = n.position.y;
    const right = n.position.x + (n.dimensions?.width || 220);
    const bottom = n.position.y + (n.dimensions?.height || 120);
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  const pad = 24;
  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = Math.max(maxX - minX + pad * 2, 80);
  const vbH = Math.max(maxY - minY + pad * 2, 60);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height,
        borderRadius: 'var(--mr-radius-md, 8px)',
        backgroundColor: 'var(--mr-bg-canvas, #0B0E14)',
        border: '1px solid var(--mr-border-subtle, rgba(255, 255, 255, 0.08))',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        style={{ width: '100%', height: '100%', display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Schematic layout of template nodes and connections"
      >
        <defs>
          <marker
            id={`arrow-${markerId}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(94, 158, 255, 0.6)" />
          </marker>
        </defs>

        {/* Connections Layer */}
        {edges.map((edge) => {
          const s = nodeMap.get(edge.sourceNodeId);
          const t = nodeMap.get(edge.targetNodeId);
          if (!s || !t) return null;

          const sCoord = getPortCoordinate(
            s.position,
            s.dimensions || { width: 220, height: 120 },
            edge.sourcePort || 'right'
          );
          const tCoord = getPortCoordinate(
            t.position,
            t.dimensions || { width: 220, height: 120 },
            edge.targetPort || 'left'
          );

          // Quadratic or cubic curve
          const dx = tCoord.x - sCoord.x;
          const cx1 = sCoord.x + dx * 0.4;
          const cy1 = sCoord.y;
          const cx2 = sCoord.x + dx * 0.6;
          const cy2 = tCoord.y;
          const d = `M ${sCoord.x} ${sCoord.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tCoord.x} ${tCoord.y}`;

          return (
            <path
              key={edge.id}
              d={d}
              fill="none"
              stroke="rgba(94, 158, 255, 0.4)"
              strokeWidth="2"
              strokeDasharray={
                edge.strokePattern === 'dashed'
                  ? '6 4'
                  : edge.strokePattern === 'dotted'
                  ? '2 4'
                  : undefined
              }
              markerEnd={`url(#arrow-${markerId})`}
            />
          );
        })}

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const width = node.dimensions?.width || 220;
          const height = node.dimensions?.height || 120;
          const color = COLOR_MAP[node.colorToken] || '#5E9EFF';
          const title = node.title || 'Node';

          return (
            <g
              key={node.id}
              role="graphics-symbol"
              aria-label={title}
              data-node-title={title}
            >
              {/* Card Background */}
              <rect
                x={node.position.x}
                y={node.position.y}
                width={width}
                height={height}
                rx={6}
                fill="var(--mr-bg-surface-2, #141824)"
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.65}
              />
              {/* Top Accent Header Strip */}
              <rect
                x={node.position.x}
                y={node.position.y}
                width={width}
                height={5}
                rx={2.5}
                fill={color}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
