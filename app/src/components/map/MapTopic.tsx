import { useNodeNavigation } from "@/hooks/useNodeNavigation";

interface MapTopicProps {
  name: string;
  group: string;
  x: number;
  y: number;
  parentNodeId: string;
  parentTopic: string;
}

export function MapTopic({
  name,
  group,
  x,
  y,
  parentNodeId,
  parentTopic,
}: MapTopicProps) {
  const { createAndNavigate } = useNodeNavigation();

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Shift+click → child article
      createAndNavigate(parentNodeId, name, "article", {
        sourceTopic: parentTopic,
        sourceGroup: group,
      });
    } else {
      // Click → child map
      createAndNavigate(parentNodeId, name, "map", {
        sourceTopic: parentTopic,
        sourceGroup: group,
      });
    }
  };

  return (
    <button
      className="map-topic"
      style={{ left: x, top: y }}
      onClick={handleClick}
      title="Click: explore map · Shift+click: read article"
    >
      {name}
    </button>
  );
}
