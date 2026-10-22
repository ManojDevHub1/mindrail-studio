/**
 * Lightweight localStorage preferences wrapper.
 * Key: mindrail:prefs:v1 (docs/LOCAL_FIRST_AND_PRIVACY.md)
 */
import type { WorkspaceType } from '../domain/models';

export const PREFERENCES_STORAGE_KEY = 'mindrail:prefs:v1';

export interface UserPreferences {
  readonly defaultSnapToGrid: boolean;
  readonly defaultGridSize: 8 | 16 | 32;
  readonly sidebarCollapsed: boolean;
  readonly lastWorkspaceFilter: WorkspaceType | 'all';
  readonly reducedMotionOverride: boolean | null;
  readonly favoriteTemplateIds: readonly string[];
  readonly recentTemplateIds: readonly string[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultSnapToGrid: true,
  defaultGridSize: 16,
  sidebarCollapsed: false,
  lastWorkspaceFilter: 'all',
  reducedMotionOverride: null,
  favoriteTemplateIds: [],
  recentTemplateIds: [],
};

export function loadUserPreferences(): UserPreferences {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(raw);
    return {
      defaultSnapToGrid: typeof parsed.defaultSnapToGrid === 'boolean' ? parsed.defaultSnapToGrid : true,
      defaultGridSize: [8, 16, 32].includes(parsed.defaultGridSize) ? parsed.defaultGridSize : 16,
      sidebarCollapsed: typeof parsed.sidebarCollapsed === 'boolean' ? parsed.sidebarCollapsed : false,
      lastWorkspaceFilter: ['developer', 'video', 'student', 'freelance', 'all'].includes(parsed.lastWorkspaceFilter)
        ? parsed.lastWorkspaceFilter
        : 'all',
      reducedMotionOverride: typeof parsed.reducedMotionOverride === 'boolean' ? parsed.reducedMotionOverride : null,
      favoriteTemplateIds: Array.isArray(parsed.favoriteTemplateIds)
        ? parsed.favoriteTemplateIds.filter((id: unknown) => typeof id === 'string')
        : [],
      recentTemplateIds: Array.isArray(parsed.recentTemplateIds)
        ? parsed.recentTemplateIds.filter((id: unknown) => typeof id === 'string')
        : [],
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  const current = loadUserPreferences();
  const updated: UserPreferences = { ...current, ...prefs };
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage might be disabled or full
    }
  }
  return updated;
}

export function toggleFavoriteTemplate(templateId: string): readonly string[] {
  const current = loadUserPreferences();
  const exists = current.favoriteTemplateIds.includes(templateId);
  const updatedFavorites = exists
    ? current.favoriteTemplateIds.filter((id) => id !== templateId)
    : [...current.favoriteTemplateIds, templateId];
  saveUserPreferences({ favoriteTemplateIds: updatedFavorites });
  return updatedFavorites;
}

export function addRecentTemplate(templateId: string): readonly string[] {
  const current = loadUserPreferences();
  const filtered = current.recentTemplateIds.filter((id) => id !== templateId);
  const updatedRecents = [templateId, ...filtered].slice(0, 10);
  saveUserPreferences({ recentTemplateIds: updatedRecents });
  return updatedRecents;
}
