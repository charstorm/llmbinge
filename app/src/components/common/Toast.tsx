import type { ToastItem } from "@/stores/uiStore";
import { useUIStore } from "@/stores/uiStore";

export function Toast({ toast }: { toast: ToastItem }) {
  const dismissToast = useUIStore((s) => s.dismissToast);
  return (
    <div className={`toast toast--${toast.type}`}>
      <span>{toast.message}</span>
      <button onClick={() => dismissToast(toast.id)}>×</button>
    </div>
  );
}
