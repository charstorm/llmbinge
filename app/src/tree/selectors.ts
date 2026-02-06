import type { TreeNode } from "./types";

export function getAncestors(
  nodes: Map<string, TreeNode>,
  nodeId: string,
): TreeNode[] {
  const ancestors: TreeNode[] = [];
  let current = nodes.get(nodeId);
  while (current?.parentId) {
    const parent = nodes.get(current.parentId);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }
  return ancestors;
}

export function getDescendants(
  nodes: Map<string, TreeNode>,
  nodeId: string,
): TreeNode[] {
  const descendants: TreeNode[] = [];
  const stack = [...(nodes.get(nodeId)?.childrenIds ?? [])];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const node = nodes.get(id);
    if (node) {
      descendants.push(node);
      stack.push(...node.childrenIds);
    }
  }
  return descendants;
}

export function getChildren(
  nodes: Map<string, TreeNode>,
  nodeId: string,
): TreeNode[] {
  const node = nodes.get(nodeId);
  if (!node) return [];
  return node.childrenIds
    .map((id) => nodes.get(id))
    .filter((n): n is TreeNode => n !== undefined);
}

export interface SidebarTreeEntry {
  node: TreeNode;
  children: SidebarTreeEntry[];
}

export function buildTreeFromRoots(
  nodes: Map<string, TreeNode>,
  rootIds: string[],
): SidebarTreeEntry[] {
  function buildEntry(nodeId: string): SidebarTreeEntry | null {
    const node = nodes.get(nodeId);
    if (!node) return null;
    return {
      node,
      children: node.childrenIds
        .map(buildEntry)
        .filter((e): e is SidebarTreeEntry => e !== null),
    };
  }
  return rootIds
    .map(buildEntry)
    .filter((e): e is SidebarTreeEntry => e !== null);
}
