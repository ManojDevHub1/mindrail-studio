/**
 * IndexedDB connection and schema initialization for MindRail Studio.
 * Conforms to docs/LOCAL_FIRST_AND_PRIVACY.md.
 */

export const DB_NAME = 'mindrail_studio_db';
export const DB_VERSION = 1;

export const STORES = {
  PROJECTS: 'projects',
  CUSTOM_TEMPLATES: 'custom_templates',
} as const;

export class StorageQuotaError extends Error {
  constructor(message = 'Browser storage quota exceeded.') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

export class StorageUnavailableError extends Error {
  constructor(message = 'Local browser storage (IndexedDB) is not available.') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

/**
 * Open or upgrade the MindRail Studio IndexedDB database.
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new StorageUnavailableError());
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Projects object store
      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('by_workspaceType', 'workspaceType', { unique: false });
        projectStore.createIndex('by_updatedAt', 'metadata.updatedAt', { unique: false });
      }

      // 2. Custom templates object store
      if (!db.objectStoreNames.contains(STORES.CUSTOM_TEMPLATES)) {
        const templateStore = db.createObjectStore(STORES.CUSTOM_TEMPLATES, { keyPath: 'id' });
        templateStore.createIndex('by_workspaceType', 'workspaceType', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      const error = request.error;
      if (error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        reject(new StorageQuotaError(error.message));
      } else {
        reject(error || new StorageUnavailableError());
      }
    };

    request.onblocked = () => {
      reject(new Error('IndexedDB open request was blocked by an open tab.'));
    };
  });
}
