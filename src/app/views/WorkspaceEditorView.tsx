/**
 * Main Workspace Editor View for MindRail Studio.
 * Conforms to docs/UX_FLOWS.md and docs/ARCHITECTURE.md.
 */
import { useCallback, useEffect, useReducer, useState } from 'react';
import {
  CURRENT_SCHEMA_VERSION,
  type CanvasEdge,
  type CanvasNode,
  type CanvasPosition,
  type EntityId,
  type NodeColorToken,
  type PortSide,
  type Project,
  type ProjectTemplate,
  type TemplateCategory,
  type WorkspaceType,
} from '../../domain/models';
import type { StudentNodePayload, WorkspaceNodePayload } from '../../domain/workspaceTypes';
import { createEdge, createNode, generateEntityId } from '../../domain/factories';
import { getProject, saveCustomTemplate } from '../../persistence/projectRepository';
import { projectReducer } from '../../state/projectReducer';
import { useAutosave } from '../../state/useAutosave';
import { downloadProjectFile } from '../../import-export/exportProjectJson';
import { ImportDialog } from '../../import-export/ImportDialog';
import { ExportDialog } from '../../import-export/ExportDialog';
import { Button } from '../../design-system/components/Button';
import { Dialog } from '../../design-system/components/Dialog';
import { Input, Select, Textarea } from '../../design-system/components/FormControls';
import { useToast } from '../../design-system/components/Toast';
import { CanvasViewport } from '../../canvas/CanvasViewport';
import { ShortcutsDialog } from '../../canvas/ShortcutsDialog';
import { CreationPalette } from '../../workspaces/CreationPalette';
import { NodeInspector } from '../../workspaces/NodeInspector';
import { EdgeInspector } from '../../workspaces/EdgeInspector';
import { WorkspaceHeader } from '../../workspaces/WorkspaceHeader';
import { WorkspaceSummaryBar } from '../../workspaces/WorkspaceSummaryBar';
import { FlashcardStudyModal } from '../../workspaces/student/FlashcardStudyModal';
import { navigate } from '../router';

export interface WorkspaceEditorViewProps {
  workspaceType: WorkspaceType;
  projectId: EntityId;
}

export function WorkspaceEditorView({ workspaceType: _wsType, projectId }: WorkspaceEditorViewProps) {
  const { showToast } = useToast();
  const [initialProject, setInitialProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Selection state (multi-selection)
  const [selectedNodeIds, setSelectedNodeIds] = useState<readonly EntityId[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<EntityId | null>(null);

  // Load project on mount
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const p = await getProject(projectId);
        if (isCancelled) return;
        if (!p) {
          setNotFound(true);
        } else {
          setInitialProject(p);
        }
      } catch {
        if (!isCancelled) setNotFound(true);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: 'var(--mr-bg-canvas)',
          color: 'var(--mr-text-secondary)',
          fontSize: 'var(--mr-text-sm)',
        }}
      >
        Loading workspace...
      </div>
    );
  }

  if (notFound || !initialProject) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: 'var(--mr-bg-canvas)',
          padding: 24,
          textAlign: 'center',
          gap: 16,
        }}
      >
        <h2 style={{ color: 'var(--mr-text-primary)', margin: 0 }}>Project Not Found Locally</h2>
        <p style={{ color: 'var(--mr-text-secondary)', maxWidth: 460, margin: 0 }}>
          This project could not be found in your browser storage. It may have been deleted, or
          you may be using a different browser profile.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="primary" size="md" onClick={() => navigate('/projects')}>
            Go to Project Library
          </Button>
          <Button variant="secondary" size="md" onClick={() => setIsImportOpen(true)}>
            Import .mindrail.json
          </Button>
        </div>
        <ImportDialog
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportSuccess={(imported) => {
            navigate(`/workspace/${imported.workspaceType}/${imported.id}`);
          }}
        />
      </div>
    );
  }

  return (
    <ActiveWorkspaceSession
      key={initialProject.id}
      initialProject={initialProject}
      selectedNodeIds={selectedNodeIds}
      selectedEdgeId={selectedEdgeId}
      setSelectedNodeIds={setSelectedNodeIds}
      setSelectedEdgeId={setSelectedEdgeId}
      isImportOpen={isImportOpen}
      setIsImportOpen={setIsImportOpen}
      isShortcutsOpen={isShortcutsOpen}
      setIsShortcutsOpen={setIsShortcutsOpen}
      showToast={showToast}
    />
  );
}

interface ActiveSessionProps {
  initialProject: Project;
  selectedNodeIds: readonly EntityId[];
  selectedEdgeId: EntityId | null;
  setSelectedNodeIds: (ids: readonly EntityId[]) => void;
  setSelectedEdgeId: (id: EntityId | null) => void;
  isImportOpen: boolean;
  setIsImportOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'danger') => void;
}

function ActiveWorkspaceSession({
  initialProject,
  selectedNodeIds,
  selectedEdgeId,
  setSelectedNodeIds,
  setSelectedEdgeId,
  isImportOpen,
  setIsImportOpen,
  isShortcutsOpen,
  setIsShortcutsOpen,
  showToast,
}: ActiveSessionProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateSummary, setTemplateSummary] = useState('');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('web-dev');
  const [state, dispatch] = useReducer(projectReducer, {
    project: initialProject,
    undoStack: [],
    redoStack: [],
    revision: 0,
  });

  const { saveStatus, saveImmediately } = useAutosave({
    project: state.project,
    revision: state.revision,
    debounceMs: 1000,
  });

  const selectedNode =
    selectedNodeIds.length === 1
      ? state.project.nodes.find((n) => n.id === selectedNodeIds[0]) || null
      : null;

  const selectedEdge = selectedEdgeId
    ? state.project.edges.find((e) => e.id === selectedEdgeId) || null
    : null;

  const sourceNode = selectedEdge
    ? state.project.nodes.find((n) => n.id === selectedEdge.sourceNodeId)
    : undefined;

  const targetNode = selectedEdge
    ? state.project.nodes.find((n) => n.id === selectedEdge.targetNodeId)
    : undefined;

  // Viewport center helper
  const getViewportCenter = useCallback((): { x: number; y: number } => {
    const vp = state.project.viewport;
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      x: Math.round((screenW / 2 - vp.x) / vp.zoom - 140),
      y: Math.round((screenH / 2 - vp.y) / vp.zoom - 80),
    };
  }, [state.project.viewport]);

  // Actions
  const handleUpdateTitle = (newTitle: string) => {
    dispatch({ type: 'UPDATE_TITLE', title: newTitle });
    showToast(`Renamed project to "${newTitle}"`, 'info');
  };

  const handleAddQuickNode = () => {
    const center = getViewportCenter();
    const newNode = createNode(state.project.workspaceType, {
      title: 'New Node',
      position: center,
    });
    dispatch({ type: 'ADD_NODE', node: newNode });
    setSelectedNodeIds([newNode.id]);
    setSelectedEdgeId(null);
  };

  const handleAddPaletteNode = (node: CanvasNode) => {
    dispatch({ type: 'ADD_NODE', node });
    setSelectedNodeIds([node.id]);
    setSelectedEdgeId(null);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsPaletteOpen(false);
    }
  };

  const handleUpdateNodeProperties = (
    nodeId: EntityId,
    updates: {
      title?: string;
      description?: string;
      colorToken?: NodeColorToken;
      category?: string;
      locked?: boolean;
      payload?: WorkspaceNodePayload;
    },
    coalesceKey?: string
  ) => {
    dispatch({
      type: 'UPDATE_NODE',
      nodeId,
      updates,
      ...(coalesceKey !== undefined ? { coalesceKey } : {}),
    });
  };

  const handleDeleteNode = (nodeId: EntityId) => {
    dispatch({ type: 'DELETE_NODES', nodeIds: [nodeId] });
    setSelectedNodeIds(selectedNodeIds.filter((id) => id !== nodeId));
    showToast('Deleted node', 'info');
  };

  const handleBulkDeleteNodes = (nodeIds: readonly EntityId[]) => {
    dispatch({ type: 'DELETE_NODES', nodeIds });
    setSelectedNodeIds([]);
    showToast(`Deleted ${nodeIds.length} nodes`, 'info');
  };

  const handleBulkRecolorNodes = (nodeIds: readonly EntityId[], colorToken: NodeColorToken) => {
    dispatch({ type: 'BULK_UPDATE_NODES_COLOR', nodeIds, colorToken });
    showToast(`Updated color for ${nodeIds.length} nodes`, 'info');
  };

  const handleToggleLockNode = (nodeId: EntityId) => {
    const node = state.project.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    dispatch({
      type: 'UPDATE_NODE',
      nodeId,
      updates: { locked: !node.locked },
      historyLabel: `${node.locked ? 'Unlock' : 'Lock'} "${node.title}"`,
    });
  };

  const handleDuplicateNode = (nodeId: EntityId) => {
    const existing = state.project.nodes.find((n) => n.id === nodeId);
    if (!existing) return;
    const duplicatedNode = createNode(state.project.workspaceType, {
      title: `${existing.title} (Copy)`,
      description: existing.description,
      colorToken: existing.colorToken,
      category: existing.category ?? '',
      tags: [...existing.tags],
      locked: false,
      position: {
        x: existing.position.x + 32,
        y: existing.position.y + 32,
      },
      dimensions: { ...existing.dimensions },
      payload: JSON.parse(JSON.stringify(existing.payload)),
    });
    dispatch({
      type: 'ADD_NODE',
      node: duplicatedNode,
      historyLabel: `Duplicate "${existing.title}"`,
    });
    setSelectedNodeIds([duplicatedNode.id]);
    setSelectedEdgeId(null);
    showToast(`Duplicated "${existing.title}"`, 'success');
  };

  const handleMoveNodesCommit = (moves: Array<{ nodeId: EntityId; position: CanvasPosition }>) => {
    dispatch({ type: 'MOVE_NODES_COMMIT', moves });
  };

  const handleConnectPorts = (
    sourceNodeId: EntityId,
    sourcePort: PortSide,
    targetNodeId: EntityId,
    targetPort: PortSide
  ) => {
    if (sourceNodeId === targetNodeId) {
      showToast('Cannot connect a node to itself', 'warning');
      return;
    }

    const existing = state.project.edges.find(
      (e) =>
        e.sourceNodeId === sourceNodeId &&
        e.sourcePort === sourcePort &&
        e.targetNodeId === targetNodeId &&
        e.targetPort === targetPort
    );

    if (existing) {
      showToast('Connection already exists between these ports', 'warning');
      return;
    }

    const newEdge = createEdge({
      sourceNodeId,
      targetNodeId,
      sourcePort,
      targetPort,
      routingStyle: state.project.settings.defaultEdgeStyle,
    });

    dispatch({ type: 'ADD_EDGE', edge: newEdge });
    showToast('Connected nodes', 'success');
  };

  const handleExport = () => {
    try {
      const filename = downloadProjectFile(state.project);
      showToast(`Exported "${filename}"`, 'success');
    } catch {
      showToast('Failed to export project file', 'danger');
    }
  };

  const handleToggleSnapGrid = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { snapToGrid: !state.project.settings.snapToGrid },
    });
  };

  const handleUpdateEdge = useCallback((edgeId: EntityId, updates: Partial<CanvasEdge>) => {
    dispatch({ type: 'UPDATE_EDGE', edgeId, updates });
  }, []);

  const handleDeleteEdge = useCallback((edgeId: EntityId) => {
    dispatch({ type: 'DELETE_EDGES', edgeIds: [edgeId] });
    setSelectedEdgeId(null);
    showToast('Deleted connection', 'info');
  }, [showToast, setSelectedEdgeId]);

  const handleUpdateFlashcard = (nodeId: EntityId, payloadUpdates: Partial<StudentNodePayload>) => {
    const node = state.project.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    dispatch({
      type: 'UPDATE_NODE',
      nodeId,
      updates: {
        payload: { ...node.payload, ...payloadUpdates } as WorkspaceNodePayload,
      },
    });
  };

  const handleOpenSaveAsTemplate = () => {
    setTemplateName(state.project.title);
    setTemplateSummary(state.project.metadata.description || '');
    setIsSaveAsTemplateOpen(true);
  };

  const handleConfirmSaveAsTemplate = async () => {
    const template: ProjectTemplate = {
      id: generateEntityId(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      name: templateName.trim() || state.project.title,
      summary: templateSummary.trim() || 'Custom template saved from project.',
      workspaceType: state.project.workspaceType,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      defaultSettings: state.project.settings,
      nodes: state.project.nodes,
      edges: state.project.edges,
      checklist: state.project.checklist,
      category: templateCategory,
      tags: [...state.project.metadata.tags, 'custom-template'],
      targetAudience: 'Self / Team',
      difficulty: 'intermediate',
      estimatedSetupMinutes: 5,
    };
    try {
      await saveCustomTemplate(template);
      setIsSaveAsTemplateOpen(false);
      showToast(`Saved "${template.name}" as custom template!`, 'success');
    } catch {
      showToast('Failed to save template to local storage.', 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Studio Header Bar */}
      <WorkspaceHeader
        title={state.project.title}
        workspaceType={state.project.workspaceType}
        saveStatus={saveStatus}
        canUndo={state.undoStack.length > 0}
        canRedo={state.redoStack.length > 0}
        isPaletteOpen={isPaletteOpen}
        onTogglePalette={() => setIsPaletteOpen((prev) => !prev)}
        onUpdateTitle={handleUpdateTitle}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onExport={() => setIsExportOpen(true)}
        onImport={() => setIsImportOpen(true)}
        onEmergencyExport={handleExport}
        onSaveAsTemplate={handleOpenSaveAsTemplate}
      />

      {/* Real-time Workspace Metrics Summary Bar */}
      <WorkspaceSummaryBar
        workspaceType={state.project.workspaceType}
        nodes={state.project.nodes}
        edges={state.project.edges}
        focusMinutes={state.project.settings.studyTimerMinutes}
        breakMinutes={state.project.settings.studyBreakMinutes}
        onOpenStudyMode={() => setIsStudyModalOpen(true)}
        onStudySessionComplete={(mode, mins) => {
          if (mode === 'focus') {
            dispatch({ type: 'RECORD_STUDY_SESSION', elapsedMinutes: mins });
            showToast(`Completed ${mins}m focus session! Session recorded.`, 'success');
          } else {
            showToast(`Completed ${mins}m break session! Ready for focus.`, 'info');
          }
        }}
      />

      {/* Workspace Body: Left Palette + Canvas Viewport + Right Inspector */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <CreationPalette
          workspaceType={state.project.workspaceType}
          onAddNode={handleAddPaletteNode}
          viewportCenter={getViewportCenter()}
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
        />

        <CanvasViewport
          nodes={state.project.nodes}
          edges={state.project.edges}
          viewport={state.project.viewport}
          selectedNodeIds={selectedNodeIds}
          selectedEdgeId={selectedEdgeId}
          snapToGrid={state.project.settings.snapToGrid}
          gridSize={state.project.settings.gridSize}
          onUpdateViewport={(vp) => dispatch({ type: 'UPDATE_VIEWPORT', viewport: vp })}
          onSelectNodes={(ids) => {
            setSelectedNodeIds(ids);
            setSelectedEdgeId(null);
          }}
          onSelectNode={(id) => {
            setSelectedNodeIds(id ? [id] : []);
            setSelectedEdgeId(null);
          }}
          onSelectEdge={(id) => {
            setSelectedEdgeId(id);
            setSelectedNodeIds([]);
          }}
          onDeleteEdge={handleDeleteEdge}
          onUpdateEdge={handleUpdateEdge}
          onMoveNodesCommit={handleMoveNodesCommit}
          onDeleteNode={handleDeleteNode}
          onDeleteNodes={handleBulkDeleteNodes}
          onBulkRecolorNodes={handleBulkRecolorNodes}
          onToggleLockNode={handleToggleLockNode}
          onDuplicateNode={handleDuplicateNode}
          onConnectPorts={handleConnectPorts}
          onAddQuickNode={handleAddQuickNode}
          onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
          onToggleSnapGrid={handleToggleSnapGrid}
        />

        {selectedNode ? (
          <NodeInspector
            node={selectedNode}
            onUpdateNode={handleUpdateNodeProperties}
            onCommitCoalesce={() => dispatch({ type: 'COMMIT_COALESCE' })}
            onDeleteNode={handleDeleteNode}
            onClose={() => setSelectedNodeIds([])}
          />
        ) : selectedEdge ? (
          <EdgeInspector
            edge={selectedEdge}
            sourceNodeTitle={sourceNode?.title}
            targetNodeTitle={targetNode?.title}
            onUpdateEdge={handleUpdateEdge}
            onDeleteEdge={handleDeleteEdge}
            onClose={() => setSelectedEdgeId(null)}
          />
        ) : null}
      </div>

      {/* Import Modal Dialog */}
      <ImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={async (imported) => {
          await saveImmediately();
          navigate(`/workspace/${imported.workspaceType}/${imported.id}`);
          showToast(`Imported project "${imported.title}"`, 'success');
        }}
      />

      {/* Shortcuts Guide Modal */}
      <ShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Student Interactive Flashcard Study Deck Modal */}
      <FlashcardStudyModal
        isOpen={isStudyModalOpen}
        cards={state.project.nodes}
        onClose={() => setIsStudyModalOpen(false)}
        onUpdateCard={handleUpdateFlashcard}
      />

      {/* Export Studio Modal Dialog */}
      <ExportDialog
        isOpen={isExportOpen}
        project={state.project}
        onClose={() => setIsExportOpen(false)}
        onSuccess={(filename, desc) => {
          showToast(`Exported ${desc} "${filename}"`, 'success');
        }}
        onError={(msg) => {
          showToast(msg, 'danger');
        }}
      />

      {/* Save as Template Dialog */}
      <Dialog
        isOpen={isSaveAsTemplateOpen}
        onClose={() => setIsSaveAsTemplateOpen(false)}
        title="Save Project as Template"
        maxWidth={500}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsSaveAsTemplateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirmSaveAsTemplate}>
              Save Template
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 'var(--mr-text-sm)', color: 'var(--mr-text-secondary)' }}>
            Save the current arrangement of nodes, connections, and checklist items as a reusable template.
          </p>
          <Input
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Client Onboarding Flow"
          />
          <Select
            label="Category"
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value as TemplateCategory)}
          >
            <option value="freelance-business">Freelance &amp; Business</option>
            <option value="web-dev">Web Development</option>
            <option value="ui-ux">UI / UX Design</option>
            <option value="graphic-design">Graphic Design</option>
            <option value="video-editing">Video Editing</option>
            <option value="content-creation">Content Creation</option>
            <option value="writing">Writing &amp; Copywriting</option>
            <option value="social-media">Social Media</option>
            <option value="digital-marketing">Digital Marketing</option>
            <option value="photography">Photography</option>
            <option value="podcast-audio">Podcast &amp; Audio</option>
            <option value="data-analytics">Data Analytics</option>
            <option value="ai-automation">AI &amp; Automation</option>
            <option value="education-research">Education &amp; Research</option>
            <option value="product-startup">Product &amp; Startup</option>
          </Select>
          <Textarea
            label="Summary"
            rows={3}
            value={templateSummary}
            onChange={(e) => setTemplateSummary(e.target.value)}
            placeholder="Describe what this template is for..."
          />
        </div>
      </Dialog>
    </div>
  );
}
