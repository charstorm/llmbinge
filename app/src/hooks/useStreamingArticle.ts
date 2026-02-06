import { useState, useRef, useCallback, useEffect } from "react";
import { generateArticle } from "@/agents/articleAgent";
import { useSessionStore } from "@/stores/sessionStore";
import { useConfigStore } from "@/stores/configStore";
import { StreamError } from "@/lib/errors";

interface StreamingState {
  streaming: boolean;
  content: string;
  error: string | null;
}

export function useStreamingArticle(nodeId: string) {
  const [state, setState] = useState<StreamingState>({
    streaming: false,
    content: "",
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = useConfigStore((s) => s.config);
  const updateNodeContent = useSessionStore((s) => s.updateNodeContent);
  const persistNode = useSessionStore((s) => s.persistNode);

  const generate = useCallback(
    async (topic: string, aspect?: string) => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ streaming: true, content: "", error: null });
      updateNodeContent(nodeId, "");

      try {
        await generateArticle(
          { topic, aspect },
          config.llm,
          {
            onToken: (token) => {
              setState((prev) => {
                const next = prev.content + token;
                updateNodeContent(nodeId, next);

                // Debounce persistence: persist every 500ms during streaming
                if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
                persistTimerRef.current = setTimeout(() => {
                  persistNode(nodeId);
                }, 500);

                return { ...prev, content: next };
              });
            },
            onComplete: (fullText) => {
              setState({ streaming: false, content: fullText, error: null });
              updateNodeContent(nodeId, fullText);
              // Final persist
              if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
              persistNode(nodeId);
            },
            onError: (err) => {
              // Ignore errors from intentional aborts (navigation, regeneration)
              if (controller.signal.aborted) return;

              const partial =
                err instanceof StreamError ? (err.partialContent ?? "") : "";
              setState((prev) => ({
                streaming: false,
                content: prev.content || partial,
                error: err.message,
              }));
              // Keep partial content in the node
              if (partial) {
                updateNodeContent(nodeId, partial);
                persistNode(nodeId);
              }
            },
          },
          controller.signal,
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setState((prev) => ({
            streaming: false,
            content: prev.content,
            error: err instanceof Error ? err.message : "Unknown error",
          }));
        }
      }
    },
    [nodeId, config.llm, updateNodeContent, persistNode],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    setState((prev) => ({ ...prev, streaming: false }));
  }, []);

  // Abort on unmount (navigate-away)
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, generate, abort, clearError };
}
