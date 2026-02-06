import { useState, useEffect } from "react";
import { generateTopicSuggestions } from "@/agents/topicSuggestionAgent";
import { useConfigStore } from "@/stores/configStore";
import { useNodeNavigation } from "@/hooks/useNodeNavigation";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface RelatedTopicsProps {
  topic: string;
  nodeId: string;
  disabled: boolean;
}

export function RelatedTopics({ topic, nodeId, disabled }: RelatedTopicsProps) {
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = useConfigStore((s) => s.config);
  const { createAndNavigate } = useNodeNavigation();

  const fetchTopics = () => {
    if (disabled || loaded) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    generateTopicSuggestions(
      { topic, starterTopics: config.topics.starters },
      config.llm,
    )
      .then((result) => {
        if (!cancelled) {
          setTopics(result.topics);
          setLoaded(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load suggestions");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  };

  useEffect(fetchTopics, [topic, disabled, loaded, config]); // eslint-disable-line react-hooks/exhaustive-deps

  if (disabled) return null;

  return (
    <div className="article-related">
      <h3>Related Topics</h3>
      {loading && (
        <div className="article-related__loading">
          <LoadingSpinner />
        </div>
      )}
      {error && (
        <div className="article-related__error">
          <span>{error}</span>
          <button onClick={() => { setError(null); setLoaded(false); }}>
            Retry
          </button>
        </div>
      )}
      {topics.length > 0 && (
        <ul className="article-related__list">
          {topics.map((t) => (
            <li key={t}>
              <button
                onClick={() => createAndNavigate(nodeId, t, "article", { sourceTopic: topic })}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
