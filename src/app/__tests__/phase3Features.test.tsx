import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectLibraryView } from '../views/ProjectLibraryView';
import { TemplateGalleryView } from '../views/TemplateGalleryView';
import { CreationPalette } from '../../workspaces/CreationPalette';
import { clearAllData, listProjects, saveProject } from '../../persistence/projectRepository';
import { createProject, createNode, createEdge } from '../../domain/factories';
import { ToastProvider } from '../../design-system/components/Toast';

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('Phase 3 Feature Suite', () => {
  beforeEach(async () => {
    await clearAllData();
    window.location.hash = '';
  });

  describe('Project Library: Search, Filter, Sort, Rename & Duplicate Integrity', () => {
    it('filters projects by search and workspace type, and sorts correctly', async () => {
      const p1 = createProject('developer', {
        title: 'Alpha Backend',
        metadata: {
          description: '',
          tags: [],
          createdAt: '2026-10-22T01:00:00.000Z',
          updatedAt: '2026-10-22T01:00:00.000Z',
          completedStudyMinutes: 0,
          completedStudySessions: 0,
        },
        nodes: [createNode('developer', { title: 'Node 1' })],
      });

      const p2 = createProject('video', {
        title: 'Beta Production',
        metadata: {
          description: '',
          tags: [],
          createdAt: '2026-10-22T05:00:00.000Z',
          updatedAt: '2026-10-22T05:00:00.000Z',
          completedStudyMinutes: 0,
          completedStudySessions: 0,
        },
        nodes: [
          createNode('video', { title: 'Scene 1' }),
          createNode('video', { title: 'Scene 2' }),
          createNode('video', { title: 'Scene 3' }),
        ],
      });

      const p3 = createProject('student', {
        title: 'Gamma Calculus',
        metadata: {
          description: '',
          tags: [],
          createdAt: '2026-10-22T03:00:00.000Z',
          updatedAt: '2026-10-22T03:00:00.000Z',
          completedStudyMinutes: 0,
          completedStudySessions: 0,
        },
        nodes: [
          createNode('student', { title: 'Derivatives' }),
          createNode('student', { title: 'Integrals' }),
        ],
      });

      await saveProject(p1);
      await saveProject(p2);
      await saveProject(p3);

      renderWithToast(<ProjectLibraryView />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Backend')).toBeInTheDocument();
        expect(screen.getByText('Beta Production')).toBeInTheDocument();
        expect(screen.getByText('Gamma Calculus')).toBeInTheDocument();
      });

      // Filter by search query
      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'Calculus' } });

      expect(screen.queryByText('Alpha Backend')).not.toBeInTheDocument();
      expect(screen.queryByText('Beta Production')).not.toBeInTheDocument();
      expect(screen.getByText('Gamma Calculus')).toBeInTheDocument();

      // Clear search query
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Alpha Backend')).toBeInTheDocument();

      // Filter by workspace tab: Video
      const videoTab = screen.getByRole('tab', { name: /^Video \(/i });
      fireEvent.click(videoTab);

      expect(screen.queryByText('Alpha Backend')).not.toBeInTheDocument();
      expect(screen.getByText('Beta Production')).toBeInTheDocument();
      expect(screen.queryByText('Gamma Calculus')).not.toBeInTheDocument();

      // Switch back to All
      const allTab = screen.getByRole('tab', { name: /^All Projects \(/i });
      fireEvent.click(allTab);

      // Test Sorting: Most Nodes
      const sortSelect = screen.getByRole('combobox', { name: /Sort projects/i });
      fireEvent.change(sortSelect, { target: { value: 'nodes-desc' } });

      const cards = screen.getAllByRole('heading', { level: 2 });
      expect(cards[0]?.textContent).toBe('Beta Production'); // 3 nodes
      expect(cards[1]?.textContent).toBe('Gamma Calculus'); // 2 nodes
      expect(cards[2]?.textContent).toBe('Alpha Backend'); // 1 node
    });

    it('renames a project and persists changes to IndexedDB', async () => {
      const p = createProject('developer', { title: 'Initial Name' });
      await saveProject(p);

      renderWithToast(<ProjectLibraryView />);

      await waitFor(() => {
        expect(screen.getByText('Initial Name')).toBeInTheDocument();
      });

      // Click rename button
      const renameBtn = screen.getByRole('button', { name: 'Rename project' });
      fireEvent.click(renameBtn);

      // Verify modal is open
      expect(screen.getByText('Rename Project')).toBeInTheDocument();
      const input = screen.getByLabelText('Project Title');
      fireEvent.change(input, { target: { value: 'Renamed High Scalability' } });

      const saveBtn = screen.getByRole('button', { name: 'Save Name' });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Renamed High Scalability')).toBeInTheDocument();
      });

      const stored = await listProjects();
      expect(stored[0]?.title).toBe('Renamed High Scalability');
    });

    it('duplicates project with deep node and edge referential integrity', async () => {
      const nodeA = createNode('developer', { title: 'Gateway' });
      const nodeB = createNode('developer', { title: 'Service' });
      const edge = createEdge({
        sourceNodeId: nodeA.id,
        targetNodeId: nodeB.id,
        sourcePort: 'right',
        targetPort: 'left',
      });
      const p = createProject('developer', {
        title: 'Architecture Blueprint',
        nodes: [nodeA, nodeB],
        edges: [edge],
      });
      await saveProject(p);

      renderWithToast(<ProjectLibraryView />);

      await waitFor(() => {
        expect(screen.getByText('Architecture Blueprint')).toBeInTheDocument();
      });

      // Click duplicate button
      const duplicateBtn = screen.getByRole('button', { name: 'Duplicate project' });
      fireEvent.click(duplicateBtn);

      await waitFor(async () => {
        const stored = await listProjects();
        expect(stored.length).toBe(2);
      });

      const stored = await listProjects();
      const copy = stored.find((item) => item.title.includes('(Copy)'));
      expect(copy).toBeDefined();
      if (!copy) return;

      // Verify node IDs were re-keyed
      expect(copy.nodes.length).toBe(2);
      expect(copy.nodes[0]?.id).not.toBe(nodeA.id);
      expect(copy.nodes[1]?.id).not.toBe(nodeB.id);

      // Verify edge referential integrity was maintained to the cloned nodes
      expect(copy.edges.length).toBe(1);
      const clonedEdge = copy.edges[0]!;
      expect(clonedEdge.id).not.toBe(edge.id);
      expect(clonedEdge.sourceNodeId).toBe(copy.nodes[0]?.id);
      expect(clonedEdge.targetNodeId).toBe(copy.nodes[1]?.id);
    });
  });

  describe('Template Gallery: Search, Filtering & Interactive Previews', () => {
    it('filters templates and opens preview dialog with node structure', async () => {
      renderWithToast(<TemplateGalleryView />);

      // Verify template count
      expect(screen.getByText('Starter Templates')).toBeInTheDocument();
      expect(screen.getByText('Microservice Architecture & Sprint Tasks')).toBeInTheDocument();
      expect(screen.getByText('YouTube Video Storyboard & Pacing')).toBeInTheDocument();
      expect(screen.getByText('Computer Science: Operating Systems & Flashcards')).toBeInTheDocument();

      // Search template
      const searchInput = screen.getByPlaceholderText('Search templates...');
      fireEvent.change(searchInput, { target: { value: 'Microservice' } });

      expect(screen.getByText('Microservice Architecture & Sprint Tasks')).toBeInTheDocument();
      expect(screen.queryByText('Computer Science: Operating Systems & Flashcards')).not.toBeInTheDocument();

      // Open Preview dialog
      const previewBtn = screen.getByRole('button', { name: /Preview Microservice Architecture & Sprint Tasks/i });
      fireEvent.click(previewBtn);

      // Verify preview dialog content
      expect(screen.getByText('Template Preview: Microservice Architecture & Sprint Tasks')).toBeInTheDocument();
      expect(screen.getByText('API Gateway')).toBeInTheDocument();
      expect(screen.getByText('Auth Service')).toBeInTheDocument();
      expect(screen.getByText('User Database')).toBeInTheDocument();
      expect(screen.getByText('Run penetration tests')).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeBtn);

      expect(screen.queryByText('Template Preview: Microservice Architecture & Sprint Tasks')).not.toBeInTheDocument();
    });
  });

  describe('CreationPalette: Drawer Toggle & Accessibility', () => {
    it('supports isOpen drawer mode and triggers onClose when closed', () => {
      const handleClose = vi.fn();
      const handleAddNode = vi.fn();

      const { rerender } = render(
        <CreationPalette
          workspaceType="developer"
          onAddNode={handleAddNode}
          viewportCenter={{ x: 0, y: 0 }}
          isOpen={false}
          onClose={handleClose}
        />
      );

      // Palette is in DOM
      expect(screen.getByLabelText('Creation Palette')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Close palette' })).toBeInTheDocument();

      // When open, close button triggers onClose
      rerender(
        <CreationPalette
          workspaceType="developer"
          onAddNode={handleAddNode}
          viewportCenter={{ x: 0, y: 0 }}
          isOpen={true}
          onClose={handleClose}
        />
      );

      const closeBtn = screen.getByRole('button', { name: 'Close palette' });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Clicking node spawns item
      const addServiceBtn = screen.getByRole('button', { name: /Service Node/i });
      fireEvent.click(addServiceBtn);
      expect(handleAddNode).toHaveBeenCalledTimes(1);
    });
  });
});
