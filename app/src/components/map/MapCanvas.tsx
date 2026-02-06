import { useRef } from "react";
import type { MapLayoutGroup } from "@/agents/types";
import { MapTopic } from "./MapTopic";
import { MapConnections } from "./MapConnections";

interface MapCanvasProps {
  layout: { groups: MapLayoutGroup[] };
  nodeId: string;
  topic: string;
}

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 700;
const PADDING = 40;

export function MapCanvas({ layout, nodeId, topic }: MapCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Flatten all topics with their pixel positions
  const allTopics = layout.groups.flatMap((group) =>
    group.topics.map((t) => ({
      name: t.name,
      group: group.name,
      x: PADDING + t.x * (CANVAS_WIDTH - PADDING * 2),
      y: PADDING + t.y * (CANVAS_HEIGHT - PADDING * 2),
    })),
  );

  return (
    <div
      ref={canvasRef}
      className="map-canvas"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <MapConnections
        groups={layout.groups}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        padding={PADDING}
      />

      {allTopics.map((t) => (
        <MapTopic
          key={`${t.group}-${t.name}`}
          name={t.name}
          group={t.group}
          x={t.x}
          y={t.y}
          parentNodeId={nodeId}
          parentTopic={topic}
        />
      ))}

      {/* Group labels positioned at the centroid of each group */}
      {layout.groups.map((group) => {
        const topics = group.topics;
        if (topics.length === 0) return null;

        const avgX =
          topics.reduce((sum, t) => sum + t.x, 0) / topics.length;
        const avgY =
          topics.reduce((sum, t) => sum + t.y, 0) / topics.length;

        const px = PADDING + avgX * (CANVAS_WIDTH - PADDING * 2);
        const py = PADDING + avgY * (CANVAS_HEIGHT - PADDING * 2);

        return (
          <div
            key={group.name}
            className="map-group-label"
            style={{ left: px, top: py - 24 }}
          >
            {group.name}
          </div>
        );
      })}
    </div>
  );
}
