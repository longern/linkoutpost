import "./ProfileCardLayout.editor.css";

export function ProfileCardLayoutPreview() {
  return (
    <>
      <span className="layout-preview-card">
        <span className="layout-preview-card-avatar" />
        <span className="layout-preview-card-line" />
        <span className="layout-preview-card-line" />
      </span>
      <span className="layout-preview-title" />
      <span className="layout-preview-link" />
      <span className="layout-preview-link" />
    </>
  );
}
