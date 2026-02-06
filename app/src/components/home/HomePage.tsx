import { useEffect } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { useConfigStore } from "@/stores/configStore";
import { SessionList } from "./SessionList";
import { NewSessionForm } from "./NewSessionForm";

export function HomePage() {
  const loadSessions = useSessionStore((s) => s.loadSessions);
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const loaded = useConfigStore((s) => s.loaded);

  useEffect(() => {
    loadSessions();
    if (!loaded) loadConfig();
  }, [loadSessions, loadConfig, loaded]);

  return (
    <div className="home-page">
      <h1>LLM Binge</h1>
      <NewSessionForm />
      <SessionList />
    </div>
  );
}
