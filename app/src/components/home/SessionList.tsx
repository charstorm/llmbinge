import { useSessionStore } from "@/stores/sessionStore";
import { Link } from "react-router";

export function SessionList() {
  const sessions = useSessionStore((s) => s.sessions);

  if (sessions.length === 0) {
    return (
      <p className="session-list__empty">No sessions yet. Start exploring!</p>
    );
  }

  return (
    <div className="session-list">
      <h2>Sessions</h2>
      {sessions.map((session) => {
        const firstRootId = session.rootNodeIds[0];
        const to = firstRootId
          ? `/session/${session.id}/article/${firstRootId}`
          : `/session/${session.id}`;

        return (
          <Link key={session.id} to={to} className="session-list__item">
            <span className="session-list__title">{session.title}</span>
            <span className="session-list__date">
              {new Date(session.updatedAt).toLocaleDateString()}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
