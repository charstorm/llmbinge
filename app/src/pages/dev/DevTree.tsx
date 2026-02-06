import { useSessionStore } from "@/stores/sessionStore";
import { buildTreeFromRoots, type SidebarTreeEntry } from "@/tree/selectors";

function TreeNodeView({ entry, depth }: { entry: SidebarTreeEntry; depth: number }) {
  const indent = depth * 24;
  const node = entry.node;

  return (
    <>
      <tr style={{ borderBottom: "1px solid var(--border)" }}>
        <td style={{ padding: "6px 12px", paddingLeft: indent + 12 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 10, marginRight: 6, textTransform: "uppercase" }}>
            {node.type}
          </span>
          {node.title}
        </td>
        <td style={{ padding: "6px 12px", fontFamily: "monospace", fontSize: 12 }}>
          {node.id.slice(0, 8)}
        </td>
        <td style={{ padding: "6px 12px", fontSize: 12 }}>
          {node.content ? `${node.content.length} chars` : "empty"}
        </td>
        <td style={{ padding: "6px 12px", fontSize: 12 }}>
          {node.childrenIds.length}
        </td>
        <td style={{ padding: "6px 12px", fontSize: 12, color: "var(--text-muted)" }}>
          {Object.keys(node.metadata).length > 0
            ? JSON.stringify(node.metadata).slice(0, 60)
            : ""}
        </td>
      </tr>
      {entry.children.map((child) => (
        <TreeNodeView key={child.node.id} entry={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function DevTree() {
  const sessions = useSessionStore((s) => s.sessions);
  const nodes = useSessionStore((s) => s.nodes);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const loadSession = useSessionStore((s) => s.loadSession);
  const loadSessions = useSessionStore((s) => s.loadSessions);

  const session = sessions.find((s) => s.id === currentSessionId);
  const tree = session ? buildTreeFromRoots(nodes, session.rootNodeIds) : [];

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Dev: Tree Viewer</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        View the in-memory tree structure. Select a session to inspect.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <button onClick={() => loadSessions()}>Load Sessions</button>
        {sessions.length > 0 && (
          <select
            value={currentSessionId ?? ""}
            onChange={(e) => {
              if (e.target.value) loadSession(e.target.value);
            }}
            style={{ maxWidth: 300 }}
          >
            <option value="">Select session...</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.id.slice(0, 8)})
              </option>
            ))}
          </select>
        )}
      </div>

      {session && (
        <div style={{ marginBottom: 16, fontSize: 14 }}>
          <strong>Session:</strong> {session.title}
          {" | "}
          <strong>Roots:</strong> {session.rootNodeIds.length}
          {" | "}
          <strong>Total nodes:</strong> {nodes.size}
        </div>
      )}

      {tree.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>Title</th>
              <th style={{ padding: "8px 12px" }}>ID</th>
              <th style={{ padding: "8px 12px" }}>Content</th>
              <th style={{ padding: "8px 12px" }}>Children</th>
              <th style={{ padding: "8px 12px" }}>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {tree.map((entry) => (
              <TreeNodeView key={entry.node.id} entry={entry} depth={0} />
            ))}
          </tbody>
        </table>
      )}

      {session && tree.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>No nodes in this session.</p>
      )}
    </div>
  );
}
