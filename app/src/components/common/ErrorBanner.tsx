export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="error-banner">
      <span>{message}</span>
      <div className="error-banner__actions">
        {onRetry && <button onClick={onRetry}>Retry</button>}
        {onDismiss && (
          <button className="error-banner__dismiss" onClick={onDismiss}>
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
