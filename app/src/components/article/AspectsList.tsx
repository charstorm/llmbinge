import { useConfigStore } from "@/stores/configStore";
import { useNodeNavigation } from "@/hooks/useNodeNavigation";

interface AspectsListProps {
  topic: string;
  nodeId: string;
  disabled: boolean;
}

export function AspectsList({ topic, nodeId, disabled }: AspectsListProps) {
  const aspects = useConfigStore((s) => s.config.aspects.fixed);
  const { createAndNavigate } = useNodeNavigation();

  if (disabled || aspects.length === 0) return null;

  return (
    <div className="article-aspects">
      <h3>Explore by Aspect</h3>
      <div className="article-aspects__list">
        {aspects.map((aspect) => (
          <button
            key={aspect}
            className="article-aspects__chip"
            onClick={() =>
              createAndNavigate(nodeId, `${topic} — ${aspect}`, "article", {
                aspect,
                sourceTopic: topic,
              })
            }
          >
            {aspect}
          </button>
        ))}
      </div>
    </div>
  );
}
