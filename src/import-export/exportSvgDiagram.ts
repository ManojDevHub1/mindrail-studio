/**
 * Standalone SVG Architecture & Canvas Diagram Exporter.
 * Conforms to docs/IMPORT_EXPORT_SPEC.md section 6 and Phase 5 Feature A.
 */
import type {
  CanvasNode,
  NodeColorToken,
  PortSide,
  Project,
} from '../domain/models';
import { slugifyTitle } from './exportProjectJson';

/** Safe XML escaping utility */
export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const COLOR_ACCENTS: Record<NodeColorToken, string> = {
  neutral: '#7E8BA6',
  blue: '#5E9EFF',
  purple: '#A855F7',
  cyan: '#06B6D4',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  orange: '#F97316',
};

export interface DiagramBounds {
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Calculates tight content bounds encompassing all nodes with padding.
 */
export function calculateDiagramBounds(
  nodes: readonly CanvasNode[],
  padding = 64
): DiagramBounds {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, width: 800, height: 500 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const x1 = node.position.x;
    const y1 = node.position.y;
    const x2 = x1 + node.dimensions.width;
    const y2 = y1 + node.dimensions.height;

    if (x1 < minX) minX = x1;
    if (y1 < minY) minY = y1;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  }

  const width = Math.max(200, maxX - minX + padding * 2);
  const height = Math.max(160, maxY - minY + padding * 2);

  return {
    minX: minX - padding,
    minY: minY - padding,
    width,
    height,
  };
}

function getPortCoordinate(
  node: CanvasNode,
  port: PortSide
): { x: number; y: number } {
  const { x, y } = node.position;
  const { width, height } = node.dimensions;

  switch (port) {
    case 'top':
      return { x: x + width / 2, y };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
    case 'right':
      return { x: x + width, y: y + height / 2 };
  }
}

export function generateSvgPath(
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

  // Smooth Bezier
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

/**
 * Extracts a concise single-line description of the node payload for standalone export.
 */
function getNodePayloadSummary(node: CanvasNode): string {
  const p = node.payload;
  if (p.kind === 'dev-architecture') {
    const stack = p.techStack ? ` • ${p.techStack}` : '';
    return `${p.componentKind.toUpperCase()}${stack} (${p.status})`;
  }
  if (p.kind === 'dev-code-snippet') {
    return `Snippet: ${p.language || 'code'} (${p.filePathHint || 'inline'})`;
  }
  if (p.kind === 'dev-task') {
    return `${p.issueType.toUpperCase()} • ${p.priority} • ${p.status}`;
  }
  if (p.kind === 'video-scene') {
    return `Scene ${p.sceneNumber} • ${p.durationSeconds}s • ${p.framing} (${p.productionStatus})`;
  }
  if (p.kind === 'student-concept') {
    return `Concept • ${p.mastery.toUpperCase()}${p.keyTerms.length ? ` • ${p.keyTerms.length} terms` : ''}`;
  }
  if (p.kind === 'student-flashcard') {
    return `Flashcard • ${p.frontPrompt || 'Recall item'}`;
  }
  return node.description || '';
}

/**
 * Generates canonical standalone SVG document markup from a Project model.
 */
export function exportSvgDiagram(project: Project): string {
  const bounds = calculateDiagramBounds(project.nodes, 64);
  const nodeMap = new Map<string, CanvasNode>(project.nodes.map((n) => [n.id, n]));

  const lines: string[] = [];

  // SVG root
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}" width="${bounds.width}" height="${bounds.height}">`
  );

  // Embedded dark-theme stylesheet
  lines.push('  <style>');
  lines.push('    .diagram-bg { fill: #0d1117; }');
  lines.push('    .node-card { fill: #161b22; stroke: #30363d; stroke-width: 1.5; rx: 8px; ry: 8px; }');
  lines.push('    .node-title { fill: #e6edf3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; }');
  lines.push('    .node-category { fill: #7e8ba6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }');
  lines.push('    .node-summary { fill: #8b949e; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 11px; }');
  lines.push('    .edge-path { fill: none; stroke: #5e9eff; stroke-width: 2; }');
  lines.push('    .edge-label-bg { fill: #161b22; stroke: #30363d; stroke-width: 1; rx: 4px; ry: 4px; }');
  lines.push('    .edge-label-text { fill: #e6edf3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 500; text-anchor: middle; dominant-baseline: middle; }');
  lines.push('    .project-header { fill: #7e8ba6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px; }');
  lines.push('  </style>');

  // Defs & Arrowheads
  lines.push('  <defs>');
  lines.push('    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">');
  lines.push('      <path d="M 0 1 L 10 5 L 0 9 z" fill="#5e9eff" />');
  lines.push('    </marker>');
  lines.push('  </defs>');

  // Background
  lines.push(
    `  <rect x="${bounds.minX}" y="${bounds.minY}" width="${bounds.width}" height="${bounds.height}" class="diagram-bg" />`
  );

  // Diagram Title Header
  lines.push(
    `  <text x="${bounds.minX + 24}" y="${bounds.minY + 28}" class="project-header">${escapeXml(project.title)} &bull; ${escapeXml(project.workspaceType.toUpperCase())} ARCHITECTURE</text>`
  );

  // If no nodes, draw empty state note
  if (project.nodes.length === 0) {
    lines.push(
      `  <text x="${bounds.minX + bounds.width / 2}" y="${bounds.minY + bounds.height / 2}" text-anchor="middle" fill="#7e8ba6" font-family="sans-serif" font-size="14">Empty Project Canvas</text>`
    );
    lines.push('</svg>');
    return lines.join('\n');
  }

  // Draw Edges Layer
  lines.push('  <!-- Connections Layer -->');
  lines.push('  <g class="edges-layer">');
  for (const edge of project.edges) {
    const sourceNode = nodeMap.get(edge.sourceNodeId);
    const targetNode = nodeMap.get(edge.targetNodeId);
    if (!sourceNode || !targetNode) continue;

    const sourceCoord = getPortCoordinate(sourceNode, edge.sourcePort);
    const targetCoord = getPortCoordinate(targetNode, edge.targetPort);

    const d = generateSvgPath(
      sourceCoord,
      targetCoord,
      edge.routingStyle,
      edge.sourcePort,
      edge.targetPort
    );

    let dashAttr = '';
    if (edge.strokePattern === 'dashed') dashAttr = ' stroke-dasharray="6,4"';
    else if (edge.strokePattern === 'dotted') dashAttr = ' stroke-dasharray="2,4"';

    const strokeColor = edge.colorToken ? COLOR_ACCENTS[edge.colorToken] : '#5e9eff';
    const markerAttr = edge.directed !== false ? ' marker-end="url(#arrow)"' : '';

    lines.push(
      `    <path d="${d}" class="edge-path" stroke="${strokeColor}"${dashAttr}${markerAttr} />`
    );

    // Edge Label
    if (edge.label && edge.label.trim()) {
      const midX = (sourceCoord.x + targetCoord.x) / 2;
      const midY = (sourceCoord.y + targetCoord.y) / 2;
      const escapedLabel = escapeXml(edge.label.trim());
      const labelWidth = Math.max(40, edge.label.length * 7 + 16);

      lines.push(
        `    <rect x="${midX - labelWidth / 2}" y="${midY - 10}" width="${labelWidth}" height="20" class="edge-label-bg" />`
      );
      lines.push(
        `    <text x="${midX}" y="${midY + 1}" class="edge-label-text">${escapedLabel}</text>`
      );
    }
  }
  lines.push('  </g>');

  // Draw Nodes Layer
  lines.push('  <!-- Nodes Layer -->');
  lines.push('  <g class="nodes-layer">');
  for (const node of project.nodes) {
    const x = node.position.x;
    const y = node.position.y;
    const w = node.dimensions.width;
    const h = node.dimensions.height;
    const accentColor = COLOR_ACCENTS[node.colorToken] || '#7E8BA6';
    const escapedTitle = escapeXml(node.title);
    const escapedCategory = escapeXml(node.category || node.payload.kind);
    const summary = escapeXml(getNodePayloadSummary(node));

    lines.push(`    <g id="export-node-${node.id}">`);
    // Main card box
    lines.push(`      <rect x="${x}" y="${y}" width="${w}" height="${h}" class="node-card" />`);
    // Accent top stripe
    lines.push(
      `      <rect x="${x}" y="${y}" width="${w}" height="4" fill="${accentColor}" rx="2" ry="2" />`
    );
    // Node Category
    lines.push(`      <text x="${x + 14}" y="${y + 24}" class="node-category">${escapedCategory}</text>`);
    // Node Title
    lines.push(`      <text x="${x + 14}" y="${y + 44}" class="node-title">${escapedTitle}</text>`);
    // Divider line
    lines.push(
      `      <line x1="${x + 14}" y1="${y + 54}" x2="${x + w - 14}" y2="${y + 54}" stroke="#30363d" stroke-width="1" />`
    );
    // Node Payload Summary
    lines.push(
      `      <text x="${x + 14}" y="${y + 74}" class="node-summary">${summary}</text>`
    );
    lines.push('    </g>');
  }
  lines.push('  </g>');

  lines.push('</svg>');
  return lines.join('\n');
}

/**
 * Triggers native browser download of the standalone SVG diagram.
 */
export function downloadSvgFile(project: Project): string {
  const svgContent = exportSvgDiagram(project);
  const slug = slugifyTitle(project.title);
  const filename = `${slug}-architecture.svg`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return filename;
}
