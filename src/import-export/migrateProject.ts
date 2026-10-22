/**
 * Schema version migration pipeline (docs/DATA_MODEL.md section 8).
 */
import { CURRENT_SCHEMA_VERSION, type Project } from '../domain/models';

export class UnsupportedSchemaVersionError extends Error {
  readonly schemaVersion: number;
  constructor(schemaVersion: number) {
    super(
      `This file uses schemaVersion ${schemaVersion}, which is newer than the version supported by this build of MindRail Studio (schemaVersion ${CURRENT_SCHEMA_VERSION}). Please update MindRail Studio to open this file.`
    );
    this.name = 'UnsupportedSchemaVersionError';
    this.schemaVersion = schemaVersion;
  }
}

/**
 * Runs sequential migrations if schemaVersion < CURRENT_SCHEMA_VERSION.
 * Throws UnsupportedSchemaVersionError if schemaVersion > CURRENT_SCHEMA_VERSION or < 1.
 */
export function migrateProjectToCurrentSchema(rawProject: unknown): Project {
  if (typeof rawProject !== 'object' || rawProject === null) {
    throw new Error('Project payload is not an object.');
  }

  const projectRecord = rawProject as Record<string, unknown>;
  const schemaVersion = projectRecord['schemaVersion'];

  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new Error('Project schemaVersion is missing or invalid.');
  }

  if (schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new UnsupportedSchemaVersionError(schemaVersion);
  }

  // When CURRENT_SCHEMA_VERSION increments, sequential migrations run here:
  // let current = rawProject;
  // if (schemaVersion === 1 && CURRENT_SCHEMA_VERSION >= 2) {
  //   current = migrateV1ToV2(current);
  // }

  return rawProject as Project;
}
