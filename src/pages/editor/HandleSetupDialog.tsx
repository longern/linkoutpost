import { normalizeHandle } from "../../profile";
import { siteTitle } from "../../siteConfig";
import { FaXmark } from "react-icons/fa6";
import { useTranslation } from "../../i18n";

type HandleSetupDialogProps = {
  error: string | null;
  handleDraft: string;
  saving: boolean;
  onClose?: () => void;
  onDraftChange(handle: string): void;
  onErrorClear(): void;
  onSubmit(event: React.FormEvent<HTMLFormElement>): void;
};

export function HandleSetupDialog({
  error,
  handleDraft,
  saving,
  onClose,
  onDraftChange,
  onErrorClear,
  onSubmit,
}: HandleSetupDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="handle-setup-title"
        className="modal-card"
        role="dialog"
        aria-modal="true"
      >
        <form onSubmit={onSubmit}>
          <div className="handle-setup-header">
            <h2 id="handle-setup-title">
              {t("editor.forms.createHandle")}
            </h2>
            {onClose && (
              <button
                aria-label={t("editor.forms.closeHandleDialog")}
                className="circle-icon-button"
                onClick={onClose}
                type="button"
              >
                <FaXmark aria-hidden="true" size={18} />
              </button>
            )}
          </div>
          <p>
            {t("editor.forms.handleDescription", { siteTitle })}
          </p>
          <label>
            {t("editor.forms.handle")}
            <input
              autoFocus
              name="handle"
              value={handleDraft}
              onChange={(event) => {
                onDraftChange(normalizeHandle(event.target.value));
                onErrorClear();
              }}
            />
          </label>
          {error && <p className="field-error">{error}</p>}
          <button className="button-primary" disabled={saving} type="submit">
            {saving
              ? t("editor.forms.creating")
              : t("editor.forms.createHandleAction")}
          </button>
        </form>
      </section>
    </div>
  );
}
