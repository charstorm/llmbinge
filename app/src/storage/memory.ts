import type { TreeNode, Session } from "@/tree/types";
import type { AppConfig } from "@/config/configSchema";
import type { StorageProvider } from "./types";

export function createMemoryStorage(): StorageProvider {
  const sessions = new Map<string, Session>();
  const nodes = new Map<string, TreeNode>();
  let configOverrides: Partial<AppConfig> | undefined;

  return {
    async getSessions() {
      return [...sessions.values()];
    },
    async getSession(id) {
      return sessions.get(id);
    },
    async saveSession(session) {
      sessions.set(session.id, session);
    },
    async deleteSession(id) {
      sessions.delete(id);
    },

    async getNode(id) {
      return nodes.get(id);
    },
    async getNodesForSession(sessionId) {
      return [...nodes.values()].filter((n) => n.sessionId === sessionId);
    },
    async saveNode(node) {
      nodes.set(node.id, node);
    },
    async saveNodes(batch) {
      for (const node of batch) {
        nodes.set(node.id, node);
      }
    },
    async deleteNode(id) {
      nodes.delete(id);
    },
    async deleteNodes(ids) {
      for (const id of ids) {
        nodes.delete(id);
      }
    },

    async getConfigOverrides() {
      return configOverrides;
    },
    async saveConfigOverrides(config) {
      configOverrides = config;
    },
  };
}
