import { describe, it, expect } from "vitest";
import {
  createNode,
  insertNode,
  deleteNodeCascade,
  addChildId,
  updateNodeContent,
  updateNodeMetadata,
} from "@/tree/operations";
import type { TreeNode } from "@/tree/types";

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

describe("createNode", () => {
  it("generates id and createdAt when not provided", () => {
    const node = createNode({
      type: "article",
      parentId: null,
      sessionId: "s1",
      title: "Hello",
      content: "",
      metadata: {},
      childrenIds: [],
    });
    expect(node.id).toBeTruthy();
    expect(node.createdAt).toBeGreaterThan(0);
    expect(node.title).toBe("Hello");
  });

  it("uses provided id and createdAt", () => {
    const node = createNode({
      id: "custom-id",
      type: "map",
      parentId: "p1",
      sessionId: "s1",
      title: "Map",
      content: "",
      metadata: {},
      childrenIds: [],
      createdAt: 42,
    });
    expect(node.id).toBe("custom-id");
    expect(node.createdAt).toBe(42);
  });
});

describe("insertNode", () => {
  it("adds a node to the map", () => {
    const nodes = new Map<string, TreeNode>();
    const node = makeNode({ id: "n1" });
    const result = insertNode(nodes, node);
    expect(result.get("n1")).toEqual(node);
    expect(result.size).toBe(1);
  });

  it("adds child id to parent", () => {
    const parent = makeNode({ id: "p1", childrenIds: [] });
    const nodes = new Map([["p1", parent]]);
    const child = makeNode({ id: "c1", parentId: "p1" });
    const result = insertNode(nodes, child);
    expect(result.get("p1")!.childrenIds).toEqual(["c1"]);
    expect(result.get("c1")).toEqual(child);
  });

  it("does not duplicate child id if already present", () => {
    const parent = makeNode({ id: "p1", childrenIds: ["c1"] });
    const child = makeNode({ id: "c1", parentId: "p1" });
    const nodes = new Map<string, TreeNode>([
      ["p1", parent],
      ["c1", child],
    ]);
    const result = insertNode(nodes, child);
    expect(result.get("p1")!.childrenIds).toEqual(["c1"]);
  });

  it("does not mutate original map", () => {
    const nodes = new Map<string, TreeNode>();
    insertNode(nodes, makeNode());
    expect(nodes.size).toBe(0);
  });
});

describe("addChildId", () => {
  it("adds child id to parent", () => {
    const parent = makeNode({ id: "p1" });
    const nodes = new Map([["p1", parent]]);
    const result = addChildId(nodes, "p1", "c1");
    expect(result.get("p1")!.childrenIds).toEqual(["c1"]);
  });

  it("returns same map if parent not found", () => {
    const nodes = new Map<string, TreeNode>();
    const result = addChildId(nodes, "missing", "c1");
    expect(result).toBe(nodes);
  });

  it("returns same map if child already present", () => {
    const parent = makeNode({ id: "p1", childrenIds: ["c1"] });
    const nodes = new Map([["p1", parent]]);
    const result = addChildId(nodes, "p1", "c1");
    expect(result).toBe(nodes);
  });
});

describe("deleteNodeCascade", () => {
  it("deletes a single node with no children", () => {
    const node = makeNode({ id: "n1" });
    const nodes = new Map([["n1", node]]);
    const { nodes: result, removedIds } = deleteNodeCascade(nodes, "n1");
    expect(result.size).toBe(0);
    expect(removedIds).toEqual(["n1"]);
  });

  it("deletes node and all descendants", () => {
    const root = makeNode({ id: "r", childrenIds: ["a", "b"] });
    const a = makeNode({ id: "a", parentId: "r", childrenIds: ["a1"] });
    const b = makeNode({ id: "b", parentId: "r" });
    const a1 = makeNode({ id: "a1", parentId: "a" });
    const nodes = new Map<string, TreeNode>([
      ["r", root],
      ["a", a],
      ["b", b],
      ["a1", a1],
    ]);

    const { nodes: result, removedIds } = deleteNodeCascade(nodes, "a");
    expect(result.size).toBe(2);
    expect(result.has("r")).toBe(true);
    expect(result.has("b")).toBe(true);
    expect(result.has("a")).toBe(false);
    expect(result.has("a1")).toBe(false);
    expect(removedIds).toContain("a");
    expect(removedIds).toContain("a1");
    // Parent's childrenIds should be updated
    expect(result.get("r")!.childrenIds).toEqual(["b"]);
  });

  it("handles deleting root node", () => {
    const root = makeNode({ id: "r", childrenIds: ["c1"] });
    const c1 = makeNode({ id: "c1", parentId: "r" });
    const nodes = new Map<string, TreeNode>([
      ["r", root],
      ["c1", c1],
    ]);
    const { nodes: result } = deleteNodeCascade(nodes, "r");
    expect(result.size).toBe(0);
  });
});

describe("updateNodeContent", () => {
  it("updates content of existing node", () => {
    const node = makeNode({ id: "n1", content: "old" });
    const nodes = new Map([["n1", node]]);
    const result = updateNodeContent(nodes, "n1", "new");
    expect(result.get("n1")!.content).toBe("new");
  });

  it("returns same map if node not found", () => {
    const nodes = new Map<string, TreeNode>();
    const result = updateNodeContent(nodes, "missing", "x");
    expect(result).toBe(nodes);
  });
});

describe("updateNodeMetadata", () => {
  it("merges metadata", () => {
    const node = makeNode({ id: "n1", metadata: { a: 1 } });
    const nodes = new Map([["n1", node]]);
    const result = updateNodeMetadata(nodes, "n1", { b: 2 });
    expect(result.get("n1")!.metadata).toEqual({ a: 1, b: 2 });
  });
});
