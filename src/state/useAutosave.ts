/**
 * Autosave hook managing debounced IndexedDB persistence and beforeunload guard.
 * Conforms to docs/STATE_MANAGEMENT.md and docs/LOCAL_FIRST_AND_PRIVACY.md.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { IsoTimestamp, Project } from '../domain/models';
import { StorageQuotaError, StorageUnavailableError } from '../persistence/db';
import { saveProject } from '../persistence/projectRepository';

export type SaveStatus =
  | { readonly status: 'saved'; readonly lastSavedAt: IsoTimestamp }
  | { readonly status: 'unsaved-changes' }
  | { readonly status: 'saving' }
  | {
      readonly status: 'error';
      readonly errorKind: 'quota-exceeded' | 'storage-unavailable' | 'unknown';
      readonly message: string;
    };

export interface UseAutosaveOptions {
  project: Project;
  revision: number;
  debounceMs?: number;
}

export function useAutosave({ project, revision, debounceMs = 1000 }: UseAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    status: 'saved',
    lastSavedAt: project.metadata.updatedAt,
  });

  const lastPersistedRevisionRef = useRef<number>(revision);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const projectRef = useRef<Project>(project);
  projectRef.current = project;

  const performSave = useCallback(async (projectToSave: Project, targetRevision: number) => {
    setSaveStatus({ status: 'saving' });
    try {
      await saveProject(projectToSave);
      lastPersistedRevisionRef.current = targetRevision;
      setSaveStatus({
        status: 'saved',
        lastSavedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      if (err instanceof StorageQuotaError) {
        setSaveStatus({
          status: 'error',
          errorKind: 'quota-exceeded',
          message: 'Browser storage quota exceeded. Export your project backup to avoid losing work.',
        });
      } else if (err instanceof StorageUnavailableError) {
        setSaveStatus({
          status: 'error',
          errorKind: 'storage-unavailable',
          message: 'Local storage is unavailable in this window. Work in memory and export backup.',
        });
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown storage error occurred.';
        setSaveStatus({
          status: 'error',
          errorKind: 'unknown',
          message: msg,
        });
      }
    }
  }, []);

  // Force an immediate save (e.g., Ctrl+S or explicit Save button)
  const saveImmediately = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    return performSave(projectRef.current, revision);
  }, [performSave, revision]);

  // Track revision changes and schedule debounced save
  useEffect(() => {
    if (revision === lastPersistedRevisionRef.current) {
      return;
    }

    setSaveStatus({ status: 'unsaved-changes' });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave(projectRef.current, revision);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [revision, debounceMs, performSave]);

  // Keyboard shortcut Ctrl/Cmd+S listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveImmediately();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveImmediately]);

  // beforeunload tab protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus.status === 'unsaved-changes' || saveStatus.status === 'saving' || saveStatus.status === 'error') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus.status]);

  return {
    saveStatus,
    saveImmediately,
  };
}
