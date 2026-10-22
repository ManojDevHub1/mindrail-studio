/**
 * Accessible Modal Dialog for Exporting Projects into Multiple Formats.
 * Conforms to docs/IMPORT_EXPORT_SPEC.md and Phase 5 Feature A.
 */
import { useState } from 'react';
import type { Project } from '../domain/models';
import { Badge } from '../design-system/components/Badge';
import { Button } from '../design-system/components/Button';
import { Dialog } from '../design-system/components/Dialog';
import { DownloadIcon } from '../design-system/components/Icons';
import { downloadProjectFile } from './exportProjectJson';
import { downloadSvgFile } from './exportSvgDiagram';
import { downloadPngFile } from './exportPngDiagram';
import { downloadMarkdownFile } from './exportMarkdownStoryboard';
import styles from './ExportDialog.module.css';

export interface ExportDialogProps {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
  onSuccess: (filename: string, formatDescription: string) => void;
  onError: (errorMessage: string) => void;
}

export function ExportDialog({
  isOpen,
  project,
  onClose,
  onSuccess,
  onError,
}: ExportDialogProps) {
  const [isExportingPng, setIsExportingPng] = useState(false);

  const handleExportJson = () => {
    try {
      const filename = downloadProjectFile(project);
      onSuccess(filename, 'Canonical JSON archive');
      onClose();
    } catch {
      onError('Failed to generate project JSON file.');
    }
  };

  const handleExportSvg = () => {
    try {
      const filename = downloadSvgFile(project);
      onSuccess(filename, 'Standalone SVG diagram');
      onClose();
    } catch {
      onError('Failed to generate SVG diagram.');
    }
  };

  const handleExportPng = async () => {
    setIsExportingPng(true);
    try {
      const filename = await downloadPngFile(project, { scale: 2 });
      onSuccess(filename, 'High-resolution PNG image');
      onClose();
    } catch {
      onError('Failed to rasterize diagram into PNG. Please try SVG export.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportMarkdown = () => {
    try {
      const filename = downloadMarkdownFile(project);
      const desc =
        project.workspaceType === 'video'
          ? 'Markdown storyboard & script'
          : 'Markdown study guide';
      onSuccess(filename, desc);
      onClose();
    } catch {
      onError('Failed to generate Markdown document.');
    }
  };

  const ws = project.workspaceType;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export Studio"
      maxWidth={620}
      footer={
        <Button variant="secondary" size="md" onClick={onClose}>
          Close
        </Button>
      }
    >
      <p style={{ margin: 0, color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)' }}>
        Export your visual workspace into clean presentation and archival formats. All exports run 100% locally in your browser.
      </p>

      <div className={styles.exportGrid}>
        {/* Canonical JSON Project File */}
        <div className={styles.exportOptionCard}>
          <div className={styles.optionInfo}>
            <div className={styles.optionTitleRow}>
              <h4 className={styles.optionTitle}>MindRail Project Archive</h4>
              <Badge variant="blue">.mindrail.json</Badge>
            </div>
            <p className={styles.optionDescription}>
              Complete lossless backup including all nodes, edge coordinates, checklists, and revision history. Can be re-imported on any device.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportJson}
            icon={<DownloadIcon size={14} />}
          >
            Export JSON
          </Button>
        </div>

        {/* Vector SVG Diagram */}
        <div className={styles.exportOptionCard}>
          <div className={styles.optionInfo}>
            <div className={styles.optionTitleRow}>
              <h4 className={styles.optionTitle}>
                {ws === 'developer'
                  ? 'Architecture Vector Diagram'
                  : ws === 'video'
                    ? 'Storyboard Vector Diagram'
                    : 'Concept Map Vector Diagram'}
              </h4>
              <Badge variant="purple">.svg</Badge>
            </div>
            <p className={styles.optionDescription}>
              Standalone vector SVG drawing with dark canvas theme, node cards, and curved connection paths. Clean and free of editor UI chrome.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportSvg}
            icon={<DownloadIcon size={14} />}
          >
            Export SVG
          </Button>
        </div>

        {/* Rasterized PNG Image */}
        <div className={styles.exportOptionCard}>
          <div className={styles.optionInfo}>
            <div className={styles.optionTitleRow}>
              <h4 className={styles.optionTitle}>High-Resolution Image</h4>
              <Badge variant="emerald">.png</Badge>
            </div>
            <p className={styles.optionDescription}>
              Crisp $2\times$ scaled raster image ideal for slide decks, README documentation, chat sharing, or pull request attachments.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportPng}
            disabled={isExportingPng}
            icon={<DownloadIcon size={14} />}
          >
            {isExportingPng ? 'Rendering...' : 'Export PNG'}
          </Button>
        </div>

        {/* Markdown Document (Video Storyboard or Student Study Guide) */}
        {(ws === 'video' || ws === 'student') && (
          <div className={styles.exportOptionCard}>
            <div className={styles.optionInfo}>
              <div className={styles.optionTitleRow}>
                <h4 className={styles.optionTitle}>
                  {ws === 'video' ? 'Storyboard & Spoken Script' : 'Study Guide & Flashcards'}
                </h4>
                <Badge variant="orange">.md</Badge>
              </div>
              <p className={styles.optionDescription}>
                {ws === 'video'
                  ? 'Formatted production document with scene timecodes, spoken dialogue, voice-over cues, framing, and shot list.'
                  : 'Structured notes summary with core concept definitions, spaced-repetition Q&A flashcards, and revision tasks.'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportMarkdown}
              icon={<DownloadIcon size={14} />}
            >
              Export Markdown
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
