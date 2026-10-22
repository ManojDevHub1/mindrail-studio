/**
 * Core Shared Visual Canvas Viewport component.
 * Renders zoom/pan stage, nodes, SVG edges, marquee selection, keyboard connections,
 * and interactive canvas minimap.
 * Conforms to docs/DESIGN_SYSTEM.md, docs/STATE_MANAGEMENT.md, and Phase 2 requirements.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CanvasDimensions,
  CanvasEdge,
  CanvasNode,
  CanvasPosition,
  EntityId,
  NodeColorToken,
  PortSide,
  ViewportState,
} from '../domain/models';
import { Button } from '../design-system/components/Button';
import { PlusIcon } from '../design-system/components/Icons';
import { CanvasContextMenu } from './CanvasContextMenu';
import { EdgeContextMenu } from './EdgeContextMenu';
import { CanvasHud } from './CanvasHud';
import { CanvasMinimap } from './CanvasMinimap';
import { EdgeLayerSvg, getPortCoordinate } from './EdgeLayerSvg';
import { NodeContainer } from './NodeContainer';
import { SelectionActionBar } from './SelectionActionBar';
import styles from './CanvasViewport.module.css';

export interface CanvasViewportProps {
  nodes: readonly CanvasNode[];
  edges: readonly CanvasEdge[];
  viewport: ViewportState;
  selectedNodeId?: EntityId | null;
  selectedNodeIds?: readonly EntityId[];
  selectedEdgeId: EntityId | null;
  snapToGrid: boolean;
  gridSize?: number;
  onUpdateViewport: (vp: ViewportState) => void;
  onSelectNode?: (nodeId: EntityId | null) => void;
  onSelectNodes?: (nodeIds: readonly EntityId[]) => void;
  onSelectEdge: (edgeId: EntityId | null) => void;
  onDeleteEdge?: (edgeId: EntityId) => void;
  onUpdateEdge?: (edgeId: EntityId, updates: Partial<CanvasEdge>) => void;
  onMoveNodesCommit: (moves: Array<{ nodeId: EntityId; position: CanvasPosition }>) => void;
  onDeleteNode: (nodeId: EntityId) => void;
  onDeleteNodes?: (nodeIds: readonly EntityId[]) => void;
  onBulkRecolorNodes?: (nodeIds: readonly EntityId[], colorToken: NodeColorToken) => void;
  onToggleLockNode: (nodeId: EntityId) => void;
  onDuplicateNode?: (nodeId: EntityId) => void;
  onConnectPorts: (
    sourceNodeId: EntityId,
    sourcePort: PortSide,
    targetNodeId: EntityId,
    targetPort: PortSide
  ) => void;
  onAddQuickNode: () => void;
  onOpenShortcutsModal: () => void;
  onToggleSnapGrid: () => void;
}

export function CanvasViewport({
  nodes,
  edges,
  viewport,
  selectedNodeId,
  selectedNodeIds,
  selectedEdgeId,
  snapToGrid,
  gridSize = 16,
  onUpdateViewport,
  onSelectNode,
  onSelectNodes,
  onSelectEdge,
  onDeleteEdge,
  onUpdateEdge,
  onMoveNodesCommit,
  onDeleteNode,
  onDeleteNodes,
  onBulkRecolorNodes,
  onToggleLockNode,
  onDuplicateNode,
  onConnectPorts,
  onAddQuickNode,
  onOpenShortcutsModal,
  onToggleSnapGrid,
}: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalizing selection IDs
  const effectiveSelectedIds = useMemo(() => {
    if (selectedNodeIds !== undefined) return selectedNodeIds;
    if (selectedNodeId) return [selectedNodeId];
    return [];
  }, [selectedNodeIds, selectedNodeId]);

  const selectedSet = useMemo(() => new Set(effectiveSelectedIds), [effectiveSelectedIds]);
  const [statusAnnouncement, setStatusAnnouncement] = useState<string>('');
  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    edgeId: EntityId;
    x: number;
    y: number;
  } | null>(null);

  const setSelectedNodes = useCallback(
    (newIds: readonly EntityId[]) => {
      if (onSelectNodes) {
        onSelectNodes(newIds);
      }
      if (onSelectNode) {
        onSelectNode(newIds.length === 1 ? newIds[0] ?? null : null);
      }
      if (newIds.length === 1) {
        const found = nodes.find((n) => n.id === newIds[0]);
        if (found) {
          setStatusAnnouncement(`Selected node: ${found.title}. Position: ${found.position.x}, ${found.position.y}.`);
        }
      } else if (newIds.length > 1) {
        setStatusAnnouncement(`${newIds.length} nodes selected.`);
      } else if (effectiveSelectedIds.length > 0) {
        setStatusAnnouncement('Selection cleared.');
      }
    },
    [onSelectNodes, onSelectNode, nodes, effectiveSelectedIds.length]
  );

  const handleSelectEdgeInternal = useCallback(
    (edgeId: EntityId | null, skipAnnouncement = false) => {
      onSelectEdge(edgeId);
      if (edgeId) {
        setSelectedNodes([]);
        const edge = edges.find((e) => e.id === edgeId);
        if (edge) {
          const sNode = nodes.find((n) => n.id === edge.sourceNodeId);
          const tNode = nodes.find((n) => n.id === edge.targetNodeId);
          setStatusAnnouncement(
            `Selected connection from ${sNode?.title || 'source'} to ${tNode?.title || 'target'}.`
          );
        }
      } else if (!skipAnnouncement) {
        setStatusAnnouncement('Connection deselected.');
      }
    },
    [edges, nodes, onSelectEdge, setSelectedNodes]
  );

  const handleEdgeContextMenu = useCallback(
    (edgeId: EntityId, e: React.MouseEvent) => {
      handleSelectEdgeInternal(edgeId);
      setContextMenu(null);
      setEdgeContextMenu({
        edgeId,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [handleSelectEdgeInternal]
  );

  // Container dimensions observer for minimap & viewport calculations
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  // Minimap visibility
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);

  // Visual grid pattern visibility
  const [isGridVisible, setIsGridVisible] = useState(snapToGrid ?? true);

  // Custom Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    nodeId: EntityId;
    x: number;
    y: number;
  } | null>(null);

  // Auto-dismiss context menu if node is removed
  useEffect(() => {
    if (contextMenu && !nodes.some((n) => n.id === contextMenu.nodeId)) {
      setContextMenu(null);
    }
  }, [contextMenu, nodes]);

  const handleNodeContextMenu = useCallback(
    (nodeId: EntityId, e: React.MouseEvent) => {
      if (!selectedSet.has(nodeId)) {
        setSelectedNodes([nodeId]);
        onSelectEdge(null);
      }
      setContextMenu({
        nodeId,
        x: e.clientX,
        y: e.clientY,
      });
      pendingNodeInteractionRef.current = null;
      setDraggingNodeId(null);
      setConnectionDraft(null);
    },
    [selectedSet, setSelectedNodes, onSelectEdge]
  );

  // Transient interaction state for nodes (distinguishing click vs drag lifecycle)
  interface PendingNodeInteraction {
    nodeId: EntityId;
    startX: number;
    startY: number;
    shiftKey: boolean;
    isDragActive: boolean;
  }
  const pendingNodeInteractionRef = useRef<PendingNodeInteraction | null>(null);
  const lastPointerSelectionTimeRef = useRef<number>(0);

  const [draggingNodeId, setDraggingNodeId] = useState<EntityId | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Transient panning state
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; vpX: number; vpY: number } | null>(null);

  // Transient marquee selection state
  const marqueeStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isShiftHeldOnStartRef = useRef(false);
  const initialSelectionOnMarqueeRef = useRef<readonly EntityId[]>([]);
  const [marqueeBox, setMarqueeBox] = useState<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  } | null>(null);

  // Transient port connection state (mouse-driven with endpoint snapping)
  interface ConnectionDraftState {
    sourceNodeId: EntityId;
    sourcePort: PortSide;
    cursorCanvasPos: { x: number; y: number };
    hoveredTarget: {
      nodeId: EntityId;
      port: PortSide;
      isInvalid: boolean;
    } | null;
  }
  const [connectionDraft, setConnectionDraft] = useState<ConnectionDraftState | null>(null);

  // Keyboard connection mode ('C' key workflow)
  const [isConnectionMode, setIsConnectionMode] = useState(false);
  const [candidateTargetIndex, setCandidateTargetIndex] = useState(0);

  const connectionSourceId = effectiveSelectedIds.length > 0 ? effectiveSelectedIds[0] ?? null : null;
  const candidateTargets = useMemo(() => {
    if (!connectionSourceId) return [];
    return nodes.filter((n) => n.id !== connectionSourceId);
  }, [nodes, connectionSourceId]);

  const activeCandidateTarget = candidateTargets[candidateTargetIndex] || null;

  // Auto-cancel connection mode if source node was removed or deselect occurred
  useEffect(() => {
    if (isConnectionMode && (!connectionSourceId || candidateTargets.length === 0)) {
      setIsConnectionMode(false);
    }
  }, [isConnectionMode, connectionSourceId, candidateTargets.length]);

  // Fast map for edge lookups with multi-node drag support
  const nodesMap = useMemo(() => {
    const map = new Map<EntityId, { position: CanvasPosition; dimensions: CanvasDimensions; title?: string }>();
    const isGroupDrag = draggingNodeId && selectedSet.has(draggingNodeId);

    for (const node of nodes) {
      const isMoving = isGroupDrag
        ? selectedSet.has(node.id) && !node.locked
        : node.id === draggingNodeId && !node.locked;
      if (isMoving) {
        map.set(node.id, {
          position: {
            x: node.position.x + dragOffset.x,
            y: node.position.y + dragOffset.y,
          },
          dimensions: node.dimensions,
          title: node.title,
        });
      } else {
        map.set(node.id, { position: node.position, dimensions: node.dimensions, title: node.title });
      }
    }
    return map;
  }, [nodes, draggingNodeId, selectedSet, dragOffset]);

  // Fast map of connected ports per node for active connection indicators
  const nodeConnectedPortsMap = useMemo(() => {
    const map = new Map<EntityId, Set<PortSide>>();
    for (const edge of edges) {
      if (!map.has(edge.sourceNodeId)) map.set(edge.sourceNodeId, new Set());
      if (!map.has(edge.targetNodeId)) map.set(edge.targetNodeId, new Set());
      map.get(edge.sourceNodeId)?.add(edge.sourcePort);
      map.get(edge.targetNodeId)?.add(edge.targetPort);
    }
    return map;
  }, [edges]);

  // Real-time valid connections count (excluding orphaned edges with missing nodes)
  const validEdgesCount = useMemo(() => {
    const nodeIds = new Set(nodes.map((n) => n.id));
    return edges.filter((e) => nodeIds.has(e.sourceNodeId) && nodeIds.has(e.targetNodeId)).length;
  }, [nodes, edges]);

  // Convert Screen/Client coords to Canvas Logical coords
  const screenToCanvasCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const safeX = clientX ?? 0;
      const safeY = clientY ?? 0;
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = safeX - (rect.left ?? 0);
      const relativeY = safeY - (rect.top ?? 0);
      const zoom = viewport.zoom || 1;
      return {
        x: (relativeX - (viewport.x ?? 0)) / zoom,
        y: (relativeY - (viewport.y ?? 0)) / zoom,
      };
    },
    [viewport]
  );

  // Snap coordinate helper
  const snapValue = useCallback(
    (val: number) => {
      if (!snapToGrid) return Math.round(val);
      return Math.round(val / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  // Keyboard navigation & Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      // 1. Connection Mode Keyboard Controls
      if (isConnectionMode) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsConnectionMode(false);
          return;
        }

        if (e.key === 'Tab') {
          e.preventDefault();
          if (candidateTargets.length > 0) {
            setCandidateTargetIndex((prev) =>
              e.shiftKey
                ? (prev - 1 + candidateTargets.length) % candidateTargets.length
                : (prev + 1) % candidateTargets.length
            );
          }
          return;
        }

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (candidateTargets.length > 0) {
            setCandidateTargetIndex((prev) => (prev + 1) % candidateTargets.length);
          }
          return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (candidateTargets.length > 0) {
            setCandidateTargetIndex((prev) => (prev - 1 + candidateTargets.length) % candidateTargets.length);
          }
          return;
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          if (connectionSourceId && activeCandidateTarget) {
            onConnectPorts(connectionSourceId, 'right', activeCandidateTarget.id, 'left');
            const sNode = nodes.find((n) => n.id === connectionSourceId);
            setStatusAnnouncement(`Connected ${sNode?.title || 'node'} to ${activeCandidateTarget.title}.`);
          }
          setIsConnectionMode(false);
          return;
        }
      }

      // 2. Standard Canvas Hotkeys
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }

      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onAddQuickNode();
      }

      if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsMinimapOpen((prev) => !prev);
      }

      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        if (connectionSourceId && candidateTargets.length > 0) {
          e.preventDefault();
          setIsConnectionMode((prev) => !prev);
          setCandidateTargetIndex(0);
        }
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        onOpenShortcutsModal();
      }

      // Escape clears active connection draft, context menus, or selection
      if (e.key === 'Escape') {
        if (edgeContextMenu) {
          e.preventDefault();
          setEdgeContextMenu(null);
          return;
        }
        if (contextMenu) {
          e.preventDefault();
          setContextMenu(null);
          return;
        }
        if (connectionDraft) {
          e.preventDefault();
          setConnectionDraft(null);
          return;
        }
        if (selectedEdgeId) {
          e.preventDefault();
          handleSelectEdgeInternal(null);
          return;
        }
        setSelectedNodes([]);
        handleSelectEdgeInternal(null);
      }

      // Arrow keys move selected nodes
      if (effectiveSelectedIds.length > 0) {
        const step = e.altKey ? 1 : e.shiftKey ? 64 : 16;
        let dx = 0;
        let dy = 0;

        if (e.key === 'ArrowLeft') dx = -step;
        else if (e.key === 'ArrowRight') dx = step;
        else if (e.key === 'ArrowUp') dy = -step;
        else if (e.key === 'ArrowDown') dy = step;

        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          const targetNodes = nodes.filter((n) => selectedSet.has(n.id) && !n.locked);
          if (targetNodes.length > 0) {
            const moves = targetNodes.map((n) => ({
              nodeId: n.id,
              position: {
                x: snapValue(n.position.x + dx),
                y: snapValue(n.position.y + dy),
              },
            }));
            onMoveNodesCommit(moves);
            const firstMove = moves[0];
            setStatusAnnouncement(
              targetNodes.length === 1
                ? `Moved ${targetNodes[0]?.title} to position ${firstMove?.position.x}, ${firstMove?.position.y}.`
                : `Moved ${targetNodes.length} nodes by ${dx !== 0 ? `X: ${dx}` : `Y: ${dy}`}px.`
            );
          }
        }
      }

      // Delete / Backspace deletes selected nodes or selected connection
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (effectiveSelectedIds.length > 0) {
          e.preventDefault();
          if (onDeleteNodes) {
            onDeleteNodes(effectiveSelectedIds);
          } else {
            for (const id of effectiveSelectedIds) {
              onDeleteNode(id);
            }
          }
          setStatusAnnouncement(`Deleted ${effectiveSelectedIds.length} node(s).`);
          setSelectedNodes([]);
        } else if (selectedEdgeId && onDeleteEdge) {
          e.preventDefault();
          onDeleteEdge(selectedEdgeId);
          setStatusAnnouncement('Deleted connection.');
          handleSelectEdgeInternal(null, true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    connectionDraft,
    isConnectionMode,
    candidateTargets,
    connectionSourceId,
    activeCandidateTarget,
    effectiveSelectedIds,
    selectedSet,
    nodes,
    snapValue,
    onMoveNodesCommit,
    onDeleteNode,
    onDeleteNodes,
    onConnectPorts,
    onAddQuickNode,
    onOpenShortcutsModal,
    setSelectedNodes,
    onSelectEdge,
    contextMenu,
    edgeContextMenu,
    handleSelectEdgeInternal,
    onDeleteEdge,
    selectedEdgeId,
  ]);

  // Wheel zoom handling
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const targetZoom = Math.min(3.0, Math.max(0.15, viewport.zoom * zoomFactor));

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newX = mouseX - (mouseX - viewport.x) * (targetZoom / viewport.zoom);
        const newY = mouseY - (mouseY - viewport.y) * (targetZoom / viewport.zoom);

        onUpdateViewport({
          x: Math.round(newX),
          y: Math.round(newY),
          zoom: parseFloat(targetZoom.toFixed(2)),
        });
      }
    },
    [viewport, onUpdateViewport]
  );

  // Zoom control callbacks (predictable center-anchored scaling)
  const handleZoomIn = () => {
    const nextZoom = Math.min(3.0, parseFloat((viewport.zoom * 1.2).toFixed(2)));
    const screenW = containerRef.current?.clientWidth || containerDimensions.width || 1200;
    const screenH = containerRef.current?.clientHeight || containerDimensions.height || 800;
    const centerX = screenW / 2;
    const centerY = screenH / 2;
    const newX = centerX - (centerX - viewport.x) * (nextZoom / viewport.zoom);
    const newY = centerY - (centerY - viewport.y) * (nextZoom / viewport.zoom);
    onUpdateViewport({
      x: Math.round(newX),
      y: Math.round(newY),
      zoom: nextZoom,
    });
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(0.15, parseFloat((viewport.zoom / 1.2).toFixed(2)));
    const screenW = containerRef.current?.clientWidth || containerDimensions.width || 1200;
    const screenH = containerRef.current?.clientHeight || containerDimensions.height || 800;
    const centerX = screenW / 2;
    const centerY = screenH / 2;
    const newX = centerX - (centerX - viewport.x) * (nextZoom / viewport.zoom);
    const newY = centerY - (centerY - viewport.y) * (nextZoom / viewport.zoom);
    onUpdateViewport({
      x: Math.round(newX),
      y: Math.round(newY),
      zoom: nextZoom,
    });
  };

  const handleResetZoom = () => {
    const nextZoom = 1.0;
    const screenW = containerRef.current?.clientWidth || containerDimensions.width || 1200;
    const screenH = containerRef.current?.clientHeight || containerDimensions.height || 800;
    const centerX = screenW / 2;
    const centerY = screenH / 2;
    const newX = centerX - (centerX - viewport.x) * (nextZoom / viewport.zoom);
    const newY = centerY - (centerY - viewport.y) * (nextZoom / viewport.zoom);
    onUpdateViewport({
      x: Math.round(newX),
      y: Math.round(newY),
      zoom: nextZoom,
    });
  };

  const handleFitView = useCallback(() => {
    const screenW = containerRef.current?.clientWidth || containerDimensions.width || 1200;
    const screenH = containerRef.current?.clientHeight || containerDimensions.height || 800;

    if (nodes.length === 0) {
      onUpdateViewport({ x: 0, y: 0, zoom: 1.0 });
      return;
    }

    if (nodes.length === 1) {
      const node = nodes[0]!;
      const nodeCenterX = node.position.x + node.dimensions.width / 2;
      const nodeCenterY = node.position.y + node.dimensions.height / 2;
      onUpdateViewport({
        x: Math.round(screenW / 2 - nodeCenterX),
        y: Math.round(screenH / 2 - nodeCenterY),
        zoom: 1.0,
      });
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.dimensions.width);
      maxY = Math.max(maxY, node.position.y + node.dimensions.height);
    }

    const padding = 100;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;

    const scaleX = screenW / contentW;
    const scaleY = screenH / contentH;
    const fitZoom = Math.min(1.2, Math.max(0.2, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newX = screenW / 2 - centerX * fitZoom;
    const newY = screenH / 2 - centerY * fitZoom;

    onUpdateViewport({
      x: Math.round(newX),
      y: Math.round(newY),
      zoom: parseFloat(fitZoom.toFixed(2)),
    });
  }, [nodes, containerDimensions, onUpdateViewport]);

  const handleToggleGrid = useCallback(() => {
    setIsGridVisible((prev) => !prev);
    onToggleSnapGrid();
  }, [onToggleSnapGrid]);

  // Pointer down on canvas background: Panning vs Marquee Selection
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Ignore clicks on buttons, inputs, toolbars, HUDs, context menus, and interactive overlays
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.closest('button, input, textarea, select, a, [role="button"]') ||
        target.closest('[role="toolbar"]') ||
        target.closest('[role="region"]') ||
        target.closest('[role="menu"]') ||
        target.closest(`.${styles.hudContainer}`) ||
        target.closest('[data-port-handle="true"]') ||
        target.closest('[data-node-card="true"]') ||
        target.closest('[data-edge-group="true"]') ||
        target.closest('[data-edge-hit-area="true"]') ||
        target.closest('[data-edge-id]'))
    ) {
      return;
    }

    const isMiddleClick = e.button === 1;
    const isPanGesture = isMiddleClick || isSpacePressed;

    if (isPanGesture) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        vpX: viewport.x,
        vpY: viewport.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // Left click on background -> initiate Marquee selection
    if (e.button === 0) {
      const canvasPos = screenToCanvasCoords(e.clientX, e.clientY);
      marqueeStartPosRef.current = canvasPos;
      isShiftHeldOnStartRef.current = e.shiftKey;
      initialSelectionOnMarqueeRef.current = e.shiftKey ? effectiveSelectedIds : [];
      setMarqueeBox(null);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  // Node Interaction Lifecycle (Step 1: Pointer Down begins potential interaction)
  const handleNodePointerDown = useCallback(
    (nodeId: EntityId, e: React.PointerEvent) => {
      e.stopPropagation();

      // Clear edge selection when interacting with a node
      onSelectEdge(null);

      // Record start position; dragging does NOT initiate until movement threshold (> 5px) is crossed
      pendingNodeInteractionRef.current = {
        nodeId,
        startX: e.clientX ?? 0,
        startY: e.clientY ?? 0,
        shiftKey: e.shiftKey,
        isDragActive: false,
      };

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback in test environments
      }
    },
    [onSelectEdge]
  );

  // Connection Drag Start (live port handle)
  const handlePortPointerDown = useCallback(
    (nodeId: EntityId, port: PortSide, e: React.PointerEvent) => {
      e.stopPropagation();
      const canvasPos = screenToCanvasCoords(e.clientX, e.clientY);
      setConnectionDraft({
        sourceNodeId: nodeId,
        sourcePort: port,
        cursorCanvasPos: canvasPos,
        hoveredTarget: null,
      });

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    },
    [screenToCanvasCoords]
  );

  // Global Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    // 1. Panning viewport
    if (isPanning && panStartRef.current) {
      const clientX = e.clientX ?? 0;
      const clientY = e.clientY ?? 0;
      const dx = clientX - panStartRef.current.clientX;
      const dy = clientY - panStartRef.current.clientY;
      onUpdateViewport({
        ...viewport,
        x: Math.round(panStartRef.current.vpX + dx),
        y: Math.round(panStartRef.current.vpY + dy),
      });
      return;
    }

    // 2. Dragging nodes (single or group) with 5px movement threshold (Steps 2, 4, 5)
    if (pendingNodeInteractionRef.current) {
      const p = pendingNodeInteractionRef.current;
      const clientX = e.clientX ?? 0;
      const clientY = e.clientY ?? 0;
      const dx = clientX - p.startX;
      const dy = clientY - p.startY;
      const distance = Math.hypot(dx, dy);

      // Distinguish click from drag using a 5px movement threshold
      if (!p.isDragActive) {
        if (distance > 5) {
          const targetNode = nodes.find((n) => n.id === p.nodeId);
          // Position locked nodes strictly cannot be moved via drag
          if (targetNode?.locked) {
            return;
          }

          p.isDragActive = true;
          setDraggingNodeId(p.nodeId);

          // If the dragged node is not already in selection, establish it
          if (!p.shiftKey && !selectedSet.has(p.nodeId)) {
            setSelectedNodes([p.nodeId]);
          }
        } else {
          return;
        }
      }

      if (p.isDragActive) {
        const zoom = viewport.zoom || 1;
        const deltaX = dx / zoom;
        const deltaY = dy / zoom;
        setDragOffset({ x: deltaX, y: deltaY });
        return;
      }
    }

    // 3. Marquee Multi-Selection Drag
    if (marqueeStartPosRef.current) {
      const currentCanvasPos = screenToCanvasCoords(e.clientX, e.clientY);
      const minX = Math.min(marqueeStartPosRef.current.x, currentCanvasPos.x);
      const minY = Math.min(marqueeStartPosRef.current.y, currentCanvasPos.y);
      const maxX = Math.max(marqueeStartPosRef.current.x, currentCanvasPos.x);
      const maxY = Math.max(marqueeStartPosRef.current.y, currentCanvasPos.y);
      const width = maxX - minX;
      const height = maxY - minY;

      setMarqueeBox({ minX, minY, maxX, maxY, width, height });

      // Detect intersecting nodes (geometric box overlap)
      if (width > 4 || height > 4) {
        const intersectingIds = nodes
          .filter(
            (node) =>
              node.position.x < maxX &&
              node.position.x + node.dimensions.width > minX &&
              node.position.y < maxY &&
              node.position.y + node.dimensions.height > minY
          )
          .map((n) => n.id);

        if (isShiftHeldOnStartRef.current) {
          const combined = Array.from(
            new Set([...initialSelectionOnMarqueeRef.current, ...intersectingIds])
          );
          setSelectedNodes(combined);
        } else {
          setSelectedNodes(intersectingIds);
        }
      }
      return;
    }

    // 4. Connection draft line with live target discovery and endpoint snapping
    if (connectionDraft) {
      const canvasPos = screenToCanvasCoords(e.clientX, e.clientY);
      const targetElement =
        typeof document !== 'undefined' && document.elementFromPoint
          ? document.elementFromPoint(e.clientX, e.clientY)
          : null;

      const portHandle = targetElement?.closest('[data-port-handle="true"]') as HTMLElement | null;
      const nodeCard = targetElement?.closest('[data-node-card="true"]') as HTMLElement | null;

      let hoveredTarget: { nodeId: EntityId; port: PortSide; isInvalid: boolean } | null = null;

      if (portHandle) {
        const tNodeId = portHandle.getAttribute('data-node-id');
        const tPort = (portHandle.getAttribute('data-port-side') as PortSide) || 'left';
        if (tNodeId) {
          const isSelf = tNodeId === connectionDraft.sourceNodeId;
          hoveredTarget = { nodeId: tNodeId, port: tPort, isInvalid: isSelf };
        }
      } else if (nodeCard) {
        const tNodeId = nodeCard.getAttribute('data-node-id');
        if (tNodeId) {
          const isSelf = tNodeId === connectionDraft.sourceNodeId;
          const tNode = nodes.find((n) => n.id === tNodeId);
          let bestPort: PortSide = 'left';
          if (tNode) {
            const ports: PortSide[] = ['top', 'right', 'bottom', 'left'];
            let minDist = Infinity;
            for (const side of ports) {
              const pCoord = getPortCoordinate(tNode.position, tNode.dimensions, side);
              const dist = Math.hypot(pCoord.x - canvasPos.x, pCoord.y - canvasPos.y);
              if (dist < minDist) {
                minDist = dist;
                bestPort = side;
              }
            }
          }
          hoveredTarget = { nodeId: tNodeId, port: bestPort, isInvalid: isSelf };
        }
      }

      setConnectionDraft((prev) =>
        prev
          ? {
              ...prev,
              cursorCanvasPos: canvasPos,
              hoveredTarget,
            }
          : null
      );
    }
  };

  // Global Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    // 1. End panning
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }

    // 2. Commit node drag or establish clean single-click selection (Steps 3 & 6)
    if (pendingNodeInteractionRef.current) {
      const p = pendingNodeInteractionRef.current;

      if (!p.isDragActive) {
        // Step 3: Pure click/tap without meaningful movement -> establish selection immediately
        lastPointerSelectionTimeRef.current = Date.now();
        if (p.shiftKey) {
          if (selectedSet.has(p.nodeId)) {
            setSelectedNodes(effectiveSelectedIds.filter((id) => id !== p.nodeId));
          } else {
            setSelectedNodes([...effectiveSelectedIds, p.nodeId]);
          }
        } else {
          setSelectedNodes([p.nodeId]);
        }
        onSelectEdge(null);
      } else {
        // Step 6: Drag commit (only for unlocked nodes)
        const isGroupDrag = selectedSet.has(p.nodeId);
        const nodesToMove = isGroupDrag
          ? nodes.filter((n) => selectedSet.has(n.id) && !n.locked)
          : nodes.filter((n) => n.id === p.nodeId && !n.locked);

        if (nodesToMove.length > 0 && (dragOffset.x !== 0 || dragOffset.y !== 0)) {
          const snappedDx = snapValue(dragOffset.x);
          const snappedDy = snapValue(dragOffset.y);

          const moves = nodesToMove.map((node) => ({
            nodeId: node.id,
            position: {
              x: snapValue(node.position.x + snappedDx),
              y: snapValue(node.position.y + snappedDy),
            },
          }));

          onMoveNodesCommit(moves);
        }

        setDraggingNodeId(null);
        setDragOffset({ x: 0, y: 0 });
      }

      pendingNodeInteractionRef.current = null;
    }

    // 3. End marquee selection
    if (marqueeStartPosRef.current) {
      // If was a simple click without dragging (area <= 4x4)
      if (!marqueeBox || (marqueeBox.width <= 4 && marqueeBox.height <= 4)) {
        if (!isShiftHeldOnStartRef.current) {
          setSelectedNodes([]);
          handleSelectEdgeInternal(null);
        }
      }

      marqueeStartPosRef.current = null;
      setMarqueeBox(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }

    // 4. Port connection drop
    if (connectionDraft) {
      let finalTarget = connectionDraft.hoveredTarget;

      // Final fallback if not hovered during move
      if (!finalTarget && typeof document !== 'undefined' && document.elementFromPoint) {
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        const portHandle = targetElement?.closest('[data-port-handle="true"]') as HTMLElement | null;
        const nodeCard = targetElement?.closest('[data-node-card="true"]') as HTMLElement | null;

        if (portHandle) {
          const tNodeId = portHandle.getAttribute('data-node-id');
          const tPort = (portHandle.getAttribute('data-port-side') as PortSide) || 'left';
          if (tNodeId) {
            finalTarget = { nodeId: tNodeId, port: tPort, isInvalid: tNodeId === connectionDraft.sourceNodeId };
          }
        } else if (nodeCard) {
          const tNodeId = nodeCard.getAttribute('data-node-id');
          if (tNodeId) {
            const isSelf = tNodeId === connectionDraft.sourceNodeId;
            const tNode = nodes.find((n) => n.id === tNodeId);
            let bestPort: PortSide = 'left';
            if (tNode) {
              const ports: PortSide[] = ['top', 'right', 'bottom', 'left'];
              let minDist = Infinity;
              for (const side of ports) {
                const pCoord = getPortCoordinate(tNode.position, tNode.dimensions, side);
                const dist = Math.hypot(pCoord.x - connectionDraft.cursorCanvasPos.x, pCoord.y - connectionDraft.cursorCanvasPos.y);
                if (dist < minDist) {
                  minDist = dist;
                  bestPort = side;
                }
              }
            }
            finalTarget = { nodeId: tNodeId, port: bestPort, isInvalid: isSelf };
          }
        }
      }

      if (finalTarget && !finalTarget.isInvalid && finalTarget.nodeId !== connectionDraft.sourceNodeId) {
        onConnectPorts(
          connectionDraft.sourceNodeId,
          connectionDraft.sourcePort,
          finalTarget.nodeId,
          finalTarget.port
        );
        const sNode = nodes.find((n) => n.id === connectionDraft.sourceNodeId);
        const tNode = nodes.find((n) => n.id === finalTarget.nodeId);
        setStatusAnnouncement(`Connected ${sNode?.title || 'node'} to ${tNode?.title || 'node'}.`);
      } else if (finalTarget?.isInvalid) {
        setStatusAnnouncement('Cannot connect a node to itself.');
      }

      setConnectionDraft(null);
    }
  };

  // Pointer Cancellation Lifecycle (Step 7)
  const handlePointerCancel = () => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }
    if (marqueeStartPosRef.current) {
      marqueeStartPosRef.current = null;
      setMarqueeBox(null);
    }
    if (pendingNodeInteractionRef.current) {
      pendingNodeInteractionRef.current = null;
      setDraggingNodeId(null);
      setDragOffset({ x: 0, y: 0 });
    }
    if (connectionDraft) {
      setConnectionDraft(null);
    }
  };

  // Drag draft connection line coordinates with snap support
  let tempConnectionSourceCoord: { x: number; y: number } | null = null;
  let tempConnectionTargetCoord: { x: number; y: number } = connectionDraft
    ? connectionDraft.cursorCanvasPos
    : { x: 0, y: 0 };

  if (connectionDraft) {
    const sNode = nodesMap.get(connectionDraft.sourceNodeId);
    if (sNode) {
      tempConnectionSourceCoord = getPortCoordinate(
        sNode.position,
        sNode.dimensions,
        connectionDraft.sourcePort
      );
    }
    if (connectionDraft.hoveredTarget && !connectionDraft.hoveredTarget.isInvalid) {
      const tNode = nodesMap.get(connectionDraft.hoveredTarget.nodeId);
      if (tNode) {
        tempConnectionTargetCoord = getPortCoordinate(
          tNode.position,
          tNode.dimensions,
          connectionDraft.hoveredTarget.port
        );
      }
    }
  }

  // Keyboard connection mode preview line coordinates
  let kbConnectionSourceCoord: { x: number; y: number } | null = null;
  let kbConnectionTargetCoord: { x: number; y: number } | null = null;
  if (isConnectionMode && connectionSourceId && activeCandidateTarget) {
    const sNode = nodesMap.get(connectionSourceId);
    const tNode = nodesMap.get(activeCandidateTarget.id);
    if (sNode && tNode) {
      kbConnectionSourceCoord = getPortCoordinate(sNode.position, sNode.dimensions, 'right');
      kbConnectionTargetCoord = getPortCoordinate(tNode.position, tNode.dimensions, 'left');
    }
  }

  const isDraggingGroup = draggingNodeId !== null && selectedSet.has(draggingNodeId);

  return (
    <div
      ref={containerRef}
      className={`${styles.viewportContainer} ${isSpacePressed ? styles.panning : ''} ${
        isPanning ? styles.isPanning : ''
      }`}
      onWheel={handleWheel}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      tabIndex={0}
      aria-label="Interactive Canvas Viewport"
    >
      {/* Transformed Stage */}
      <div
        className={styles.canvasStage}
        style={{
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
        }}
      >
        {/* Background Reference Grid */}
        {isGridVisible && <div className={styles.gridPattern} />}

        {/* SVG Edges Layer */}
        <EdgeLayerSvg
          edges={edges}
          nodesMap={nodesMap}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={handleSelectEdgeInternal}
          onContextMenuEdge={handleEdgeContextMenu}
        />

        {/* Mouse Connection Drag Preview Line with Endpoint Snapping */}
        {tempConnectionSourceCoord && connectionDraft && (
          <svg className={styles.tempConnectionSvg} aria-hidden="true">
            <line
              x1={tempConnectionSourceCoord.x}
              y1={tempConnectionSourceCoord.y}
              x2={tempConnectionTargetCoord.x}
              y2={tempConnectionTargetCoord.y}
              className={`${styles.tempLine} ${
                connectionDraft.hoveredTarget && !connectionDraft.hoveredTarget.isInvalid
                  ? styles.tempLineSnapped
                  : connectionDraft.hoveredTarget?.isInvalid
                  ? styles.tempLineInvalid
                  : ''
              }`}
            />
            {connectionDraft.hoveredTarget && !connectionDraft.hoveredTarget.isInvalid && (
              <circle
                cx={tempConnectionTargetCoord.x}
                cy={tempConnectionTargetCoord.y}
                r={6}
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            )}
          </svg>
        )}

        {/* Keyboard Connection Preview Line */}
        {isConnectionMode && kbConnectionSourceCoord && kbConnectionTargetCoord && (
          <svg className={styles.tempConnectionSvg} aria-hidden="true">
            <line
              x1={kbConnectionSourceCoord.x}
              y1={kbConnectionSourceCoord.y}
              x2={kbConnectionTargetCoord.x}
              y2={kbConnectionTargetCoord.y}
              className={styles.connectionPreviewLine}
            />
          </svg>
        )}

        {/* Marquee Selection Rectangle */}
        {marqueeBox && (
          <div
            className={styles.selectionMarquee}
            style={{
              left: `${marqueeBox.minX}px`,
              top: `${marqueeBox.minY}px`,
              width: `${marqueeBox.width}px`,
              height: `${marqueeBox.height}px`,
            }}
          />
        )}

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const isNodeSelected = selectedSet.has(node.id);
          const isNodeDragging = isDraggingGroup
            ? isNodeSelected && !node.locked
            : draggingNodeId === node.id && !node.locked;

          const isSource =
            (connectionDraft && node.id === connectionDraft.sourceNodeId) ||
            (isConnectionMode && node.id === connectionSourceId);
          const isTarget =
            (connectionDraft?.hoveredTarget && node.id === connectionDraft.hoveredTarget.nodeId && !connectionDraft.hoveredTarget.isInvalid) ||
            (isConnectionMode && activeCandidateTarget?.id === node.id);

          const connectionSourcePort =
            connectionDraft && node.id === connectionDraft.sourceNodeId
              ? connectionDraft.sourcePort
              : isConnectionMode && node.id === connectionSourceId
              ? 'right'
              : null;

          const hoveredTargetPort =
            connectionDraft?.hoveredTarget && node.id === connectionDraft.hoveredTarget.nodeId && !connectionDraft.hoveredTarget.isInvalid
              ? connectionDraft.hoveredTarget.port
              : isConnectionMode && activeCandidateTarget?.id === node.id
              ? 'left'
              : null;

          const invalidTargetPort =
            connectionDraft?.hoveredTarget && node.id === connectionDraft.hoveredTarget.nodeId && connectionDraft.hoveredTarget.isInvalid
              ? connectionDraft.hoveredTarget.port
              : null;

          const isCandidate =
            Boolean(connectionDraft && node.id !== connectionDraft.sourceNodeId) ||
            Boolean(isConnectionMode && node.id !== connectionSourceId);

          return (
            <NodeContainer
              key={node.id}
              node={node}
              isSelected={isNodeSelected}
              isDragging={isNodeDragging}
              dragOffset={dragOffset}
              isConnectionSource={isSource}
              isConnectionTarget={isTarget}
              connectionSourcePort={connectionSourcePort}
              hoveredTargetPort={hoveredTargetPort}
              invalidTargetPort={invalidTargetPort}
              isCandidateTarget={isCandidate}
              connectedPorts={nodeConnectedPortsMap.get(node.id)}
              onSelect={(id, e) => {
                if (Date.now() - lastPointerSelectionTimeRef.current < 50) {
                  return;
                }
                if (e.shiftKey) {
                  if (selectedSet.has(id)) {
                    setSelectedNodes(effectiveSelectedIds.filter((selId) => selId !== id));
                  } else {
                    setSelectedNodes([...effectiveSelectedIds, id]);
                  }
                } else {
                  setSelectedNodes([id]);
                }
                onSelectEdge(null);
              }}
              onDelete={onDeleteNode}
              onToggleLock={onToggleLockNode}
              onContextMenu={handleNodeContextMenu}
              onPointerDown={handleNodePointerDown}
              onPortPointerDown={handlePortPointerDown}
            />
          );
        })}

        {/* Empty Canvas Onboarding State */}
        {nodes.length === 0 && (
          <div className={styles.emptyStateContainer}>
            <h2 className={styles.emptyStateTitle}>Your canvas is waiting</h2>
            <p className={styles.emptyStateSubtitle}>
              Start sketching architecture, scenes, or study mind maps on your private, local canvas.
            </p>
            <div className={styles.shortcutGrid}>
              <kbd className={styles.kbd}>N</kbd>
              <span>Add a new node</span>
              <kbd className={styles.kbd}>Marquee Drag</kbd>
              <span>Multi-select nodes by rectangular region</span>
              <kbd className={styles.kbd}>Shift + Click</kbd>
              <span>Toggle node in multi-selection</span>
              <kbd className={styles.kbd}>C</kbd>
              <span>Keyboard connection mode (Tab/Enter)</span>
              <kbd className={styles.kbd}>M</kbd>
              <span>Toggle canvas minimap</span>
              <kbd className={styles.kbd}>Space + Drag</kbd>
              <span>Pan canvas viewport</span>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={onAddQuickNode}
              icon={<PlusIcon size={16} />}
            >
              Add First Node
            </Button>
          </div>
        )}
      </div>

      {/* Floating Multi-Selection Action Bar */}
      {effectiveSelectedIds.length >= 2 && (
        <SelectionActionBar
          selectedCount={effectiveSelectedIds.length}
          selectedNodeIds={effectiveSelectedIds}
          onBulkRecolor={(nodeIds, colorToken) => {
            onBulkRecolorNodes?.(nodeIds, colorToken);
          }}
          onBulkDelete={(nodeIds) => {
            if (onDeleteNodes) {
              onDeleteNodes(nodeIds);
            } else {
              for (const id of nodeIds) onDeleteNode(id);
            }
            setSelectedNodes([]);
          }}
          onClearSelection={() => setSelectedNodes([])}
        />
      )}

      {/* Keyboard Connection Mode HUD Banner */}
      {isConnectionMode && connectionSourceId && activeCandidateTarget && (
        <div className={styles.connectionBanner} role="status" aria-live="polite">
          <span className={styles.connectionBannerBadge}>Connecting</span>
          <span>
            Connect &rarr; <strong>{activeCandidateTarget.title}</strong>
          </span>
          <span style={{ color: 'var(--mr-text-muted)' }}>
            [Tab] cycle &bull; [Enter] connect &bull; [Esc] cancel
          </span>
        </div>
      )}

      {/* Canvas Minimap Component */}
      <CanvasMinimap
        nodes={nodes}
        viewport={viewport}
        containerDimensions={containerDimensions}
        selectedNodeIds={effectiveSelectedIds}
        onUpdateViewport={onUpdateViewport}
        isOpen={isMinimapOpen}
        onClose={() => setIsMinimapOpen(false)}
      />

      {/* Screen Reader Live Status Announcer */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="canvas-status-announcer"
      >
        {statusAnnouncement}
      </div>

      {/* Floating Canvas HUD */}
      <CanvasHud
        zoom={viewport.zoom}
        nodeCount={nodes.length}
        edgeCount={validEdgesCount}
        snapToGrid={isGridVisible}
        isMinimapOpen={isMinimapOpen}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitView={handleFitView}
        onToggleSnapGrid={handleToggleGrid}
        onToggleMinimap={() => setIsMinimapOpen((prev) => !prev)}
        onOpenShortcuts={onOpenShortcutsModal}
      />

      {/* Custom Context Menu on Right Click */}
      {contextMenu && (
        (() => {
          const targetNode = nodes.find((n) => n.id === contextMenu.nodeId);
          if (!targetNode) return null;
          return (
            <CanvasContextMenu
              targetNode={targetNode}
              anchorPosition={{ x: contextMenu.x, y: contextMenu.y }}
              onClose={() => setContextMenu(null)}
              onInspectNode={(id) => {
                setSelectedNodes([id]);
                onSelectEdge(null);
              }}
              onToggleLock={onToggleLockNode}
              onDuplicateNode={onDuplicateNode}
              onStartConnection={(id) => {
                setIsConnectionMode(true);
                setCandidateTargetIndex(0);
                setSelectedNodes([id]);
              }}
              onDeleteNode={onDeleteNode}
            />
          );
        })()
      )}

      {/* Custom Context Menu on Right Click (Connection) */}
      {edgeContextMenu && (
        (() => {
          const targetEdge = edges.find((e) => e.id === edgeContextMenu.edgeId);
          if (!targetEdge) return null;
          const sourceNode = nodes.find((n) => n.id === targetEdge.sourceNodeId);
          const targetNode = nodes.find((n) => n.id === targetEdge.targetNodeId);

          return (
            <EdgeContextMenu
              targetEdge={targetEdge}
              sourceNodeTitle={sourceNode?.title}
              targetNodeTitle={targetNode?.title}
              anchorPosition={{ x: edgeContextMenu.x, y: edgeContextMenu.y }}
              onClose={() => setEdgeContextMenu(null)}
              onInspectEdge={(edgeId) => {
                handleSelectEdgeInternal(edgeId);
              }}
              onChangeRoutingStyle={(edgeId, style) => {
                onUpdateEdge?.(edgeId, { routingStyle: style });
                setStatusAnnouncement(`Changed connection routing to ${style}.`);
              }}
              onDeleteEdge={(edgeId) => {
                onDeleteEdge?.(edgeId);
                setStatusAnnouncement('Deleted connection.');
                handleSelectEdgeInternal(null, true);
              }}
            />
          );
        })()
      )}
    </div>
  );
}
