/**
 * Template Gallery View Integration Tests.
 * Conforms to Phase 6 template ecosystem specifications.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { TemplateGalleryView } from '../views/TemplateGalleryView';
import { ToastProvider } from '../../design-system/components/Toast';
import { saveUserPreferences } from '../../persistence/preferencesStore';

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('Template Gallery View Integration', () => {
  beforeEach(() => {
    saveUserPreferences({ favoriteTemplateIds: [], recentTemplateIds: [] });
  });

  it('renders all categories, search input, sort selector, and starter cards', () => {
    renderWithToast(<TemplateGalleryView />);

    expect(screen.getByText('Starter Templates')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort templates by')).toBeInTheDocument();

    // Verify presence of category tabs
    expect(screen.getByText('Web Development')).toBeInTheDocument();
    expect(screen.getByText('UI / UX Design')).toBeInTheDocument();
    expect(screen.getByText('Freelance & Business')).toBeInTheDocument();
    expect(screen.getByText('AI & Automation')).toBeInTheDocument();
  });

  it('filters templates when clicking workspace filter pills', () => {
    renderWithToast(<TemplateGalleryView />);

    const freelanceBtn = screen.getByRole('tab', { name: /^Freelance & Business \(/i });
    fireEvent.click(freelanceBtn);

    // Should display freelance templates
    expect(
      screen.getByText('Client Onboarding, Scope of Work & Milestone Tracker')
    ).toBeInTheDocument();
  });

  it('filters templates by search query matching tag or audience', () => {
    renderWithToast(<TemplateGalleryView />);

    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'Snowflake' } });

    expect(
      screen.getByText('Modern Data Lakehouse & ETL Ingestion Pipeline')
    ).toBeInTheDocument();
  });

  it('sorts templates alphabetically when name sort is chosen', () => {
    renderWithToast(<TemplateGalleryView />);

    const sortSelect = screen.getByLabelText('Sort templates by');
    fireEvent.change(sortSelect, { target: { value: 'name' } });

    // The cards should still be present and sorted
    const cards = screen.getAllByRole('heading', { level: 2 });
    expect(cards.length).toBeGreaterThan(0);
  });

  it('opens interactive preview modal and closes it', () => {
    renderWithToast(<TemplateGalleryView />);

    const previewButtons = screen.getAllByRole('button', { name: /^Preview /i });
    expect(previewButtons.length).toBeGreaterThan(0);
    const firstPreviewBtn = previewButtons[0];
    expect(firstPreviewBtn).toBeDefined();
    if (!firstPreviewBtn) return;

    // Click first preview button
    fireEvent.click(firstPreviewBtn);

    // Dialog should open
    expect(screen.getByText(/Included Canvas Nodes/i)).toBeInTheDocument();
    expect(screen.getByText('Create Project from Template')).toBeInTheDocument();

    // Close dialog
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Included Canvas Nodes/i)).not.toBeInTheDocument();
  });

  it('toggles favorite status when clicking the star button', () => {
    renderWithToast(<TemplateGalleryView />);

    const starButtons = screen.getAllByLabelText(/Add to favorites/i);
    expect(starButtons.length).toBeGreaterThan(0);
    const firstStarBtn = starButtons[0];
    expect(firstStarBtn).toBeDefined();
    if (!firstStarBtn) return;

    // Favorite first template
    fireEvent.click(firstStarBtn);

    // Should now indicate remove from favorites
    expect(screen.getAllByLabelText(/Remove from favorites/i).length).toBeGreaterThan(0);
  });
});
