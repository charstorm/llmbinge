import { useEffect, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";

export function useTextSelection(containerRef: React.RefObject<HTMLElement | null>) {
  const setSelectedText = useUIStore((s) => s.setSelectedText);

  const handleMouseUp = useCallback(() => {
    // Defer so the browser finalises the selection after mouseup
    requestAnimationFrame(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectedText(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setSelectedText(null);
        return;
      }

      // Only capture selections within our container
      if (
        containerRef.current &&
        selection.anchorNode &&
        containerRef.current.contains(selection.anchorNode)
      ) {
        setSelectedText(text);
      }
    });
  }, [containerRef, setSelectedText]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("mouseup", handleMouseUp);
    return () => el.removeEventListener("mouseup", handleMouseUp);
  }, [containerRef, handleMouseUp]);
}
