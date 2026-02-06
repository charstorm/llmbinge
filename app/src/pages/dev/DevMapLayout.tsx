import { MapCanvas } from "@/components/map/MapCanvas";

const SAMPLE_LAYOUT = {
  groups: [
    {
      name: "Physics",
      topics: [
        { name: "Quantum Mechanics", x: 0.1, y: 0.15 },
        { name: "General Relativity", x: 0.2, y: 0.3 },
        { name: "String Theory", x: 0.05, y: 0.45 },
        { name: "Thermodynamics", x: 0.25, y: 0.5 },
        { name: "Particle Physics", x: 0.15, y: 0.6 },
      ],
    },
    {
      name: "Mathematics",
      topics: [
        { name: "Topology", x: 0.5, y: 0.1 },
        { name: "Abstract Algebra", x: 0.6, y: 0.2 },
        { name: "Number Theory", x: 0.45, y: 0.35 },
        { name: "Differential Geometry", x: 0.55, y: 0.45 },
      ],
    },
    {
      name: "Computer Science",
      topics: [
        { name: "Machine Learning", x: 0.8, y: 0.15 },
        { name: "Algorithms", x: 0.9, y: 0.3 },
        { name: "Cryptography", x: 0.75, y: 0.4 },
        { name: "Distributed Systems", x: 0.85, y: 0.55 },
      ],
    },
    {
      name: "Philosophy",
      topics: [
        { name: "Epistemology", x: 0.3, y: 0.75 },
        { name: "Ethics", x: 0.45, y: 0.85 },
        { name: "Logic", x: 0.55, y: 0.7 },
        { name: "Metaphysics", x: 0.4, y: 0.6 },
      ],
    },
    {
      name: "Neuroscience",
      topics: [
        { name: "Consciousness", x: 0.7, y: 0.7 },
        { name: "Neural Networks", x: 0.8, y: 0.8 },
        { name: "Memory Formation", x: 0.9, y: 0.75 },
      ],
    },
  ],
};

export function DevMapLayout() {
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ marginBottom: 16 }}>Dev: Map Layout Test</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        Static sample layout. Click/shift+click won't navigate (no session
        context).
      </p>
      <MapCanvas
        layout={SAMPLE_LAYOUT}
        nodeId="dev-node"
        topic="Science & Knowledge"
      />
    </div>
  );
}
