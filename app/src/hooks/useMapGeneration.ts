import { useState, useRef, useCallback, useEffect } from "react";
import { generateMapTopics } from "@/agents/mapTopicGeneratorAgent";
import { generateMapLayout } from "@/agents/mapLayoutAgent";
import { useSessionStore } from "@/stores/sessionStore";
import { useConfigStore } from "@/stores/configStore";
import type { MapLayoutGroup } from "@/agents/types";

type Phase = "idle" | "topics" | "layout" | "done";

interface MapGenerationState {
  loading: boolean;
  phase: Phase;
  layout: { groups: MapLayoutGroup[] } | null;
  error: string | null;
}

export function useMapGeneration(nodeId: string) {
  const [state, setState] = useState<MapGenerationState>({
    loading: false,
    phase: "idle",
    layout: null,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const config = useConfigStore((s) => s.config);
  const updateNodeContent = useSessionStore((s) => s.updateNodeContent);
  const updateNodeMetadata = useSessionStore((s) => s.updateNodeMetadata);
  const persistNode = useSessionStore((s) => s.persistNode);

  const generate = useCallback(
    async (topic: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ loading: true, phase: "topics", layout: null, error: null });

      try {
        // Step 1: Generate topics
        const topicsResult = await generateMapTopics(
          { topic },
          config.llm,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setState((prev) => ({ ...prev, phase: "layout" }));

        // Step 2: Generate layout from topics
        const layoutResult = await generateMapLayout(
          { topics: topicsResult.topics },
          config.llm,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        // Persist layout as JSON content, topics as metadata
        const content = JSON.stringify(layoutResult.layout);
        updateNodeContent(nodeId, content);
        updateNodeMetadata(nodeId, { topics: topicsResult.topics });
        await persistNode(nodeId);

        setState({
          loading: false,
          phase: "done",
          layout: layoutResult.layout,
          error: null,
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setState({
            loading: false,
            phase: "idle",
            layout: null,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    },
    [nodeId, config.llm, updateNodeContent, updateNodeMetadata, persistNode],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => ({ ...prev, loading: false, phase: "idle" }));
  }, []);

  // Abort on unmount (navigate-away)
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, generate, abort, clearError };
}
