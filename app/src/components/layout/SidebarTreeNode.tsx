import { Link, useParams } from "react-router";
import type { SidebarTreeEntry } from "@/tree/selectors";
import { useState } from "react";

export function SidebarTreeNode({
  entry,
  sessionId,
}: {
  entry: SidebarTreeEntry;
  sessionId: string;
}) {
  const { nodeId } = useParams<{ nodeId: string }>();
  const [expanded, setExpanded] = useState(true);
  const isActive = nodeId === entry.node.id;
  const hasChildren = entry.children.length > 0;

  const path =
    entry.node.type === "article"
      ? `/session/${sessionId}/article/${entry.node.id}`
      : `/session/${sessionId}/map/${entry.node.id}`;

  return (
    <div className="sidebar-node">
      <div
        className={`sidebar-node__row ${isActive ? "sidebar-node__row--active" : ""}`}
      >
        {hasChildren ? (
          <button
            className="sidebar-node__toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "\u25be" : "\u25b8"}
          </button>
        ) : (
          <span className="sidebar-node__spacer" />
        )}
        <Link to={path} className="sidebar-node__link">
          <span className="sidebar-node__type">
            {entry.node.type === "article" ? "art" : "map"}
          </span>
          <span className="sidebar-node__title">{entry.node.title}</span>
        </Link>
      </div>
      {hasChildren && expanded && (
        <div className="sidebar-node__children">
          {entry.children.map((child) => (
            <SidebarTreeNode
              key={child.node.id}
              entry={child}
              sessionId={sessionId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
