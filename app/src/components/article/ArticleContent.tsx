import { useRef } from "react";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import { useTextSelection } from "@/hooks/useTextSelection";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface ArticleContentProps {
  content: string;
  streaming: boolean;
}

export function ArticleContent({ content, streaming }: ArticleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useTextSelection(containerRef);

  if (!content && !streaming) {
    return null;
  }

  return (
    <div className="article-content" ref={containerRef}>
      {content ? (
        <MarkdownRenderer content={content} />
      ) : (
        <div className="article-content__loading">
          <LoadingSpinner />
          <span>Generating article...</span>
        </div>
      )}
      {streaming && content && (
        <div className="article-content__streaming-indicator">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}
