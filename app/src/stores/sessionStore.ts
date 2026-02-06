import { create } from "zustand";
import type { Session, TreeNode } from "@/tree/types";
import {
  createNode,
  insertNode,
  deleteNodeCascade,
  updateNodeContent as updateContent_,
  updateNodeMetadata as updateMetadata_,
} from "@/tree/operations";
import { generateId } from "@/lib/id";
import { storage } from "@/storage/provider";

interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  nodes: Map<string, TreeNode>;
  loading: boolean;

  loadSessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  createSession: (
    title: string,
    rootNodeTitle: string,
    rootNodeType?: "article" | "map",
  ) => Promise<{ session: Session; rootNode: TreeNode }>;
  deleteSession: (sessionId: string) => Promise<void>;

  addNode: (
    fields: Omit<TreeNode, "id" | "createdAt">,
  ) => Promise<TreeNode>;
  deleteNode: (nodeId: string) => Promise<string[]>;
  updateNodeContent: (nodeId: string, content: string) => void;
  updateNodeMetadata: (
    nodeId: string,
    metadata: Record<string, unknown>,
  ) => void;
  persistNode: (nodeId: string) => Promise<void>;
  persistSession: (sessionId: string) => Promise<void>;
}

let _sessionVersion = 0;

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessions: [],
  currentSessionId: null,
  nodes: new Map(),
  loading: false,

  loadSessions: async () => {
    const version = ++_sessionVersion;
    const sessions = await storage.getSessions();
    if (version !== _sessionVersion) return; // stale — a delete happened since we started
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ sessions });
  },

  loadSession: async (sessionId: string) => {
    const version = _sessionVersion;
    set({ loading: true, currentSessionId: sessionId });
    const [session, nodeList] = await Promise.all([
      storage.getSession(sessionId),
      storage.getNodesForSession(sessionId),
    ]);
    const nodes = new Map<string, TreeNode>();
    for (const node of nodeList) {
      nodes.set(node.id, node);
    }
    set((state) => {
      // Don't touch sessions list if a delete happened since we started
      if (version !== _sessionVersion) {
        return { nodes, loading: false };
      }
      const hasSession = state.sessions.some((s) => s.id === sessionId);
      const sessions =
        !hasSession && session ? [...state.sessions, session] : state.sessions;
      return { nodes, loading: false, sessions };
    });
  },

  createSession: async (title: string, rootNodeTitle: string, rootNodeType: "article" | "map" = "article") => {
    const sessionId = generateId();
    const rootNode = createNode({
      type: rootNodeType,
      parentId: null,
      sessionId,
      title: rootNodeTitle,
      content: "",
      metadata: {},
      childrenIds: [],
    });

    const session: Session = {
      id: sessionId,
      title,
      rootNodeIds: [rootNode.id],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storage.saveSession(session);
    await storage.saveNode(rootNode);

    const nodes = new Map<string, TreeNode>();
    nodes.set(rootNode.id, rootNode);

    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSessionId: sessionId,
      nodes,
    }));

    return { session, rootNode };
  },

  deleteSession: async (sessionId: string) => {
    ++_sessionVersion; // invalidate any in-flight loadSessions/loadSession
    const nodesToDelete = await storage.getNodesForSession(sessionId);
    await storage.deleteNodes(nodesToDelete.map((n) => n.id));
    await storage.deleteSession(sessionId);

    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      ...(state.currentSessionId === sessionId
        ? { currentSessionId: null, nodes: new Map() }
        : {}),
    }));
  },

  addNode: async (fields) => {
    const node = createNode(fields);
    const newNodes = insertNode(get().nodes, node);
    set({ nodes: newNodes });

    await storage.saveNode(node);
    if (node.parentId) {
      const parent = newNodes.get(node.parentId);
      if (parent) await storage.saveNode(parent);
    }

    // Always update session updatedAt; also add rootNodeId if this is a root node
    const session = get().sessions.find((s) => s.id === node.sessionId);
    if (session) {
      const updated = {
        ...session,
        rootNodeIds: !node.parentId
          ? [...session.rootNodeIds, node.id]
          : session.rootNodeIds,
        updatedAt: Date.now(),
      };
      await storage.saveSession(updated);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === updated.id ? updated : s,
        ),
      }));
    }

    return node;
  },

  deleteNode: async (nodeId: string) => {
    const node = get().nodes.get(nodeId);
    if (!node) return [];

    const { nodes: newNodes, removedIds } = deleteNodeCascade(
      get().nodes,
      nodeId,
    );
    set({ nodes: newNodes });

    await storage.deleteNodes(removedIds);

    if (node.parentId) {
      const parent = newNodes.get(node.parentId);
      if (parent) await storage.saveNode(parent);
    }

    // Always update session updatedAt; also remove rootNodeId if this was a root node
    const session = get().sessions.find((s) => s.id === node.sessionId);
    if (session) {
      const updated = {
        ...session,
        rootNodeIds: !node.parentId
          ? session.rootNodeIds.filter((id) => id !== nodeId)
          : session.rootNodeIds,
        updatedAt: Date.now(),
      };
      await storage.saveSession(updated);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === updated.id ? updated : s,
        ),
      }));
    }

    return removedIds;
  },

  updateNodeContent: (nodeId: string, content: string) => {
    set((state) => ({
      nodes: updateContent_(state.nodes, nodeId, content),
    }));
  },

  updateNodeMetadata: (
    nodeId: string,
    metadata: Record<string, unknown>,
  ) => {
    set((state) => ({
      nodes: updateMetadata_(state.nodes, nodeId, metadata),
    }));
  },

  persistNode: async (nodeId: string) => {
    const node = get().nodes.get(nodeId);
    if (node) await storage.saveNode(node);
  },

  persistSession: async (sessionId: string) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (session) {
      const updated = { ...session, updatedAt: Date.now() };
      await storage.saveSession(updated);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? updated : s,
        ),
      }));
    }
  },
}));
