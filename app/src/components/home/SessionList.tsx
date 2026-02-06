import { useSessionStore } from "@/stores/sessionStore";
import { useUIStore } from "@/stores/uiStore";
import { Link } from "react-router";

export function SessionList() {
  const sessions = useSessionStore((s) => s.sessions);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const showConfirm = useUIStore((s) => s.showConfirm);
  const addToast = useUIStore((s) => s.addToast);

  if (sessions.length === 0) {
    return (
      <p className="session-list__empty">No sessions yet. Start exploring!</p>
    );
  }

  const handleDelete = (
    e: React.MouseEvent,
    sessionId: string,
    title: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    showConfirm(`Delete session "${title}" and all its data?`, async () => {
      try {
        await deleteSession(sessionId);
      } catch {
        addToast("Failed to delete session", "error");
      }
    });
  };

  return (
    <div className="session-list">
      <h2>Sessions</h2>
      {sessions.map((session) => {
        const firstRootId = session.rootNodeIds[0];
        const to = firstRootId
          ? `/session/${session.id}/article/${firstRootId}`
          : `/session/${session.id}`;

        return (
          <div key={session.id} className="session-list__item">
            <Link to={to} className="session-list__link">
              <span className="session-list__title">{session.title}</span>
              <span className="session-list__date">
                {new Date(session.updatedAt).toLocaleDateString()}
              </span>
            </Link>
            <button
              className="session-list__delete"
              onClick={(e) => handleDelete(e, session.id, session.title)}
            >
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}
