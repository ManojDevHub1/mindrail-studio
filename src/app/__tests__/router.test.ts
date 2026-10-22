import { describe, expect, it } from 'vitest';
import { parseHashRoute } from '../router';

describe('Router Hash Parsing', () => {
  it('parses empty or root hash as landing', () => {
    expect(parseHashRoute('')).toEqual({ name: 'landing' });
    expect(parseHashRoute('#/')).toEqual({ name: 'landing' });
    expect(parseHashRoute('#')).toEqual({ name: 'landing' });
  });

  it('parses projects, templates, and settings routes', () => {
    expect(parseHashRoute('#/projects')).toEqual({ name: 'projects' });
    expect(parseHashRoute('#/templates')).toEqual({ name: 'templates' });
    expect(parseHashRoute('#/settings')).toEqual({ name: 'settings' });
  });

  it('parses valid workspace routes for developer, video, and student', () => {
    expect(parseHashRoute('#/workspace/developer/proj-123')).toEqual({
      name: 'workspace',
      workspaceType: 'developer',
      projectId: 'proj-123',
    });

    expect(parseHashRoute('#/workspace/video/proj-456')).toEqual({
      name: 'workspace',
      workspaceType: 'video',
      projectId: 'proj-456',
    });

    expect(parseHashRoute('#/workspace/student/proj-789')).toEqual({
      name: 'workspace',
      workspaceType: 'student',
      projectId: 'proj-789',
    });
  });

  it('handles unknown or malformed routes safely', () => {
    expect(parseHashRoute('#/unknown-route')).toEqual({ name: 'not-found' });
    expect(parseHashRoute('#/workspace/invalid/proj-123')).toEqual({ name: 'not-found' });
  });
});
