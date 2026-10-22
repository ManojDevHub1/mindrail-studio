/**
 * Settings & Local Storage Management View.
 * Conforms to docs/LOCAL_FIRST_AND_PRIVACY.md and docs/UX_FLOWS.md.
 */
import { useEffect, useRef, useState } from 'react';
import { clearAllData, listProjects, saveProject } from '../../persistence/projectRepository';
import { generateEntityId } from '../../domain/factories';
import {
  loadUserPreferences,
  saveUserPreferences,
  type UserPreferences,
} from '../../persistence/preferencesStore';
import { serializeProjectToEnvelopeJson } from '../../import-export/exportProjectJson';
import { validateBackupArchive } from '../../import-export/validateProjectImport';
import { Button } from '../../design-system/components/Button';
import { Dialog } from '../../design-system/components/Dialog';
import { Select } from '../../design-system/components/FormControls';
import { DownloadIcon, TrashIcon, UploadIcon } from '../../design-system/components/Icons';
import { useToast } from '../../design-system/components/Toast';
import { navigate } from '../router';
import type { Project } from '../../domain/models';

export function SettingsView() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prefs, setPrefs] = useState<UserPreferences>(loadUserPreferences());
  const [projectCount, setProjectCount] = useState<number>(0);
  const [projectDataKb, setProjectDataKb] = useState<string>('0');
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [storageEstimate, setStorageEstimate] = useState<{ usageMb: string; quotaMb: string } | null>(null);
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);

  // Restore archive state
  const [pendingRestoreProjects, setPendingRestoreProjects] = useState<readonly Project[] | null>(null);
  const [restoreDuplicateMode, setRestoreDuplicateMode] = useState<'copy' | 'overwrite'>('copy');

  const refreshProjectStats = () => {
    listProjects().then((allProjects) => {
      setProjectCount(allProjects.length);
      const totalChars = allProjects.reduce((acc, p) => acc + JSON.stringify(p).length, 0);
      setProjectDataKb((totalChars / 1024).toFixed(1));
    });
  };

  useEffect(() => {
    refreshProjectStats();

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((persisted) => {
        setIsPersisted(persisted);
      });
    }

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        if (est.usage !== undefined && est.quota !== undefined) {
          setStorageEstimate({
            usageMb: (est.usage / (1024 * 1024)).toFixed(2),
            quotaMb: (est.quota / (1024 * 1024)).toFixed(0),
          });
        }
      });
    }
  }, []);

  const handleUpdatePref = (updates: Partial<UserPreferences>) => {
    const next = saveUserPreferences(updates);
    setPrefs(next);
    showToast('Preferences updated', 'info');
  };

  const handleRequestPersistence = async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const granted = await navigator.storage.persist();
      setIsPersisted(granted);
      if (granted) {
        showToast('Browser storage persistence granted', 'success');
      } else {
        showToast('Storage persistence was not granted by browser', 'warning');
      }
    }
  };

  const handleExportAllProjects = async () => {
    const all = await listProjects();
    if (all.length === 0) {
      showToast('No projects to export', 'warning');
      return;
    }

    const backupPayload = {
      format: 'mindrail-backup-archive',
      exportedAt: new Date().toISOString(),
      projectCount: all.length,
      projects: all.map((p) => JSON.parse(serializeProjectToEnvelopeJson(p))),
    };

    const json = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindrail-all-projects-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported backup of ${all.length} projects`, 'success');
  };

  const handleFilePickedForRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const result = validateBackupArchive(text);
      if (!result.success || result.projects.length === 0) {
        showToast(result.message || 'Failed to read backup archive file', 'danger');
        return;
      }
      setPendingRestoreProjects(result.projects);
    };
    reader.onerror = () => {
      showToast('Failed to read backup file from disk', 'danger');
    };
    reader.readAsText(file);
    // Reset file input value so re-picking the same file triggers change
    e.target.value = '';
  };

  const handleConfirmRestoreArchive = async () => {
    if (!pendingRestoreProjects || pendingRestoreProjects.length === 0) return;

    try {
      const existing = await listProjects();
      const existingIds = new Set(existing.map((p) => p.id));
      let savedCount = 0;

      for (const p of pendingRestoreProjects) {
        let toSave = p;
        if (restoreDuplicateMode === 'copy' && existingIds.has(p.id)) {
          toSave = {
            ...p,
            id: generateEntityId(),
            title: `${p.title} (Restored Copy)`,
          };
        }
        await saveProject(toSave);
        savedCount++;
      }

      setPendingRestoreProjects(null);
      refreshProjectStats();
      showToast(`Successfully restored ${savedCount} project(s) to IndexedDB`, 'success');
    } catch {
      showToast('Failed to write restored projects to database', 'danger');
    }
  };

  const handleConfirmClearAll = async () => {
    try {
      await clearAllData();
      localStorage.clear();
      setIsClearDataDialogOpen(false);
      showToast('All local projects and preferences cleared', 'info');
      navigate('/');
    } catch {
      showToast('Failed to clear database', 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto' }}>
      <div
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--mr-border-default)',
          backgroundColor: 'var(--mr-bg-surface-1)',
        }}
      >
        <h1 style={{ fontSize: 'var(--mr-text-2xl)', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--mr-text-primary)' }}>
          Settings & Local Storage
        </h1>
        <p style={{ margin: 0, color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)' }}>
          Manage client-side storage, preferences, and backups.
        </p>
      </div>

      <div style={{ flex: 1, padding: 32, maxWidth: 800, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Storage Overview */}
        <section
          style={{
            backgroundColor: 'var(--mr-bg-surface-2)',
            border: '1px solid var(--mr-border-subtle)',
            borderRadius: 'var(--mr-radius-md)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 'var(--mr-text-lg)', fontWeight: 600, color: 'var(--mr-text-primary)' }}>
            Browser Storage Status
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ backgroundColor: 'var(--mr-bg-surface-1)', padding: 16, borderRadius: 'var(--mr-radius-sm)' }}>
              <span style={{ fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)' }}>Local Projects</span>
              <p style={{ margin: '4px 0 0 0', fontSize: 'var(--mr-text-xl)', fontWeight: 700, color: 'var(--mr-text-primary)' }}>
                {projectCount}
              </p>
              <span style={{ fontSize: 11, color: 'var(--mr-text-muted)' }}>~{projectDataKb} KB payload</span>
            </div>
            {storageEstimate && (
              <div style={{ backgroundColor: 'var(--mr-bg-surface-1)', padding: 16, borderRadius: 'var(--mr-radius-sm)' }}>
                <span style={{ fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)' }}>IndexedDB Usage</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--mr-text-xl)', fontWeight: 700, color: 'var(--mr-text-primary)' }}>
                  {storageEstimate.usageMb} MB <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--mr-text-muted)' }}>/ {storageEstimate.quotaMb} MB</span>
                </p>
              </div>
            )}
            <div style={{ backgroundColor: 'var(--mr-bg-surface-1)', padding: 16, borderRadius: 'var(--mr-radius-sm)' }}>
              <span style={{ fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)' }}>Persistence Tier</span>
              <p style={{ margin: '4px 0 0 0', fontSize: 'var(--mr-text-md)', fontWeight: 600, color: isPersisted ? 'var(--mr-color-success)' : 'var(--mr-color-warning)' }}>
                {isPersisted === null ? 'Unknown' : isPersisted ? 'Persistent (Protected)' : 'Best-Effort (Browser may evict)'}
              </p>
            </div>
          </div>

          {!isPersisted && (
            <div>
              <Button variant="secondary" size="sm" onClick={handleRequestPersistence}>
                Request Persistent Browser Storage
              </Button>
            </div>
          )}
        </section>

        {/* Global UI Preferences */}
        <section
          style={{
            backgroundColor: 'var(--mr-bg-surface-2)',
            border: '1px solid var(--mr-border-subtle)',
            borderRadius: 'var(--mr-radius-md)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 'var(--mr-text-lg)', fontWeight: 600, color: 'var(--mr-text-primary)' }}>
            Canvas Preferences
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--mr-border-subtle)' }}>
            <div>
              <strong style={{ color: 'var(--mr-text-primary)', fontSize: 'var(--mr-text-sm)' }}>
                Default Snap to Grid
              </strong>
              <p style={{ margin: 0, fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)' }}>
                Automatically align node drags and creation to canvas grid lines.
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.defaultSnapToGrid}
              onChange={(e) => handleUpdatePref({ defaultSnapToGrid: e.target.checked })}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          <div style={{ maxWidth: 280 }}>
            <Select
              label="Default Grid Spacing"
              value={prefs.defaultGridSize}
              onChange={(e) => handleUpdatePref({ defaultGridSize: parseInt(e.target.value, 10) as 8 | 16 | 32 })}
            >
              <option value="8">8px (Dense)</option>
              <option value="16">16px (Standard Default)</option>
              <option value="32">32px (Spacious)</option>
            </Select>
          </div>
        </section>

        {/* Backup and Data Management */}
        <section
          style={{
            backgroundColor: 'var(--mr-bg-surface-2)',
            border: '1px solid var(--mr-border-subtle)',
            borderRadius: 'var(--mr-radius-md)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 'var(--mr-text-lg)', fontWeight: 600, color: 'var(--mr-text-primary)' }}>
            Data Export & Backup
          </h2>
          <p style={{ margin: 0, color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)', lineHeight: 1.5 }}>
            Because MindRail Studio has no cloud database, we strongly recommend taking regular backups of your projects to your local filesystem.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFilePickedForRestore}
          />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportAllProjects}
              icon={<DownloadIcon size={16} />}
            >
              Export All Projects Backup (.json)
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              icon={<UploadIcon size={16} />}
            >
              Restore Backup Archive (.json)
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => setIsClearDataDialogOpen(true)}
              icon={<TrashIcon size={16} />}
            >
              Clear All Local Studio Data
            </Button>
          </div>
        </section>
      </div>

      {/* Restore Backup Dialog */}
      <Dialog
        isOpen={pendingRestoreProjects !== null}
        onClose={() => setPendingRestoreProjects(null)}
        title="Restore Projects Backup Archive"
        maxWidth={540}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setPendingRestoreProjects(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirmRestoreArchive}>
              Confirm Restore ({pendingRestoreProjects?.length ?? 0} Projects)
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)', lineHeight: 1.5 }}>
            Verified backup archive. Found{' '}
            <strong style={{ color: 'var(--mr-text-primary)' }}>
              {pendingRestoreProjects?.length} valid project(s)
            </strong>{' '}
            ready to restore into your local IndexedDB storage.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 'var(--mr-text-xs)', fontWeight: 600, color: 'var(--mr-text-muted)' }}>
              DUPLICATE CONFLICT HANDLING
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-primary)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="restoreDuplicateMode"
                checked={restoreDuplicateMode === 'copy'}
                onChange={() => setRestoreDuplicateMode('copy')}
              />
              <span>Create separate copy if project ID already exists (Safest, preserves existing work)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-primary)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="restoreDuplicateMode"
                checked={restoreDuplicateMode === 'overwrite'}
                onChange={() => setRestoreDuplicateMode('overwrite')}
              />
              <span>Overwrite existing projects matching ID</span>
            </label>
          </div>

          <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--mr-border-subtle)', borderRadius: 'var(--mr-radius-sm)', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pendingRestoreProjects?.map((p, idx) => (
              <div
                key={p.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  backgroundColor: 'var(--mr-bg-surface-1)',
                  borderRadius: 'var(--mr-radius-xs)',
                  fontSize: 'var(--mr-text-xs)',
                }}
              >
                <strong style={{ color: 'var(--mr-text-primary)' }}>{p.title}</strong>
                <span style={{ color: 'var(--mr-text-muted)' }}>
                  {p.workspaceType.toUpperCase()} &bull; {p.nodes.length} nodes
                </span>
              </div>
            ))}
          </div>
        </div>
      </Dialog>

      {/* Clear Confirmation Dialog */}
      <Dialog
        isOpen={isClearDataDialogOpen}
        onClose={() => setIsClearDataDialogOpen(false)}
        title="Clear All Local Studio Data?"
        maxWidth={480}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsClearDataDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleConfirmClearAll}>
              Yes, Clear Everything
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, color: 'var(--mr-color-danger)', fontSize: 'var(--mr-text-sm)', lineHeight: 1.5 }}>
          Warning: This action will permanently erase all {projectCount} locally saved projects and
          reset all preferences from this browser. This cannot be undone. Please ensure you have exported
          any projects you wish to keep.
        </p>
      </Dialog>
    </div>
  );
}
