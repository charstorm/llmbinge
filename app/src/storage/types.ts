import type { TreeNode, Session } from "@/tree/types";
import type { AppConfig } from "@/config/configSchema";

export interface StorageProvider {
  // Sessions
  getSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  saveSession(session: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;

  // Nodes
  getNode(id: string): Promise<TreeNode | undefined>;
  getNodesForSession(sessionId: string): Promise<TreeNode[]>;
  saveNode(node: TreeNode): Promise<void>;
  saveNodes(nodes: TreeNode[]): Promise<void>;
  deleteNode(id: string): Promise<void>;
  deleteNodes(ids: string[]): Promise<void>;

  // Config
  getConfigOverrides(): Promise<Partial<AppConfig> | undefined>;
  saveConfigOverrides(config: Partial<AppConfig>): Promise<void>;
}
