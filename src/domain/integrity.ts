/**
 * Referential integrity checks and sanitation functions.
 * Conforms to docs/DATA_MODEL.md section 6.
 */
import type { CanvasEdge, CanvasNode, EntityId, Project } from './models';

export interface IntegrityValidationIssue {
  readonly code:
    | 'DUPLICATE_NODE_ID'
    | 'DUPLICATE_EDGE_ID'
    | 'SELF_LOOP_EDGE'
    | 'DUPLICATE_EDGE'
    | 'DANGLING_EDGE_SOURCE'
    | 'DANGLING_EDGE_TARGET'
    | 'INVALID_COORDINATES'
    | 'INVALID_DIMENSIONS'
    | 'INVALID_ZOOM';
  readonly message: string;
  readonly entityId?: EntityId;
}

export interface IntegrityValidationResult {
  readonly isValid: boolean;
  readonly issues: readonly IntegrityValidationIssue[];
}

/**
 * Validates full referential integrity of a Project record.
 */
export function validateProjectIntegrity(project: Project): IntegrityValidationResult {
  const issues: IntegrityValidationIssue[] = [];

  // 1. Check unique node IDs
  const nodeIds = new Set<EntityId>();
  for (const node of project.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push({
        code: 'DUPLICATE_NODE_ID',
        message: `Duplicate node ID detected: "${node.id}"`,
        entityId: node.id,
      });
    } else {
      nodeIds.add(node.id);
    }

    // Coordinate & dimension bounds
    if (
      !Number.isFinite(node.position.x) ||
      !Number.isFinite(node.position.y) ||
      node.position.x < -100_000 ||
      node.position.x > 100_000 ||
      node.position.y < -100_000 ||
      node.position.y > 100_000
    ) {
      issues.push({
        code: 'INVALID_COORDINATES',
        message: `Node "${node.id}" has out-of-bounds coordinates (${node.position.x}, ${node.position.y})`,
        entityId: node.id,
      });
    }

    if (
      !Number.isFinite(node.dimensions.width) ||
      !Number.isFinite(node.dimensions.height) ||
      node.dimensions.width < 120 ||
      node.dimensions.width > 2400 ||
      node.dimensions.height < 60 ||
      node.dimensions.height > 2400
    ) {
      issues.push({
        code: 'INVALID_DIMENSIONS',
        message: `Node "${node.id}" has out-of-bounds dimensions (${node.dimensions.width}x${node.dimensions.height})`,
        entityId: node.id,
      });
    }
  }

  // 2. Check viewport zoom
  if (
    !Number.isFinite(project.viewport.zoom) ||
    project.viewport.zoom < 0.15 ||
    project.viewport.zoom > 3.0
  ) {
    issues.push({
      code: 'INVALID_ZOOM',
      message: `Viewport zoom ${project.viewport.zoom} is out of allowable range [0.15, 3.0]`,
    });
  }

  // 3. Check edges: unique IDs, self-loops, duplicate edges, endpoints
  const edgeIds = new Set<EntityId>();
  const edgeTuples = new Set<string>();

  for (const edge of project.edges) {
    if (edgeIds.has(edge.id)) {
      issues.push({
        code: 'DUPLICATE_EDGE_ID',
        message: `Duplicate edge ID detected: "${edge.id}"`,
        entityId: edge.id,
      });
    } else {
      edgeIds.add(edge.id);
    }

    if (edge.sourceNodeId === edge.targetNodeId) {
      issues.push({
        code: 'SELF_LOOP_EDGE',
        message: `Self-loop edge detected on node "${edge.sourceNodeId}"`,
        entityId: edge.id,
      });
    }

    const tupleKey = `${edge.sourceNodeId}:${edge.sourcePort}->${edge.targetNodeId}:${edge.targetPort}`;
    if (edgeTuples.has(tupleKey)) {
      issues.push({
        code: 'DUPLICATE_EDGE',
        message: `Duplicate edge connection detected between identical ports: ${tupleKey}`,
        entityId: edge.id,
      });
    } else {
      edgeTuples.add(tupleKey);
    }

    if (!nodeIds.has(edge.sourceNodeId)) {
      issues.push({
        code: 'DANGLING_EDGE_SOURCE',
        message: `Edge "${edge.id}" references non-existent source node "${edge.sourceNodeId}"`,
        entityId: edge.id,
      });
    }

    if (!nodeIds.has(edge.targetNodeId)) {
      issues.push({
        code: 'DANGLING_EDGE_TARGET',
        message: `Edge "${edge.id}" references non-existent target node "${edge.targetNodeId}"`,
        entityId: edge.id,
      });
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Strips dangling and invalid edges from a project, ensuring strict referential integrity.
 */
export function sanitizeProjectEdges(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[]
): readonly CanvasEdge[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const seenTuples = new Set<string>();
  const sanitized: CanvasEdge[] = [];

  for (const edge of edges) {
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      continue;
    }
    if (edge.sourceNodeId === edge.targetNodeId) {
      continue;
    }
    const tupleKey = `${edge.sourceNodeId}:${edge.sourcePort}->${edge.targetNodeId}:${edge.targetPort}`;
    if (seenTuples.has(tupleKey)) {
      continue;
    }
    seenTuples.add(tupleKey);
    sanitized.push(edge);
  }

  return sanitized;
}

/**
 * Returns edges that connect to any of the deleted node IDs.
 */
export function pruneEdgesConnectedToNodes(
  edges: readonly CanvasEdge[],
  deletedNodeIds: ReadonlySet<EntityId>
): readonly CanvasEdge[] {
  return edges.filter(
    (edge) => !deletedNodeIds.has(edge.sourceNodeId) && !deletedNodeIds.has(edge.targetNodeId)
  );
}
