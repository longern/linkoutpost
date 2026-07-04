import { normalizeHandle } from "../../profile";

type HandleSetupDialogProps = {
  error: string | null;
  handleDraft: string;
  saving: boolean;
  onDraftChange(handle: string): void;
  onErrorClear(): void;
  onSubmit(event: React.FormEvent<HTMLFormElement>): void;
};

export function HandleSetupDialog({
  error,
  handleDraft,
  saving,
  onDraftChange,
  onErrorClear,
  onSubmit,
}: HandleSetupDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="handle-setup-title"
        className="modal-card"
        role="dialog"
        aria-modal="true"
      >
        <form onSubmit={onSubmit}>
          <h2 id="handle-setup-title">Create a handle</h2>
          <p>Each handle has its own public LinkOutpost page.</p>
          <label>
            Handle
            <input
              autoFocus
              value={handleDraft}
              onChange={(event) => {
                onDraftChange(normalizeHandle(event.target.value));
                onErrorClear();
              }}
            />
          </label>
          {error && <p className="field-error">{error}</p>}
          <button className="primary-link" disabled={saving} type="submit">
            {saving ? "Creating" : "Create handle"}
          </button>
        </form>
      </section>
    </div>
  );
}
