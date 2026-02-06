import type { TreeNode } from "./types";
import { generateId } from "@/lib/id";

export function createNode(
  fields: Omit<TreeNode, "id" | "createdAt"> & {
    id?: string;
    createdAt?: number;
  },
): TreeNode {
  return {
    id: fields.id ?? generateId(),
    type: fields.type,
    parentId: fields.parentId,
    sessionId: fields.sessionId,
    title: fields.title,
    content: fields.content,
    metadata: fields.metadata,
    childrenIds: fields.childrenIds,
    createdAt: fields.createdAt ?? Date.now(),
  };
}

export function insertNode(
  nodes: Map<string, TreeNode>,
  node: TreeNode,
): Map<string, TreeNode> {
  const next = new Map(nodes);
  next.set(node.id, node);
  if (node.parentId && next.has(node.parentId)) {
    const parent = next.get(node.parentId)!;
    if (!parent.childrenIds.includes(node.id)) {
      next.set(parent.id, {
        ...parent,
        childrenIds: [...parent.childrenIds, node.id],
      });
    }
  }
  return next;
}

export function addChildId(
  nodes: Map<string, TreeNode>,
  parentId: string,
  childId: string,
): Map<string, TreeNode> {
  const parent = nodes.get(parentId);
  if (!parent) return nodes;
  if (parent.childrenIds.includes(childId)) return nodes;
  const next = new Map(nodes);
  next.set(parentId, {
    ...parent,
    childrenIds: [...parent.childrenIds, childId],
  });
  return next;
}

function collectDescendantIds(
  nodes: Map<string, TreeNode>,
  nodeId: string,
): string[] {
  const ids: string[] = [];
  const stack = [nodeId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    ids.push(current);
    const node = nodes.get(current);
    if (node) {
      for (const childId of node.childrenIds) {
        stack.push(childId);
      }
    }
  }
  return ids;
}

export function deleteNodeCascade(
  nodes: Map<string, TreeNode>,
  nodeId: string,
): { nodes: Map<string, TreeNode>; removedIds: string[] } {
  const removedIds = collectDescendantIds(nodes, nodeId);
  const removedSet = new Set(removedIds);
  const next = new Map(nodes);

  for (const id of removedIds) {
    next.delete(id);
  }

  const deleted = nodes.get(nodeId);
  if (deleted?.parentId && next.has(deleted.parentId)) {
    const parent = next.get(deleted.parentId)!;
    next.set(parent.id, {
      ...parent,
      childrenIds: parent.childrenIds.filter((id) => !removedSet.has(id)),
    });
  }

  return { nodes: next, removedIds };
}

export function updateNodeContent(
  nodes: Map<string, TreeNode>,
  nodeId: string,
  content: string,
): Map<string, TreeNode> {
  const node = nodes.get(nodeId);
  if (!node) return nodes;
  const next = new Map(nodes);
  next.set(nodeId, { ...node, content });
  return next;
}

export function updateNodeMetadata(
  nodes: Map<string, TreeNode>,
  nodeId: string,
  metadata: Record<string, unknown>,
): Map<string, TreeNode> {
  const node = nodes.get(nodeId);
  if (!node) return nodes;
  const next = new Map(nodes);
  next.set(nodeId, { ...node, metadata: { ...node.metadata, ...metadata } });
  return next;
}
