/**
 * Project serialization and file export module.
 * Conforms to docs/IMPORT_EXPORT_SPEC.md.
 */
import { CURRENT_SCHEMA_VERSION, type Project } from '../domain/models';

export const APP_VERSION = '0.1.0';

export interface MindRailProjectFileEnvelopeV1 {
  readonly format: 'mindrail-project';
  readonly schemaVersion: 1;
  readonly exportedAt: string;
  readonly appVersion: string;
  readonly project: Project;
}

/**
 * Creates a URL-safe, human-readable slug from a project title.
 */
export function slugifyTitle(title: string): string {
  const clean = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || 'mindrail-project';
}

/**
 * Generates the canonical export filename: <project-slug>-<YYYY-MM-DD>.mindrail.json
 */
export function generateExportFilename(project: Project, date = new Date()): string {
  const slug = slugifyTitle(project.title);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${slug}-${year}-${month}-${day}.mindrail.json`;
}

/**
 * Creates the validated envelope and serializes it to formatted JSON string.
 */
export function serializeProjectToEnvelopeJson(project: Project): string {
  const envelope: MindRailProjectFileEnvelopeV1 = {
    format: 'mindrail-project',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    project,
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Initiates browser-native file download of the exported project.
 */
export function downloadProjectFile(project: Project): string {
  const jsonContent = serializeProjectToEnvelopeJson(project);
  const filename = generateExportFilename(project);

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([jsonContent], {
      type: 'application/vnd.mindrail.project+json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return filename;
}
