export interface TreeNode {
  id: string;
  type: "article" | "map";
  parentId: string | null;
  sessionId: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  childrenIds: string[];
  createdAt: number;
}

export interface Session {
  id: string;
  title: string;
  rootNodeIds: string[];
  createdAt: number;
  updatedAt: number;
}
