import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStorage } from "@/storage/memory";
import type { StorageProvider } from "@/storage/types";
import type { Session } from "@/tree/types";
import type { TreeNode } from "@/tree/types";

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1",
    title: "Test Session",
    rootNodeIds: [],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeNode(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: "n1",
    type: "article",
    parentId: null,
    sessionId: "s1",
    title: "Test",
    content: "",
    metadata: {},
    childrenIds: [],
    createdAt: 1000,
    ...overrides,
  };
}

describe("MemoryStorage", () => {
  let storage: StorageProvider;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  describe("sessions", () => {
    it("starts empty", async () => {
      const sessions = await storage.getSessions();
      expect(sessions).toEqual([]);
    });

    it("saves and retrieves a session", async () => {
      const session = makeSession();
      await storage.saveSession(session);
      expect(await storage.getSession("s1")).toEqual(session);
      expect(await storage.getSessions()).toEqual([session]);
    });

    it("deletes a session", async () => {
      await storage.saveSession(makeSession());
      await storage.deleteSession("s1");
      expect(await storage.getSession("s1")).toBeUndefined();
    });
  });

  describe("nodes", () => {
    it("saves and retrieves a node", async () => {
      const node = makeNode();
      await storage.saveNode(node);
      expect(await storage.getNode("n1")).toEqual(node);
    });

    it("retrieves nodes by session", async () => {
      await storage.saveNode(makeNode({ id: "n1", sessionId: "s1" }));
      await storage.saveNode(makeNode({ id: "n2", sessionId: "s1" }));
      await storage.saveNode(makeNode({ id: "n3", sessionId: "s2" }));
      const nodes = await storage.getNodesForSession("s1");
      expect(nodes.map((n) => n.id).sort()).toEqual(["n1", "n2"]);
    });

    it("batch saves nodes", async () => {
      await storage.saveNodes([
        makeNode({ id: "a" }),
        makeNode({ id: "b" }),
      ]);
      expect(await storage.getNode("a")).toBeDefined();
      expect(await storage.getNode("b")).toBeDefined();
    });

    it("deletes a node", async () => {
      await storage.saveNode(makeNode());
      await storage.deleteNode("n1");
      expect(await storage.getNode("n1")).toBeUndefined();
    });

    it("batch deletes nodes", async () => {
      await storage.saveNodes([
        makeNode({ id: "a" }),
        makeNode({ id: "b" }),
        makeNode({ id: "c" }),
      ]);
      await storage.deleteNodes(["a", "c"]);
      expect(await storage.getNode("a")).toBeUndefined();
      expect(await storage.getNode("b")).toBeDefined();
      expect(await storage.getNode("c")).toBeUndefined();
    });
  });

  describe("config overrides", () => {
    it("starts undefined", async () => {
      expect(await storage.getConfigOverrides()).toBeUndefined();
    });

    it("saves and retrieves config overrides", async () => {
      const overrides = { llm: { endpoint: "http://custom", model: "m", temperature: 0.5, maxTokens: 2048, topP: 0.9 } };
      await storage.saveConfigOverrides(overrides);
      expect(await storage.getConfigOverrides()).toEqual(overrides);
    });
  });
});
