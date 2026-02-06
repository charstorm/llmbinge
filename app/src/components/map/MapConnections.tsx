import type { MapLayoutGroup } from "@/agents/types";

interface MapConnectionsProps {
  groups: MapLayoutGroup[];
  width: number;
  height: number;
  padding: number;
}

export function MapConnections({
  groups,
  width,
  height,
  padding,
}: MapConnectionsProps) {
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  return (
    <svg className="map-connections" width={width} height={height}>
      {groups.map((group) => {
        const topics = group.topics;
        if (topics.length < 2) return null;

        // Connect sequential topics within each group
        const lines: {
          key: string;
          x1: number;
          y1: number;
          x2: number;
          y2: number;
        }[] = [];

        for (let i = 0; i < topics.length - 1; i++) {
          const a = topics[i]!;
          const b = topics[i + 1]!;
          lines.push({
            key: `${group.name}-${i}`,
            x1: padding + a.x * usableW,
            y1: padding + a.y * usableH,
            x2: padding + b.x * usableW,
            y2: padding + b.y * usableH,
          });
        }

        return lines.map((line) => (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="map-connection-line"
          />
        ));
      })}
    </svg>
  );
}
