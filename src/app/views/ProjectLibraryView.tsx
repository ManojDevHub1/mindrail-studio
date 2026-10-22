/**
 * Project Library View.
 * Displays user projects stored locally in IndexedDB with search, workspace filtering,
 * sorting, inline rename, duplicate, export, and delete actions.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EntityId, NodeColorToken, Project, WorkspaceType } from '../../domain/models';
import { createProject, generateEntityId } from '../../domain/factories';
import { deleteProject, listProjects, saveProject } from '../../persistence/projectRepository';
import { downloadProjectFile } from '../../import-export/exportProjectJson';
import { ImportDialog } from '../../import-export/ImportDialog';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import { Dialog } from '../../design-system/components/Dialog';
import { Input } from '../../design-system/components/FormControls';
import {
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from '../../design-system/components/Icons';
import { useToast } from '../../design-system/components/Toast';
import { navigate } from '../router';
import styles from './ProjectLibraryView.module.css';

type SortOption = 'updated-desc' | 'updated-asc' | 'title-asc' | 'title-desc' | 'nodes-desc';

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

export function ProjectLibraryView() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');

  // Modals
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const all = await listProjects();
      setProjects(all);
    } catch {
      showToast('Failed to load projects from storage', 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateNewProject = async (wsType: WorkspaceType) => {
    setIsNewProjectDialogOpen(false);
    const newProject = createProject(wsType);
    try {
      await saveProject(newProject);
      navigate(`/workspace/${wsType}/${newProject.id}`);
      showToast(`Created new ${wsType} project`, 'success');
    } catch {
      showToast('Failed to create project in local storage', 'danger');
    }
  };

  const handleDuplicateProject = async (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();

    // Map old node IDs to new node IDs so edge referential integrity is preserved
    const idMap = new Map<EntityId, EntityId>();
    const clonedNodes = p.nodes.map((n) => {
      const freshId = generateEntityId();
      idMap.set(n.id, freshId);
      return {
        ...n,
        id: freshId,
      };
    });

    const clonedEdges = p.edges.map((edge) => ({
      ...edge,
      id: generateEntityId(),
      sourceNodeId: idMap.get(edge.sourceNodeId) || edge.sourceNodeId,
      targetNodeId: idMap.get(edge.targetNodeId) || edge.targetNodeId,
    }));

    const duplicated: Project = {
      ...p,
      id: generateEntityId(),
      title: `${p.title} (Copy)`,
      metadata: {
        ...p.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      nodes: clonedNodes,
      edges: clonedEdges,
      checklist: p.checklist.map((item) => ({ ...item, id: generateEntityId() })),
    };

    try {
      await saveProject(duplicated);
      await fetchProjects();
      showToast(`Duplicated "${p.title}"`, 'success');
    } catch {
      showToast('Failed to duplicate project', 'danger');
    }
  };

  const handleExportProject = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    try {
      const filename = downloadProjectFile(p);
      showToast(`Exported "${filename}"`, 'success');
    } catch {
      showToast('Failed to export project', 'danger');
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
      await fetchProjects();
      showToast('Project deleted', 'info');
    } catch {
      showToast('Failed to delete project', 'danger');
    }
  };

  const handleConfirmRename = async () => {
    if (!projectToRename) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === projectToRename.title) {
      setProjectToRename(null);
      return;
    }

    const updated: Project = {
      ...projectToRename,
      title: trimmed,
      metadata: {
        ...projectToRename.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      await saveProject(updated);
      setProjectToRename(null);
      await fetchProjects();
      showToast(`Renamed project to "${trimmed}"`, 'success');
    } catch {
      showToast('Failed to rename project', 'danger');
    }
  };

  const filteredAndSortedProjects = useMemo(() => {
    const filtered = projects.filter((p) => {
      const matchesFilter = workspaceFilter === 'all' || p.workspaceType === workspaceFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.metadata.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated-desc':
          return new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime();
        case 'updated-asc':
          return new Date(a.metadata.updatedAt).getTime() - new Date(b.metadata.updatedAt).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'nodes-desc':
          return b.nodes.length - a.nodes.length;
        default:
          return 0;
      }
    });
  }, [projects, workspaceFilter, searchQuery, sortBy]);

  const getWorkspaceBadgeColor = (ws: WorkspaceType) => {
    if (ws === 'developer') return 'blue';
    if (ws === 'video') return 'orange';
    if (ws === 'freelance') return 'purple';
    return 'emerald';
  };

  return (
    <div className={styles.libraryContainer}>
      {/* Top Bar with Title and Main Actions */}
      <div className={styles.topBar}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.heading}>Projects</h1>
            <p style={{ margin: 0, color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)' }}>
              Local visual workspaces saved privately in your browser.
            </p>
          </div>
          <div className={styles.actionsGroup}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/templates')}
            >
              Templates
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsImportDialogOpen(true)}
              icon={<UploadIcon size={16} />}
            >
              Import
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsNewProjectDialogOpen(true)}
              icon={<PlusIcon size={16} />}
            >
              New Project
            </Button>
          </div>
        </div>

        {/* Filter Pills, Search Input, and Sort Select */}
        <div className={styles.controlsRow}>
          <div className={styles.filterPills} role="tablist" aria-label="Filter by workspace">
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'all'}
              className={`${styles.filterPill} ${workspaceFilter === 'all' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('all')}
            >
              All Projects ({projects.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'developer'}
              className={`${styles.filterPill} ${workspaceFilter === 'developer' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('developer')}
            >
              Developer ({projects.filter((p) => p.workspaceType === 'developer').length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'video'}
              className={`${styles.filterPill} ${workspaceFilter === 'video' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('video')}
            >
              Video ({projects.filter((p) => p.workspaceType === 'video').length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'student'}
              className={`${styles.filterPill} ${workspaceFilter === 'student' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('student')}
            >
              Student ({projects.filter((p) => p.workspaceType === 'student').length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'freelance'}
              className={`${styles.filterPill} ${workspaceFilter === 'freelance' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('freelance')}
            >
              Freelance ({projects.filter((p) => p.workspaceType === 'freelance').length})
            </button>
          </div>

          <div className={styles.searchAndSort}>
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search projects by name or description"
            />
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort projects"
            >
              <option value="updated-desc">Recently Updated</option>
              <option value="updated-asc">Oldest Updated</option>
              <option value="title-asc">Title: A &rarr; Z</option>
              <option value="title-desc">Title: Z &rarr; A</option>
              <option value="nodes-desc">Most Nodes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className={styles.contentArea}>
        {loading ? (
          <p style={{ color: 'var(--mr-text-secondary)', textAlign: 'center', padding: 48 }}>
            Loading projects from local storage...
          </p>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className={styles.emptyState}>
            <SearchIcon size={36} style={{ color: 'var(--mr-text-muted)', marginBottom: 12 }} />
            <h2 style={{ margin: '0 0 8px 0', fontSize: 'var(--mr-text-lg)', color: 'var(--mr-text-primary)' }}>
              {searchQuery ? 'No matching projects found' : 'No projects yet'}
            </h2>
            <p style={{ margin: '0 0 20px 0', color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)' }}>
              {searchQuery
                ? 'Try a different search term or reset your workspace filter.'
                : 'Create your first visual workspace or explore starter templates.'}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleCreateNewProject('developer')}
              >
                New Developer Project
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/templates')}
              >
                Explore Templates
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsImportDialogOpen(true)}
              >
                Import File
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredAndSortedProjects.map((project) => (
              <div
                key={project.id}
                className={styles.card}
                onClick={() => navigate(`/workspace/${project.workspaceType}/${project.id}`)}
                tabIndex={0}
                role="button"
                aria-label={`Open project ${project.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/workspace/${project.workspaceType}/${project.id}`);
                  }
                }}
              >
                <div>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>{project.title}</h2>
                    <Badge variant={getWorkspaceBadgeColor(project.workspaceType)}>
                      {project.workspaceType.toUpperCase()}
                    </Badge>
                  </div>
                  {project.metadata.description && (
                    <p className={styles.cardDesc}>{project.metadata.description}</p>
                  )}

                  {/* Compact Visual Preview Strip */}
                  <div className={styles.cardPreviewStrip} aria-hidden="true">
                    {project.nodes.slice(0, 4).map((node) => (
                      <span
                        key={node.id}
                        className={styles.previewMiniNode}
                        style={{ backgroundColor: COLOR_MAP[node.colorToken] || '#7E8BA6' }}
                        title={node.title}
                      />
                    ))}
                    <span className={styles.previewLabel}>
                      {project.nodes.length === 0
                        ? 'Empty canvas'
                        : `${project.nodes.length} node${project.nodes.length === 1 ? '' : 's'}`}
                    </span>
                  </div>
                </div>

                <div>
                  <div className={styles.cardMeta}>
                    <span>{project.nodes.length} nodes</span>
                    &bull;
                    <span>{project.edges.length} connections</span>
                  </div>

                  <div className={styles.cardFooter}>
                    <span style={{ fontSize: 11, color: 'var(--mr-text-muted)' }}>
                      Updated {new Date(project.metadata.updatedAt).toLocaleDateString()}
                    </span>

                    <div className={styles.cardActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToRename(project);
                          setRenameValue(project.title);
                        }}
                        title="Rename project"
                        aria-label="Rename project"
                      >
                        Rename
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDuplicateProject(e, project)}
                        title="Duplicate project"
                        aria-label="Duplicate project"
                      >
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleExportProject(e, project)}
                        title="Export .mindrail.json"
                        aria-label="Export project"
                        icon={<DownloadIcon size={14} />}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project);
                        }}
                        title="Delete project"
                        aria-label="Delete project"
                        icon={<TrashIcon size={14} />}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Storage Footer Info */}
      <footer className={styles.storageFooter}>
        Local-First Privacy: All {projects.length} project(s) are stored on this device in browser IndexedDB.
        Export backups via <code>.mindrail.json</code> to preserve your work.
      </footer>

      {/* New Project Dialog */}
      <Dialog
        isOpen={isNewProjectDialogOpen}
        onClose={() => setIsNewProjectDialogOpen(false)}
        title="Create New Project"
        maxWidth={500}
        footer={
          <Button variant="secondary" size="md" onClick={() => setIsNewProjectDialogOpen(false)}>
            Cancel
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)', margin: 0 }}>
            Choose a workspace specialization for your new project:
          </p>

          <button
            type="button"
            className={styles.card}
            style={{ padding: 14, cursor: 'pointer', textAlign: 'left' }}
            onClick={() => handleCreateNewProject('developer')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ color: 'var(--mr-text-primary)' }}>Developer Workspace</strong>
              <Badge variant="blue">DEV</Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-secondary)' }}>
              Software architecture diagrams, services, databases, code snippets, and task tracking.
            </p>
          </button>

          <button
            type="button"
            className={styles.card}
            style={{ padding: 14, cursor: 'pointer', textAlign: 'left' }}
            onClick={() => handleCreateNewProject('video')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ color: 'var(--mr-text-primary)' }}>Video Creator Workspace</strong>
              <Badge variant="orange">VIDEO</Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-secondary)' }}>
              Scene storyboards, video pacing, script beats, duration planning, and voice-over notes.
            </p>
          </button>

          <button
            type="button"
            className={styles.card}
            style={{ padding: 14, cursor: 'pointer', textAlign: 'left' }}
            onClick={() => handleCreateNewProject('student')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ color: 'var(--mr-text-primary)' }}>Student Workspace</strong>
              <Badge variant="emerald">STUDENT</Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-secondary)' }}>
              Visual concept mind maps, spaced-repetition flashcards, study notes, and checklists.
            </p>
          </button>

          <button
            type="button"
            className={styles.card}
            style={{ padding: 14, cursor: 'pointer', textAlign: 'left' }}
            onClick={() => handleCreateNewProject('freelance')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ color: 'var(--mr-text-primary)' }}>Freelance &amp; Business Workspace</strong>
              <Badge variant="purple">FREELANCE</Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-secondary)' }}>
              Client deliverables, project stages, milestones, creative briefs, revisions, and approvals.
            </p>
          </button>
        </div>
      </Dialog>

      {/* Rename Project Dialog */}
      <Dialog
        isOpen={projectToRename !== null}
        onClose={() => setProjectToRename(null)}
        title="Rename Project"
        maxWidth={440}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setProjectToRename(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirmRename}>
              Save Name
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Project Title"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmRename();
            }}
          />
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={projectToDelete !== null}
        onClose={() => setProjectToDelete(null)}
        title="Delete Project?"
        maxWidth={460}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setProjectToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleConfirmDelete}>
              Delete Project
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)' }}>
          Are you sure you want to permanently delete{' '}
          <strong style={{ color: 'var(--mr-text-primary)' }}>"{projectToDelete?.title}"</strong>?
          This cannot be undone unless you have exported a <code>.mindrail.json</code> file.
        </p>
      </Dialog>

      {/* Import Modal */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={async (imported) => {
          await fetchProjects();
          navigate(`/workspace/${imported.workspaceType}/${imported.id}`);
          showToast(`Imported project "${imported.title}"`, 'success');
        }}
      />
    </div>
  );
}
