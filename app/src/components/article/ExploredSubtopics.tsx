import { useSessionStore } from "@/stores/sessionStore";
import { useNodeNavigation } from "@/hooks/useNodeNavigation";
import { getChildren } from "@/tree/selectors";

interface ExploredSubtopicsProps {
  nodeId: string;
}

export function ExploredSubtopics({ nodeId }: ExploredSubtopicsProps) {
  const nodes = useSessionStore((s) => s.nodes);
  const { navigateToNode } = useNodeNavigation();
  const children = getChildren(nodes, nodeId);

  if (children.length === 0) return null;

  return (
    <div className="article-explored">
      <h3>Explored Subtopics</h3>
      <ul className="article-explored__list">
        {children.map((child) => (
          <li key={child.id}>
            <button onClick={() => navigateToNode(child.id, child.type)}>
              <span className="article-explored__type">
                {child.type === "article" ? "art" : "map"}
              </span>
              {child.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
