/**
 * Template Gallery View.
 * Displays universal starter templates across Developer, Video, Student, and Freelance workspaces,
 * with 15 category tabs, multi-field search, difficulty filters, favorites, custom templates,
 * and rich non-mutating preview modals before instantiation.
 */
import { useEffect, useMemo, useState } from 'react';
import type {
  EntityId,
  NodeColorToken,
  Project,
  ProjectTemplate,
  TemplateCategory,
  WorkspaceType,
} from '../../domain/models';
import { BUILT_IN_TEMPLATES, TEMPLATE_CATEGORIES } from '../../domain/builtInTemplates';
import { createProject, generateEntityId } from '../../domain/factories';
import {
  deleteCustomTemplate,
  listCustomTemplates,
  saveProject,
} from '../../persistence/projectRepository';
import {
  addRecentTemplate,
  loadUserPreferences,
  toggleFavoriteTemplate,
} from '../../persistence/preferencesStore';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import { Dialog } from '../../design-system/components/Dialog';
import { Input } from '../../design-system/components/FormControls';
import { SearchIcon, StarIcon, TrashIcon } from '../../design-system/components/Icons';
import { useToast } from '../../design-system/components/Toast';
import { navigate } from '../router';
import { TemplateStructurePreview } from './TemplateStructurePreview';
import styles from './TemplateGalleryView.module.css';

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

export function TemplateGalleryView() {
  const { showToast } = useToast();
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceType | 'all' | 'custom'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'name' | 'time'>('featured');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showRecentsOnly, setShowRecentsOnly] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ProjectTemplate | null>(null);

  // Persistence state
  const [customTemplates, setCustomTemplates] = useState<ProjectTemplate[]>([]);
  const [favorites, setFavorites] = useState<readonly string[]>(() => {
    return loadUserPreferences().favoriteTemplateIds;
  });
  const [recents] = useState<readonly string[]>(() => {
    return loadUserPreferences().recentTemplateIds;
  });

  useEffect(() => {
    let isCancelled = false;
    listCustomTemplates().then((templates) => {
      if (!isCancelled) {
        setCustomTemplates(templates);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  // Compute all available templates depending on workspace view
  const candidateTemplates = useMemo(() => {
    if (workspaceFilter === 'custom') {
      return customTemplates;
    }
    const combined = [...BUILT_IN_TEMPLATES, ...customTemplates];
    if (workspaceFilter === 'all') {
      return combined;
    }
    return combined.filter((t) => t.workspaceType === workspaceFilter);
  }, [workspaceFilter, customTemplates]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = candidateTemplates.filter((t) => {
      // Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) {
        return false;
      }

      // Favorites filter
      if (showFavoritesOnly && !favorites.includes(t.id)) {
        return false;
      }

      // Recents filter
      if (showRecentsOnly && !recents.includes(t.id)) {
        return false;
      }

      // Multi-field search
      if (query !== '') {
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesSummary = t.summary.toLowerCase().includes(query);
        const matchesTags = t.tags ? t.tags.some((tag) => tag.toLowerCase().includes(query)) : false;
        const matchesAudience = t.targetAudience ? t.targetAudience.toLowerCase().includes(query) : false;
        const matchesCategory = t.category ? t.category.toLowerCase().includes(query) : false;
        const matchesSubCategory = t.subCategory ? t.subCategory.toLowerCase().includes(query) : false;

        if (!matchesName && !matchesSummary && !matchesTags && !matchesAudience && !matchesCategory && !matchesSubCategory) {
          return false;
        }
      }

      return true;
    });

    // Sort templates
    return filtered.sort((a, b) => {
      if (sortBy === 'featured') {
        const featA = a.featured ? 1 : 0;
        const featB = b.featured ? 1 : 0;
        if (featA !== featB) return featB - featA;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'time') {
        const timeA = a.estimatedSetupMinutes ?? 10;
        const timeB = b.estimatedSetupMinutes ?? 10;
        if (timeA !== timeB) return timeA - timeB;
        return a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [candidateTemplates, categoryFilter, showFavoritesOnly, showRecentsOnly, favorites, recents, searchQuery, sortBy]);

  const handleToggleFavorite = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleFavoriteTemplate(templateId);
    setFavorites([...updated]);
    showToast(
      updated.includes(templateId) ? 'Added to favorite templates' : 'Removed from favorite templates',
      'info'
    );
  };

  const handleDeleteCustomTemplate = async (templateId: EntityId) => {
    try {
      await deleteCustomTemplate(templateId);
      setCustomTemplates((prev) => prev.filter((t) => t.id !== templateId));
      setTemplateToDelete(null);
      showToast('Custom template deleted', 'info');
    } catch {
      showToast('Failed to delete custom template', 'danger');
    }
  };

  const handleUseTemplate = async (template: ProjectTemplate) => {
    // Deep clone nodes and edges with fresh entity IDs, mapping old IDs to new IDs
    const idMap = new Map<EntityId, EntityId>();
    const clonedNodes = template.nodes.map((node) => {
      const freshId = generateEntityId();
      idMap.set(node.id, freshId);
      return {
        ...node,
        id: freshId,
      };
    });

    const clonedEdges = template.edges.map((edge) => ({
      ...edge,
      id: generateEntityId(),
      sourceNodeId: idMap.get(edge.sourceNodeId) || edge.sourceNodeId,
      targetNodeId: idMap.get(edge.targetNodeId) || edge.targetNodeId,
    }));

    const newProject: Project = createProject(template.workspaceType, {
      title: template.name,
      metadata: {
        description: template.summary,
        tags: [template.workspaceType, 'template', ...(template.tags ? [...template.tags] : [])],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedStudyMinutes: 0,
        completedStudySessions: 0,
        sourceTemplateId: template.id,
      },
      settings: template.defaultSettings,
      nodes: clonedNodes,
      edges: clonedEdges,
      checklist: template.checklist.map((item) => ({ ...item, id: generateEntityId() })),
    });

    try {
      await saveProject(newProject);
      addRecentTemplate(template.id);
      setPreviewTemplate(null);
      navigate(`/workspace/${newProject.workspaceType}/${newProject.id}`);
      showToast(`Created project from template "${template.name}"`, 'success');
    } catch {
      showToast('Failed to instantiate template in local storage', 'danger');
    }
  };

  const getWorkspaceColor = (ws: WorkspaceType) => {
    if (ws === 'developer') return 'blue';
    if (ws === 'video') return 'orange';
    if (ws === 'freelance') return 'purple';
    return 'emerald';
  };

  const getDifficultyColor = (diff?: string) => {
    if (diff === 'beginner') return 'emerald';
    if (diff === 'advanced') return 'purple';
    return 'blue';
  };

  return (
    <div className={styles.galleryContainer}>
      {/* Top Header Bar */}
      <div className={styles.topBar}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.heading}>Starter Templates</h1>
            <p style={{ margin: 0, color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)' }}>
              Jumpstart your projects with production-grade templates tailored for developers, creators, students, and freelancers.
            </p>
          </div>
          <div>
            <Button variant="secondary" size="md" onClick={() => navigate('/projects')}>
              Go to Projects &rarr;
            </Button>
          </div>
        </div>

        {/* Workspace Pills & Favorites */}
        <div className={styles.controlsRow}>
          <div className={styles.filterPills} role="tablist" aria-label="Template Workspace Filter">
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'all'}
              className={`${styles.filterPill} ${workspaceFilter === 'all' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('all')}
            >
              All Templates ({BUILT_IN_TEMPLATES.length + customTemplates.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'developer'}
              className={`${styles.filterPill} ${workspaceFilter === 'developer' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('developer')}
            >
              Developer ({BUILT_IN_TEMPLATES.filter((t) => t.workspaceType === 'developer').length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'video'}
              className={`${styles.filterPill} ${workspaceFilter === 'video' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('video')}
            >
              Video Creator ({BUILT_IN_TEMPLATES.filter((t) => t.workspaceType === 'video').length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'student'}
              className={`${styles.filterPill} ${workspaceFilter === 'student' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('student')}
            >
              Student ({BUILT_IN_TEMPLATES.filter((t) => t.workspaceType === 'student').length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'freelance'}
              className={`${styles.filterPill} ${workspaceFilter === 'freelance' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('freelance')}
            >
              Freelance &amp; Business ({BUILT_IN_TEMPLATES.filter((t) => t.workspaceType === 'freelance').length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceFilter === 'custom'}
              className={`${styles.filterPill} ${workspaceFilter === 'custom' ? styles.filterPillActive : ''}`}
              onClick={() => setWorkspaceFilter('custom')}
            >
              My Templates ({customTemplates.length})
            </button>
          </div>

          <div className={styles.searchAndSort}>
            <button
              type="button"
              className={`${styles.filterPill} ${showFavoritesOnly ? styles.filterPillActive : ''}`}
              onClick={() => {
                setShowFavoritesOnly((prev) => !prev);
                if (!showFavoritesOnly) setShowRecentsOnly(false);
              }}
              title="Show only favorited templates"
            >
              <StarIcon size={14} filled={showFavoritesOnly} />
              <span>Favorites ({favorites.length})</span>
            </button>

            <button
              type="button"
              className={`${styles.filterPill} ${showRecentsOnly ? styles.filterPillActive : ''}`}
              onClick={() => {
                setShowRecentsOnly((prev) => !prev);
                if (!showRecentsOnly) setShowFavoritesOnly(false);
              }}
              title="Show recently used templates"
              aria-label="Filter by recently used templates"
            >
              <span>🕒 Recents ({recents.length})</span>
            </button>

            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'name' | 'time')}
              aria-label="Sort templates by"
            >
              <option value="featured">Sort: Featured First</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="time">Sort: Fastest Setup Time</option>
            </select>

            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search templates by name, tags, or description"
            />
          </div>
        </div>

        {/* 15 Category Tabs Horizontal Bar */}
        <div className={styles.categoryBar} role="tablist" aria-label="Categories">
          <button
            type="button"
            role="tab"
            aria-selected={categoryFilter === 'all'}
            className={`${styles.categoryPill} ${categoryFilter === 'all' ? styles.categoryPillActive : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            All Categories
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={categoryFilter === cat.id}
              className={`${styles.categoryPill} ${categoryFilter === cat.id ? styles.categoryPillActive : ''}`}
              onClick={() => setCategoryFilter(cat.id)}
              title={cat.description}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Area */}
      <main className={styles.contentArea}>
        {filteredTemplates.length === 0 ? (
          <div className={styles.emptyState}>
            <SearchIcon size={36} style={{ color: 'var(--mr-text-muted)', marginBottom: 12 }} />
            <h2 style={{ margin: '0 0 8px 0', fontSize: 'var(--mr-text-lg)', color: 'var(--mr-text-primary)' }}>
              No matching templates found
            </h2>
            <p style={{ margin: '0 0 16px 0', color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)' }}>
              Try adjusting your search keywords, category filter, or workspace tab.
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setWorkspaceFilter('all');
                setCategoryFilter('all');
                setShowFavoritesOnly(false);
                setShowRecentsOnly(false);
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredTemplates.map((template) => {
              const isFav = favorites.includes(template.id);
              const complexityLabel =
                template.nodes.length <= 4
                  ? 'STARTER'
                  : template.nodes.length <= 6
                  ? 'STANDARD'
                  : 'COMPREHENSIVE';
              const complexityVariant =
                template.nodes.length <= 4
                  ? 'neutral'
                  : template.nodes.length <= 6
                  ? 'blue'
                  : 'purple';

              return (
                <div key={template.id} className={styles.card}>
                  <div>
                    <div className={styles.cardTop}>
                      <div className={styles.badgesRow}>
                        <Badge variant={getWorkspaceColor(template.workspaceType)}>
                          {template.workspaceType.toUpperCase()}
                        </Badge>
                        {template.category && (
                          <Badge variant="neutral">
                            {template.category}
                          </Badge>
                        )}
                        {template.difficulty && (
                          <Badge variant={getDifficultyColor(template.difficulty)}>
                            {template.difficulty.toUpperCase()}
                          </Badge>
                        )}
                        <Badge variant={complexityVariant}>
                          {complexityLabel}
                        </Badge>
                        {template.featured && (
                          <Badge variant="amber">
                            FEATURED
                          </Badge>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`${styles.starButton} ${isFav ? styles.starButtonActive : ''}`}
                        onClick={(e) => handleToggleFavorite(template.id, e)}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <StarIcon size={18} filled={isFav} />
                      </button>
                    </div>

                    <h2 className={styles.cardTitle}>{template.name}</h2>
                    <p className={styles.cardDesc}>{template.summary}</p>

                    {/* Accurate Visual Structure Schematic */}
                    <div style={{ margin: '8px 0 12px 0' }}>
                      <TemplateStructurePreview
                        nodes={template.nodes}
                        edges={template.edges}
                        height={100}
                      />
                    </div>

                    {template.targetAudience && (
                      <div className={styles.audienceHint}>
                        👥 <strong>Audience:</strong> {template.targetAudience}
                      </div>
                    )}

                    {template.tags && template.tags.length > 0 && (
                      <div className={styles.tagsContainer}>
                        {template.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className={styles.tagChip}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className={styles.metaRow}>
                      {template.estimatedSetupMinutes && (
                        <>
                          <span>⏱️ ~{template.estimatedSetupMinutes}m setup</span>
                          &bull;
                        </>
                      )}
                      <span>{template.nodes.length} Starter Nodes</span>
                      &bull;
                      <span>{template.edges.length} Connections</span>
                      &bull;
                      <span>{template.checklist.length} Tasks</span>
                    </div>

                    <div className={styles.cardActions}>
                      <Button
                        variant="primary"
                        size="md"
                        style={{ flex: 1 }}
                        onClick={() => handleUseTemplate(template)}
                      >
                        Use Template
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setPreviewTemplate(template)}
                        title={`Preview ${template.name}`}
                        aria-label={`Preview ${template.name}`}
                      >
                        Preview
                      </Button>
                      {!template.isBuiltIn && (
                        <Button
                          variant="ghost"
                          size="md"
                          onClick={() => setTemplateToDelete(template)}
                          title="Delete custom template"
                          aria-label={`Delete custom template ${template.name}`}
                        >
                          <TrashIcon size={15} style={{ color: 'var(--mr-color-danger)' }} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Template Preview Dialog */}
      <Dialog
        isOpen={previewTemplate !== null}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate ? `Template Preview: ${previewTemplate.name}` : 'Template Preview'}
        maxWidth={620}
        footer={
          previewTemplate && (
            <>
              <Button variant="secondary" size="md" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleUseTemplate(previewTemplate)}
              >
                Create Project from Template
              </Button>
            </>
          )
        }
      >
        {previewTemplate && (
          <div className={styles.previewDialogContent}>
            {/* Meta Grid */}
            <div className={styles.previewMetaGrid}>
              <div className={styles.previewMetaItem}>
                <span className={styles.previewMetaLabel}>Workspace</span>
                <span className={styles.previewMetaValue}>{previewTemplate.workspaceType.toUpperCase()}</span>
              </div>
              {previewTemplate.category && (
                <div className={styles.previewMetaItem}>
                  <span className={styles.previewMetaLabel}>Category</span>
                  <span className={styles.previewMetaValue}>{previewTemplate.category}</span>
                </div>
              )}
              {previewTemplate.difficulty && (
                <div className={styles.previewMetaItem}>
                  <span className={styles.previewMetaLabel}>Difficulty</span>
                  <span className={styles.previewMetaValue}>{previewTemplate.difficulty}</span>
                </div>
              )}
              {previewTemplate.estimatedSetupMinutes && (
                <div className={styles.previewMetaItem}>
                  <span className={styles.previewMetaLabel}>Setup Time</span>
                  <span className={styles.previewMetaValue}>~{previewTemplate.estimatedSetupMinutes} minutes</span>
                </div>
              )}
            </div>

            {/* Architectural Layout Schematic */}
            <div>
              <span style={{ fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Architectural Layout Schematic
              </span>
              <TemplateStructurePreview
                nodes={previewTemplate.nodes}
                edges={previewTemplate.edges}
                height={170}
              />
            </div>

            <div>
              <span style={{ fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Description
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: 'var(--mr-text-sm)', color: 'var(--mr-text-secondary)', lineHeight: 1.5 }}>
                {previewTemplate.summary}
              </p>
            </div>

            {previewTemplate.targetAudience && (
              <div>
                <span style={{ fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Target Audience
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--mr-text-sm)', color: 'var(--mr-text-primary)' }}>
                  {previewTemplate.targetAudience}
                </p>
              </div>
            )}

            <div>
              <span style={{ fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Included Canvas Nodes ({previewTemplate.nodes.length})
              </span>
              <div className={styles.previewNodesList}>
                {previewTemplate.nodes.map((n) => (
                  <div key={n.id} className={styles.previewNodeItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className={styles.previewNodeColor}
                        style={{ backgroundColor: COLOR_MAP[n.colorToken] || '#7E8BA6' }}
                      />
                      <strong style={{ color: 'var(--mr-text-primary)' }}>{n.title}</strong>
                    </div>
                    <span style={{ color: 'var(--mr-text-muted)' }}>{n.category || n.payload.kind}</span>
                  </div>
                ))}
              </div>
            </div>

            {previewTemplate.checklist.length > 0 && (
              <div>
                <span style={{ fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Pre-configured Checklist ({previewTemplate.checklist.length})
                </span>
                <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-secondary)' }}>
                  {previewTemplate.checklist.map((item) => (
                    <li key={item.id} style={{ marginBottom: 4 }}>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Delete Custom Template Confirmation Dialog */}
      <Dialog
        isOpen={templateToDelete !== null}
        onClose={() => setTemplateToDelete(null)}
        title="Delete Custom Template"
        maxWidth={440}
        footer={
          templateToDelete && (
            <>
              <Button variant="secondary" size="md" onClick={() => setTemplateToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => handleDeleteCustomTemplate(templateToDelete.id)}
              >
                Delete Template
              </Button>
            </>
          )
        }
      >
        <p style={{ margin: 0, fontSize: 'var(--mr-text-sm)', color: 'var(--mr-text-secondary)', lineHeight: 1.5 }}>
          Are you sure you want to delete the custom template{' '}
          <strong style={{ color: 'var(--mr-text-primary)' }}>&ldquo;{templateToDelete?.name}&rdquo;</strong>?
          This action cannot be undone.
        </p>
      </Dialog>
    </div>
  );
}
