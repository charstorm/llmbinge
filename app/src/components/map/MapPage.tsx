import { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useSessionStore } from "@/stores/sessionStore";
import { useUIStore } from "@/stores/uiStore";
import { useMapGeneration } from "@/hooks/useMapGeneration";
import { getAncestors } from "@/tree/selectors";
import { MapCanvas } from "./MapCanvas";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ExploredSubtopics } from "@/components/article/ExploredSubtopics";
import type { MapLayoutGroup } from "@/agents/types";

export function MapPage() {
  const { nodeId, sessionId } = useParams<{
    nodeId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const nodes = useSessionStore((s) => s.nodes);
  const deleteNode = useSessionStore((s) => s.deleteNode);
  const showConfirm = useUIStore((s) => s.showConfirm);
  const addToast = useUIStore((s) => s.addToast);
  const node = nodeId ? nodes.get(nodeId) : undefined;

  const { loading, phase, layout, error, generate, abort, clearError } =
    useMapGeneration(nodeId ?? "");

  // Parse existing layout from node content, or use freshly generated one
  const displayLayout = (() => {
    if (layout) return layout;
    if (!node?.content) return null;
    try {
      return JSON.parse(node.content) as { groups: MapLayoutGroup[] };
    } catch {
      return null;
    }
  })();

  // Auto-generate on mount if node has no content
  useEffect(() => {
    if (!node) return;
    if (node.content) return;
    generate(node.title);
  }, [node?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegenerate = useCallback(() => {
    if (!node) return;
    abort();
    generate(node.title);
  }, [node, abort, generate]);

  const handleDelete = useCallback(() => {
    if (!node || !sessionId) return;
    showConfirm(`Delete "${node.title}" and all its children?`, async () => {
      try {
        const parentId = node.parentId;
        await deleteNode(node.id);
        if (parentId) {
          navigate(`/session/${sessionId}/article/${parentId}`);
        } else {
          navigate("/");
        }
      } catch {
        addToast("Failed to delete node", "error");
      }
    });
  }, [node, sessionId, showConfirm, deleteNode, navigate, addToast]);

  if (!node) {
    return (
      <div className="map-page">
        <ErrorBanner message="Node not found" />
      </div>
    );
  }

  const ancestors = getAncestors(nodes, node.id).reverse();

  return (
    <div className="map-page">
      {ancestors.length > 0 && (
        <nav className="article-breadcrumb">
          {ancestors.map((a) => (
            <span key={a.id}>
              <button
                className="article-breadcrumb__link"
                onClick={() =>
                  navigate(`/session/${sessionId}/${a.type}/${a.id}`)
                }
              >
                {a.title}
              </button>
              <span className="article-breadcrumb__sep">/</span>
            </span>
          ))}
          <span className="article-breadcrumb__current">{node.title}</span>
        </nav>
      )}

      <header className="article-header">
        <h1>{node.title}</h1>
        <div className="article-header__actions">
          <button onClick={handleRegenerate} disabled={loading}>
            {loading ? `Generating (${phase})...` : "Regenerate"}
          </button>
          <button onClick={handleDelete} disabled={loading}>
            Delete
          </button>
        </div>
      </header>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={handleRegenerate}
          onDismiss={clearError}
        />
      )}

      {loading && !displayLayout && (
        <div className="map-loading">
          <LoadingSpinner />
          <span>
            {phase === "topics"
              ? "Generating topics..."
              : "Computing layout..."}
          </span>
        </div>
      )}

      {displayLayout && (
        <MapCanvas
          layout={displayLayout}
          nodeId={node.id}
          topic={node.title}
        />
      )}

      <div className="map-hint">
        Click a topic to explore its map. Shift+click to read an article.
      </div>

      <ExploredSubtopics nodeId={node.id} />
    </div>
  );
}
