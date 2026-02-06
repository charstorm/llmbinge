import { useEffect, useState } from "react";
import { storage } from "@/storage/provider";
import type { Session, TreeNode } from "@/tree/types";

interface StorageSnapshot {
  sessions: Session[];
  nodeCounts: Map<string, number>;
  totalNodes: number;
}

export function DevStorage() {
  const [snapshot, setSnapshot] = useState<StorageSnapshot | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSnapshot = async () => {
    setLoading(true);
    const sessions = await storage.getSessions();
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);

    const nodeCounts = new Map<string, number>();
    let totalNodes = 0;
    for (const session of sessions) {
      const sessionNodes = await storage.getNodesForSession(session.id);
      nodeCounts.set(session.id, sessionNodes.length);
      totalNodes += sessionNodes.length;
    }

    setSnapshot({ sessions, nodeCounts, totalNodes });
    setLoading(false);
  };

  const loadSessionNodes = async (sessionId: string) => {
    setSelectedSession(sessionId);
    const sessionNodes = await storage.getNodesForSession(sessionId);
    sessionNodes.sort((a, b) => a.createdAt - b.createdAt);
    setNodes(sessionNodes);
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Dev: Storage Inspector</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        Inspect IndexedDB contents directly.
      </p>

      <button onClick={loadSnapshot} disabled={loading} style={{ marginBottom: 24 }}>
        {loading ? "Loading..." : "Refresh"}
      </button>

      {snapshot && (
        <>
          <div style={{ marginBottom: 24 }}>
            <strong>Total sessions:</strong> {snapshot.sessions.length}
            {" | "}
            <strong>Total nodes:</strong> {snapshot.totalNodes}
          </div>

          <h2 style={{ fontSize: "1.1rem", color: "var(--text-secondary)", marginBottom: 12 }}>
            Sessions
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "8px 12px" }}>Title</th>
                <th style={{ padding: "8px 12px" }}>ID</th>
                <th style={{ padding: "8px 12px" }}>Roots</th>
                <th style={{ padding: "8px 12px" }}>Nodes</th>
                <th style={{ padding: "8px 12px" }}>Updated</th>
                <th style={{ padding: "8px 12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {snapshot.sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 12px" }}>{s.title}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 12 }}>
                    {s.id.slice(0, 8)}
                  </td>
                  <td style={{ padding: "8px 12px" }}>{s.rootNodeIds.length}</td>
                  <td style={{ padding: "8px 12px" }}>
                    {snapshot.nodeCounts.get(s.id) ?? 0}
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: 13 }}>
                    {new Date(s.updatedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <button
                      onClick={() => loadSessionNodes(s.id)}
                      style={{ fontSize: 12, padding: "2px 8px" }}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedSession && nodes.length > 0 && (
            <>
              <h2 style={{ fontSize: "1.1rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                Nodes for session {selectedSession.slice(0, 8)}
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px" }}>Title</th>
                    <th style={{ padding: "8px 12px" }}>ID</th>
                    <th style={{ padding: "8px 12px" }}>Type</th>
                    <th style={{ padding: "8px 12px" }}>Parent</th>
                    <th style={{ padding: "8px 12px" }}>Children</th>
                    <th style={{ padding: "8px 12px" }}>Content</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((n) => (
                    <tr key={n.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 12px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {n.title}
                      </td>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 12 }}>
                        {n.id.slice(0, 8)}
                      </td>
                      <td style={{ padding: "8px 12px" }}>{n.type}</td>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 12 }}>
                        {n.parentId ? n.parentId.slice(0, 8) : "root"}
                      </td>
                      <td style={{ padding: "8px 12px" }}>{n.childrenIds.length}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12 }}>
                        {n.content ? `${n.content.length} chars` : "empty"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}
