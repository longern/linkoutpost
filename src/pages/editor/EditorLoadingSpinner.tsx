export function EditorLoadingSpinner({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-label="Loading"
      className={`editor-loading${className ? ` ${className}` : ""}`}
      role="status"
    >
      <span className="editor-loading-spinner" />
    </div>
  );
}
