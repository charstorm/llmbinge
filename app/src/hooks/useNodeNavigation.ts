import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useSessionStore } from "@/stores/sessionStore";

export function useNodeNavigation() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const addNode = useSessionStore((s) => s.addNode);

  const navigateToNode = useCallback(
    (nodeId: string, type: "article" | "map") => {
      if (!sessionId) return;
      navigate(`/session/${sessionId}/${type}/${nodeId}`);
    },
    [sessionId, navigate],
  );

  const createAndNavigate = useCallback(
    async (
      parentId: string,
      title: string,
      type: "article" | "map" = "article",
      metadata: Record<string, unknown> = {},
    ) => {
      if (!sessionId) return null;
      const node = await addNode({
        type,
        parentId,
        sessionId,
        title,
        content: "",
        metadata,
        childrenIds: [],
      });
      navigate(`/session/${sessionId}/${type}/${node.id}`);
      return node;
    },
    [sessionId, addNode, navigate],
  );

  return { navigateToNode, createAndNavigate, sessionId };
}
