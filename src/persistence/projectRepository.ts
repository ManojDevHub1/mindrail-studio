/**
 * Project and Template Repository backed by IndexedDB.
 * Conforms to docs/LOCAL_FIRST_AND_PRIVACY.md and docs/DATA_MODEL.md.
 */
import type { EntityId, Project, ProjectTemplate, WorkspaceType } from '../domain/models';
import { openDatabase, STORES, StorageQuotaError } from './db';

function handleTransactionError(error: unknown): never {
  if (error instanceof StorageQuotaError) {
    throw error;
  }
  if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
    throw new StorageQuotaError(error.message);
  }
  throw error;
}

/**
 * Persists a Project record into IndexedDB (upsert).
 */
export async function saveProject(project: Project): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.PROJECTS, 'readwrite');
      const store = tx.objectStore(STORES.PROJECTS);

      tx.onerror = () => {
        try {
          handleTransactionError(tx.error);
        } catch (err) {
          reject(err);
        }
      };

      tx.onabort = () => {
        try {
          handleTransactionError(tx.error);
        } catch (err) {
          reject(err);
        }
      };

      const request = store.put(project);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        try {
          handleTransactionError(request.error);
        } catch (err) {
          reject(err);
        }
      };
    } catch (err) {
      try {
        handleTransactionError(err);
      } catch (finalErr) {
        reject(finalErr);
      }
    }
  });
}

/**
 * Retrieves a single Project by ID, or null if not found.
 */
export async function getProject(id: EntityId): Promise<Project | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.PROJECTS, 'readonly');
      const store = tx.objectStore(STORES.PROJECTS);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = (request.result as Project) || null;
        resolve(result);
      };

      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Lists all projects, optionally filtered by workspace type, sorted by updatedAt descending.
 */
export async function listProjects(workspaceFilter?: WorkspaceType): Promise<Project[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.PROJECTS, 'readonly');
      const store = tx.objectStore(STORES.PROJECTS);
      const request = workspaceFilter
        ? store.index('by_workspaceType').getAll(workspaceFilter)
        : store.getAll();

      request.onsuccess = () => {
        const projects = (request.result as Project[]) || [];
        // Sort newest updated first
        projects.sort((a, b) => {
          const tA = new Date(a.metadata.updatedAt).getTime();
          const tB = new Date(b.metadata.updatedAt).getTime();
          return tB - tA;
        });
        resolve(projects);
      };

      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Deletes a project by ID from IndexedDB.
 */
export async function deleteProject(id: EntityId): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.PROJECTS, 'readwrite');
      const store = tx.objectStore(STORES.PROJECTS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Saves a custom ProjectTemplate.
 */
export async function saveCustomTemplate(template: ProjectTemplate): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.CUSTOM_TEMPLATES, 'readwrite');
      const store = tx.objectStore(STORES.CUSTOM_TEMPLATES);
      const request = store.put(template);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        try {
          handleTransactionError(request.error);
        } catch (err) {
          reject(err);
        }
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Lists all custom templates.
 */
export async function listCustomTemplates(workspaceFilter?: WorkspaceType): Promise<ProjectTemplate[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.CUSTOM_TEMPLATES, 'readonly');
      const store = tx.objectStore(STORES.CUSTOM_TEMPLATES);
      const request = workspaceFilter
        ? store.index('by_workspaceType').getAll(workspaceFilter)
        : store.getAll();

      request.onsuccess = () => {
        const templates = (request.result as ProjectTemplate[]) || [];
        resolve(templates);
      };

      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Deletes a custom template.
 */
export async function deleteCustomTemplate(id: EntityId): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.CUSTOM_TEMPLATES, 'readwrite');
      const store = tx.objectStore(STORES.CUSTOM_TEMPLATES);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Completely clears all projects and custom templates from IndexedDB.
 */
export async function clearAllData(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORES.PROJECTS, STORES.CUSTOM_TEMPLATES], 'readwrite');
      tx.objectStore(STORES.PROJECTS).clear();
      tx.objectStore(STORES.CUSTOM_TEMPLATES).clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}
