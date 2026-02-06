import { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useSessionStore } from "@/stores/sessionStore";
import { useUIStore } from "@/stores/uiStore";
import { useStreamingArticle } from "@/hooks/useStreamingArticle";
import { getAncestors } from "@/tree/selectors";
import { ArticleContent } from "./ArticleContent";
import { RelatedTopics } from "./RelatedTopics";
import { AspectsList } from "./AspectsList";
import { ExploredSubtopics } from "./ExploredSubtopics";
import { ExploreSelectionButton } from "./ExploreSelectionButton";
import { ErrorBanner } from "@/components/common/ErrorBanner";

export function ArticlePage() {
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

  const { streaming, content, error, generate, abort, clearError } =
    useStreamingArticle(nodeId ?? "");

  // Auto-generate on mount if node has no content
  useEffect(() => {
    if (!node) return;
    if (node.content) return; // Already has content
    const aspect = node.metadata["aspect"] as string | undefined;
    generate(node.title, aspect);
  }, [node?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegenerate = useCallback(() => {
    if (!node) return;
    abort();
    const aspect = node.metadata["aspect"] as string | undefined;
    generate(node.title, aspect);
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
      <div className="article-page">
        <ErrorBanner message="Node not found" />
      </div>
    );
  }

  // Build breadcrumb from ancestors
  const ancestors = getAncestors(nodes, node.id).reverse();

  // Use node content if already loaded, or streaming content
  const displayContent = content || node.content;

  return (
    <div className="article-page">
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
          <button onClick={handleRegenerate} disabled={streaming}>
            {streaming ? "Generating..." : "Regenerate"}
          </button>
          <button onClick={handleDelete} disabled={streaming}>
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

      <ExploreSelectionButton
        nodeId={node.id}
        topic={node.title}
        disabled={streaming}
      />

      <ArticleContent content={displayContent} streaming={streaming} />

      <div className="article-sidebar-panels">
        <RelatedTopics
          topic={node.title}
          nodeId={node.id}
          disabled={streaming}
        />
        <AspectsList
          topic={node.title}
          nodeId={node.id}
          disabled={streaming}
        />
        <ExploredSubtopics nodeId={node.id} />
      </div>
    </div>
  );
}
