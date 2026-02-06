import { useSessionStore } from "@/stores/sessionStore";
import { buildTreeFromRoots } from "@/tree/selectors";
import { SidebarTreeNode } from "./SidebarTreeNode";
import { Link, useParams } from "react-router";

export function Sidebar() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const sessions = useSessionStore((s) => s.sessions);
  const nodes = useSessionStore((s) => s.nodes);
  const session = sessions.find((s) => s.id === sessionId);

  const tree = session ? buildTreeFromRoots(nodes, session.rootNodeIds) : [];

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <Link to="/" className="sidebar__back">
          &larr; Home
        </Link>
        <h2 className="sidebar__title">{session?.title ?? "Session"}</h2>
      </div>
      <nav className="sidebar__tree">
        {tree.map((entry) => (
          <SidebarTreeNode
            key={entry.node.id}
            entry={entry}
            sessionId={sessionId!}
          />
        ))}
      </nav>
    </aside>
  );
}
