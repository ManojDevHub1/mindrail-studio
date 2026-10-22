/**
 * Top Studio Header Bar.
 * Project title, workspace switcher, save status, undo/redo, export, import.
 */
import { useState } from 'react';
import type { WorkspaceType } from '../domain/models';
import type { SaveStatus } from '../state/useAutosave';
import { Badge } from '../design-system/components/Badge';
import { Button } from '../design-system/components/Button';
import {
  DownloadIcon,
  LogoIcon,
  PlusIcon,
  RedoIcon,
  UndoIcon,
  UploadIcon,
} from '../design-system/components/Icons';
import styles from './WorkspaceHeader.module.css';

export interface WorkspaceHeaderProps {
  title: string;
  workspaceType: WorkspaceType;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  isPaletteOpen?: boolean;
  onTogglePalette?: () => void;
  onUpdateTitle: (newTitle: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: () => void;
  onEmergencyExport?: () => void;
  onSaveAsTemplate?: () => void;
}

export function WorkspaceHeader({
  title,
  workspaceType,
  saveStatus,
  canUndo,
  canRedo,
  isPaletteOpen = true,
  onTogglePalette,
  onUpdateTitle,
  onUndo,
  onRedo,
  onExport,
  onImport,
  onEmergencyExport,
  onSaveAsTemplate,
}: WorkspaceHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue.trim() !== title) {
      onUpdateTitle(titleValue.trim());
    } else {
      setTitleValue(title);
    }
  };

  const getWorkspaceColor = () => {
    switch (workspaceType) {
      case 'developer':
        return 'blue';
      case 'video':
        return 'orange';
      case 'student':
        return 'emerald';
      case 'freelance':
        return 'purple';
    }
  };

  const renderSaveBadge = () => {
    switch (saveStatus.status) {
      case 'saved':
        return (
          <div className={styles.saveBadge} title={`Last saved: ${saveStatus.lastSavedAt}`}>
            <span className={`${styles.saveDot} ${styles.saveDotSaved}`} />
            <span className={styles.saveText}>Saved locally</span>
          </div>
        );
      case 'saving':
        return (
          <div className={styles.saveBadge}>
            <span className={`${styles.saveDot} ${styles.saveDotSaving}`} />
            <span className={styles.saveText}>Saving...</span>
          </div>
        );
      case 'unsaved-changes':
        return (
          <div className={styles.saveBadge}>
            <span className={`${styles.saveDot} ${styles.saveDotUnsaved}`} />
            <span className={styles.saveText}>Unsaved changes...</span>
          </div>
        );
      case 'error':
        return (
          <div
            className={styles.saveBadge}
            style={{ cursor: 'pointer', color: 'var(--mr-color-danger)' }}
            onClick={onEmergencyExport}
            title={`${saveStatus.message} Click to export backup.`}
          >
            <span className={`${styles.saveDot} ${styles.saveDotError}`} />
            <span className={styles.saveText}>Save error &bull; Export backup</span>
          </div>
        );
    }
  };

  return (
    <header className={styles.header} role="banner">
      <div className={styles.leftSection}>
        <a href="#/projects" className={styles.brandLink} title="Return to Projects">
          <LogoIcon size={24} />
          <span>MindRail</span>
        </a>

        <div className={styles.divider} />

        <div className={styles.titleContainer}>
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              className={styles.titleInput}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitleValue(title);
                  setIsEditingTitle(false);
                }
              }}
              aria-label="Project Title"
            />
          ) : (
            <span
              className={styles.titleDisplay}
              onClick={() => {
                setTitleValue(title);
                setIsEditingTitle(true);
              }}
              title="Click to rename project"
            >
              {title}
            </span>
          )}

          <Badge variant={getWorkspaceColor()}>
            {workspaceType.toUpperCase()}
          </Badge>
        </div>

        {renderSaveBadge()}
      </div>

      <div className={styles.rightSection}>
        {onTogglePalette && (
          <Button
            variant={isPaletteOpen ? 'secondary' : 'primary'}
            size="sm"
            onClick={onTogglePalette}
            title={isPaletteOpen ? 'Hide Creation Palette' : 'Show Creation Palette'}
            aria-label={isPaletteOpen ? 'Hide Creation Palette' : 'Show Creation Palette'}
            icon={<PlusIcon size={14} />}
          >
            <span className={styles.btnTextCollapse}>Add Node</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          icon={<UndoIcon size={15} />}
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
          icon={<RedoIcon size={15} />}
        />

        <div className={styles.divider} />

        {onSaveAsTemplate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveAsTemplate}
            title="Save Current Project as Reusable Custom Template"
            aria-label="Save as Template"
          >
            <span className={styles.btnTextCollapseTablet}>Save as Template</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onImport}
          title="Import .mindrail.json Project"
          aria-label="Import Project"
          icon={<UploadIcon size={14} />}
        >
          <span className={styles.btnTextCollapse}>Import</span>
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onExport}
          title="Export .mindrail.json Project"
          aria-label="Export Project"
          icon={<DownloadIcon size={14} />}
        >
          <span className={styles.btnTextCollapse}>Export</span>
        </Button>
      </div>
    </header>
  );
}
