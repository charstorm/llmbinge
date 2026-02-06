import { useUIStore } from "@/stores/uiStore";
import { useNodeNavigation } from "@/hooks/useNodeNavigation";

interface ExploreSelectionButtonProps {
  nodeId: string;
  topic: string;
  disabled: boolean;
}

export function ExploreSelectionButton({
  nodeId,
  topic,
  disabled,
}: ExploreSelectionButtonProps) {
  const selectedText = useUIStore((s) => s.selectedText);
  const setSelectedText = useUIStore((s) => s.setSelectedText);
  const addToast = useUIStore((s) => s.addToast);
  const { createAndNavigate } = useNodeNavigation();

  if (disabled || !selectedText) return null;

  const handleExplore = async () => {
    const text = selectedText;
    setSelectedText(null);
    window.getSelection()?.removeAllRanges();
    try {
      await createAndNavigate(nodeId, text, "article", {
        sourceTopic: topic,
        selectedText: text,
      });
    } catch {
      addToast("Failed to explore selection", "error");
    }
  };

  return (
    <div className="article-explore-selection">
      <button onClick={handleExplore}>
        Explore: &ldquo;{selectedText.length > 50
          ? selectedText.slice(0, 50) + "..."
          : selectedText}&rdquo;
      </button>
    </div>
  );
}
