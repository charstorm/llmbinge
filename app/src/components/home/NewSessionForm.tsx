import { useState } from "react";
import { useNavigate } from "react-router";
import { useSessionStore } from "@/stores/sessionStore";
import { useConfigStore } from "@/stores/configStore";
import { generateRandomTopic } from "@/agents/randomTopicAgent";
import { useUIStore } from "@/stores/uiStore";

export function NewSessionForm() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const createSession = useSessionStore((s) => s.createSession);
  const config = useConfigStore((s) => s.config);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) return;
    const { session, rootNode } = await createSession(trimmed, trimmed);
    navigate(`/session/${session.id}/article/${rootNode.id}`);
  };

  const handleRandom = async () => {
    setLoading(true);
    try {
      const result = await generateRandomTopic(config.llm);
      setTopic(result.topic);
    } catch {
      addToast("Failed to generate random topic", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="new-session-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter a topic to explore..."
        className="new-session-form__input"
      />
      <div className="new-session-form__actions">
        <button type="submit" disabled={!topic.trim()}>
          Start Exploring
        </button>
        <button type="button" onClick={handleRandom} disabled={loading}>
          {loading ? "Generating..." : "Random Topic"}
        </button>
      </div>
    </form>
  );
}
