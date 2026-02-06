import { useUIStore } from "@/stores/uiStore";

export function ConfirmBanner() {
  const dialog = useUIStore((s) => s.confirmDialog);
  const dismissConfirm = useUIStore((s) => s.dismissConfirm);

  if (!dialog) return null;

  return (
    <div className="confirm-banner">
      <span>{dialog.message}</span>
      <div className="confirm-banner__actions">
        <button
          onClick={() => {
            dialog.onConfirm();
            dismissConfirm();
          }}
        >
          Confirm
        </button>
        <button onClick={dismissConfirm}>Cancel</button>
      </div>
    </div>
  );
}
