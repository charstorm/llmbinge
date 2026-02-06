import { Outlet, useParams } from "react-router";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useSessionStore } from "@/stores/sessionStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function SessionLayout() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const loadSession = useSessionStore((s) => s.loadSession);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const loading = useSessionStore((s) => s.loading);

  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, currentSessionId, loadSession]);

  return (
    <div className="session-layout">
      <Sidebar />
      <main className="session-layout__content">
        {loading ? <LoadingSpinner /> : <Outlet />}
      </main>
    </div>
  );
}
