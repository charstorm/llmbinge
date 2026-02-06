import { useState, useEffect } from "react";
import type { ToastItem } from "@/stores/uiStore";
import { useUIStore } from "@/stores/uiStore";

const FADE_OUT_MS = 300;
const AUTO_DISMISS_MS = 4700; // Total 5s including fade

export function Toast({ toast }: { toast: ToastItem }) {
  const dismissToast = useUIStore((s) => s.dismissToast);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), AUTO_DISMISS_MS);
    const removeTimer = setTimeout(
      () => dismissToast(toast.id),
      AUTO_DISMISS_MS + FADE_OUT_MS,
    );
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, dismissToast]);

  const handleDismiss = () => {
    setFading(true);
    setTimeout(() => dismissToast(toast.id), FADE_OUT_MS);
  };

  return (
    <div className={`toast toast--${toast.type}${fading ? " toast--fading" : ""}`}>
      <span>{toast.message}</span>
      <button onClick={handleDismiss}>&times;</button>
    </div>
  );
}
