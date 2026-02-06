import { describe, it, expect } from "vitest";
import {
  getAncestors,
  getDescendants,
  getChildren,
  buildTreeFromRoots,
} from "@/tree/selectors";
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

function buildTestTree(): Map<string, TreeNode> {
  // r -> a -> a1
  //   -> b
  const r = makeNode({ id: "r", title: "Root", childrenIds: ["a", "b"] });
  const a = makeNode({
    id: "a",
    title: "A",
    parentId: "r",
    childrenIds: ["a1"],
  });
  const b = makeNode({ id: "b", title: "B", parentId: "r" });
  const a1 = makeNode({ id: "a1", title: "A1", parentId: "a" });
  return new Map([
    ["r", r],
    ["a", a],
    ["b", b],
    ["a1", a1],
  ]);
}

describe("getAncestors", () => {
  it("returns ancestors from leaf to root", () => {
    const nodes = buildTestTree();
    const ancestors = getAncestors(nodes, "a1");
    expect(ancestors.map((n) => n.id)).toEqual(["a", "r"]);
  });

  it("returns empty for root node", () => {
    const nodes = buildTestTree();
    expect(getAncestors(nodes, "r")).toEqual([]);
  });

  it("returns empty for unknown node", () => {
    const nodes = buildTestTree();
    expect(getAncestors(nodes, "missing")).toEqual([]);
  });
});

describe("getDescendants", () => {
  it("returns all descendants of a node", () => {
    const nodes = buildTestTree();
    const desc = getDescendants(nodes, "r");
    const ids = desc.map((n) => n.id).sort();
    expect(ids).toEqual(["a", "a1", "b"]);
  });

  it("returns empty for leaf node", () => {
    const nodes = buildTestTree();
    expect(getDescendants(nodes, "a1")).toEqual([]);
  });
});

describe("getChildren", () => {
  it("returns direct children", () => {
    const nodes = buildTestTree();
    const children = getChildren(nodes, "r");
    expect(children.map((n) => n.id).sort()).toEqual(["a", "b"]);
  });

  it("returns empty for leaf", () => {
    const nodes = buildTestTree();
    expect(getChildren(nodes, "b")).toEqual([]);
  });

  it("returns empty for unknown node", () => {
    const nodes = buildTestTree();
    expect(getChildren(nodes, "missing")).toEqual([]);
  });
});

describe("buildTreeFromRoots", () => {
  it("builds a nested tree structure", () => {
    const nodes = buildTestTree();
    const tree = buildTreeFromRoots(nodes, ["r"]);
    expect(tree.length).toBe(1);
    expect(tree[0]!.node.id).toBe("r");
    expect(tree[0]!.children.length).toBe(2);

    const aEntry = tree[0]!.children.find((c) => c.node.id === "a");
    expect(aEntry).toBeDefined();
    expect(aEntry!.children.length).toBe(1);
    expect(aEntry!.children[0]!.node.id).toBe("a1");
  });

  it("skips missing root ids", () => {
    const nodes = buildTestTree();
    const tree = buildTreeFromRoots(nodes, ["missing", "r"]);
    expect(tree.length).toBe(1);
  });
});
