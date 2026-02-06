interface ConfigFieldProps {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}

export function ConfigField({ label, description, error, children }: ConfigFieldProps) {
  return (
    <div className={`config-field${error ? " config-field--error" : ""}`}>
      <label className="config-field__label">{label}</label>
      {description && (
        <p className="config-field__desc">{description}</p>
      )}
      <div className="config-field__input">{children}</div>
      {error && <p className="config-field__error">{error}</p>}
    </div>
  );
}
