import type { TreeNode, Session } from "@/tree/types";
import type { AppConfig } from "@/config/configSchema";
import type { StorageProvider } from "./types";
import { StorageError } from "@/lib/errors";

const DB_NAME = "llm-binge-db";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("nodes")) {
        const store = db.createObjectStore("nodes", { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
      }
      if (!db.objectStoreNames.contains("config")) {
        db.createObjectStore("config", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new StorageError(`Failed to open IndexedDB: ${request.error}`));
  });
}

function tx<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new StorageError(`IndexedDB operation failed: ${request.error}`));
  });
}

function txAll<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const requests = fn(store);
    let completed = 0;
    if (requests.length === 0) {
      resolve();
      return;
    }
    for (const req of requests) {
      req.onsuccess = () => {
        completed++;
        if (completed === requests.length) resolve();
      };
      req.onerror = () =>
        reject(new StorageError(`IndexedDB batch failed: ${req.error}`));
    }
  });
}

export function createIndexedDBStorage(): StorageProvider {
  let dbPromise: Promise<IDBDatabase> | null = null;

  function getDB(): Promise<IDBDatabase> {
    if (!dbPromise) {
      dbPromise = openDB();
    }
    return dbPromise;
  }

  return {
    async getSessions() {
      const db = await getDB();
      return tx<Session[]>(db, "sessions", "readonly", (store) =>
        store.getAll(),
      );
    },
    async getSession(id) {
      const db = await getDB();
      const result = await tx<Session | undefined>(
        db,
        "sessions",
        "readonly",
        (store) => store.get(id),
      );
      return result;
    },
    async saveSession(session) {
      const db = await getDB();
      await tx(db, "sessions", "readwrite", (store) => store.put(session));
    },
    async deleteSession(id) {
      const db = await getDB();
      await tx(db, "sessions", "readwrite", (store) => store.delete(id));
    },

    async getNode(id) {
      const db = await getDB();
      const result = await tx<TreeNode | undefined>(
        db,
        "nodes",
        "readonly",
        (store) => store.get(id),
      );
      return result;
    },
    async getNodesForSession(sessionId) {
      const db = await getDB();
      return tx<TreeNode[]>(db, "nodes", "readonly", (store) => {
        const index = store.index("sessionId");
        return index.getAll(sessionId);
      });
    },
    async saveNode(node) {
      const db = await getDB();
      await tx(db, "nodes", "readwrite", (store) => store.put(node));
    },
    async saveNodes(batch) {
      const db = await getDB();
      await txAll(db, "nodes", "readwrite", (store) =>
        batch.map((node) => store.put(node)),
      );
    },
    async deleteNode(id) {
      const db = await getDB();
      await tx(db, "nodes", "readwrite", (store) => store.delete(id));
    },
    async deleteNodes(ids) {
      const db = await getDB();
      await txAll(db, "nodes", "readwrite", (store) =>
        ids.map((id) => store.delete(id)),
      );
    },

    async getConfigOverrides() {
      const db = await getDB();
      const result = await tx<
        { key: string; value: Partial<AppConfig> } | undefined
      >(db, "config", "readonly", (store) => store.get("user-overrides"));
      return result?.value;
    },
    async saveConfigOverrides(config) {
      const db = await getDB();
      await tx(db, "config", "readwrite", (store) =>
        store.put({ key: "user-overrides", value: config }),
      );
    },
  };
}
