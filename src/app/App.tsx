/**
 * Root Application Shell and Router Outlet.
 * Conforms to docs/ARCHITECTURE.md and docs/ACCESSIBILITY.md.
 */
import React from 'react';
import { ToastProvider } from '../design-system/components/Toast';
import { LogoIcon, SettingsIcon } from '../design-system/components/Icons';
import { useHashRoute } from './router';
import { LandingView } from './views/LandingView';
import { ProjectLibraryView } from './views/ProjectLibraryView';
import { TemplateGalleryView } from './views/TemplateGalleryView';
import { WorkspaceEditorView } from './views/WorkspaceEditorView';
import { SettingsView } from './views/SettingsView';
import styles from './App.module.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown rendering failure';
    return { hasError: true, errorMessage: msg };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            backgroundColor: 'var(--mr-bg-canvas)',
            padding: 32,
            textAlign: 'center',
            gap: 16,
          }}
        >
          <h2 style={{ color: 'var(--mr-color-danger)', margin: 0 }}>An unexpected error occurred</h2>
          <p style={{ color: 'var(--mr-text-secondary)', maxWidth: 500, margin: 0 }}>
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, errorMessage: '' });
              window.location.hash = '#/';
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--mr-accent-primary)',
              color: 'var(--mr-text-on-accent)',
              border: 'none',
              borderRadius: 'var(--mr-radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const route = useHashRoute();
  const isWorkspaceRoute = route.name === 'workspace';

  return (
    <ToastProvider>
      <div className={styles.appRoot}>
        {/* Accessible skip link */}
        <a href="#main-content" className="sr-only skip-to-content">
          Skip to main content
        </a>

        {/* Global Navigation (Shown on non-workspace views) */}
        {!isWorkspaceRoute && (
          <nav className={styles.globalNav} aria-label="Primary navigation">
            <a href="#/" className={styles.brand}>
              <LogoIcon size={24} />
              <span>MindRail Studio</span>
            </a>

            <div className={styles.navLinks}>
              <a
                href="#/projects"
                className={`${styles.navLink} ${route.name === 'projects' ? styles.navLinkActive : ''}`}
              >
                Projects
              </a>
              <a
                href="#/templates"
                className={`${styles.navLink} ${route.name === 'templates' ? styles.navLinkActive : ''}`}
              >
                Templates
              </a>
              <a
                href="#/settings"
                className={`${styles.navLink} ${route.name === 'settings' ? styles.navLinkActive : ''}`}
                aria-label="Settings"
                title="Settings"
              >
                <SettingsIcon size={16} style={{ verticalAlign: 'middle' }} />
              </a>
            </div>
          </nav>
        )}

        {/* Router View Outlet */}
        <main id="main-content" className={styles.mainContent}>
          <ErrorBoundary>
            {route.name === 'landing' && <LandingView />}
            {route.name === 'projects' && <ProjectLibraryView />}
            {route.name === 'templates' && <TemplateGalleryView />}
            {route.name === 'settings' && <SettingsView />}
            {route.name === 'workspace' && (
              <WorkspaceEditorView
                workspaceType={route.workspaceType}
                projectId={route.projectId}
              />
            )}
            {route.name === 'not-found' && <LandingView />}
          </ErrorBoundary>
        </main>
      </div>
    </ToastProvider>
  );
}
