/**
 * Simple, robust hash router for MindRail Studio.
 * Conforms to docs/INFORMATION_ARCHITECTURE.md.
 */
import { useEffect, useState } from 'react';
import type { EntityId, WorkspaceType } from '../domain/models';

export type AppRoute =
  | { readonly name: 'landing' }
  | { readonly name: 'projects' }
  | { readonly name: 'templates' }
  | { readonly name: 'settings' }
  | {
      readonly name: 'workspace';
      readonly workspaceType: WorkspaceType;
      readonly projectId: EntityId;
    }
  | { readonly name: 'not-found' };

export function parseHashRoute(hashString: string): AppRoute {
  const clean = hashString.replace(/^#\/?/, '').trim();

  if (!clean || clean === '') {
    return { name: 'landing' };
  }

  const segments = clean.split('/');

  if (segments[0] === 'projects') {
    return { name: 'projects' };
  }

  if (segments[0] === 'templates') {
    return { name: 'templates' };
  }

  if (segments[0] === 'settings') {
    return { name: 'settings' };
  }

  if (segments[0] === 'workspace' && segments.length >= 3) {
    const ws = segments[1];
    const pid = segments[2];
    if ((ws === 'developer' || ws === 'video' || ws === 'student' || ws === 'freelance') && pid) {
      return {
        name: 'workspace',
        workspaceType: ws as WorkspaceType,
        projectId: pid,
      };
    }
  }

  return { name: 'not-found' };
}

export function navigate(path: string) {
  const cleanPath = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`;
  if (window.location.hash !== cleanPath) {
    window.location.hash = cleanPath;
  }
}

export function useHashRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseHashRoute(typeof window !== 'undefined' ? window.location.hash : '')
  );

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHashRoute(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route;
}
