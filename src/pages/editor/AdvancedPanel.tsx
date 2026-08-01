import { FaTrash } from "react-icons/fa6";
import { useTranslation } from "../../i18n";
import type { LinkProfile } from "../../profile";

type AdvancedPanelProps = {
  deleting: boolean;
  error: string | null;
  onDeleteHandle(): void;
  profile: LinkProfile;
};

export function AdvancedPanel({
  deleting,
  error,
  onDeleteHandle,
  profile,
}: AdvancedPanelProps) {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t("editor.advanced.ariaLabel")}
      className="advanced-panel"
    >
      <section
        aria-labelledby="advanced-delete-handle-title"
        className="advanced-danger-zone"
      >
        <div className="advanced-danger-copy">
          <h2 id="advanced-delete-handle-title">
            {t("editor.advanced.deleteHandle")}
          </h2>
          <p>
            {t("editor.advanced.deleteDescription", {
              handle: profile.handle,
            })}
          </p>
        </div>
        <button
          className="advanced-delete-button"
          disabled={deleting || !profile.handle}
          onClick={onDeleteHandle}
          type="button"
        >
          <FaTrash aria-hidden="true" size={15} />
          {deleting
            ? t("editor.advanced.deleting")
            : t("editor.advanced.deleteAction", { handle: profile.handle })}
        </button>
        {error ? (
          <p className="advanced-delete-error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </section>
  );
}
