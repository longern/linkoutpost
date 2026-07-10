import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";
import type { LinkItem } from "../../../profile";
import { MediaCardPreview } from "./MediaCardPreview";

export function LinkEditDialog({
  link,
  linkImageUrl,
  onImageChange,
  visible,
  onRequestClose,
  onSaveLink,
  onUpdate,
}: {
  link: LinkItem;
  linkImageUrl?: string | null;
  onImageChange(id: string, file: File | null): void;
  visible: boolean;
  onRequestClose(): void;
  onSaveLink(id: string): void;
  onUpdate(id: string, patch: Partial<LinkItem>): void;
}) {
  function closeAndSave(): void {
    onSaveLink(link.id);
    onRequestClose();
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`modal-backdrop link-edit-backdrop${visible ? " is-open" : " is-closing"}`}
      role="presentation"
    >
      <button
        aria-label="Close link editor"
        className="link-edit-scrim"
        onClick={closeAndSave}
        type="button"
      />
      <section
        aria-labelledby={`link-edit-title-${link.id}`}
        aria-modal="true"
        className={`modal-card link-edit-dialog link-edit-mobile-sheet${visible ? " is-open" : " is-closing"}`}
        role="dialog"
      >
        <header className="link-edit-header">
          <h2 id={`link-edit-title-${link.id}`}>
            {link.type === "image" ? "Edit media" : "Edit link"}
          </h2>
          <button
            aria-label="Close link editor"
            className="circle-icon-button"
            onClick={closeAndSave}
            title="Close"
            type="button"
          >
            <FaXmark aria-hidden="true" size={18} />
          </button>
        </header>
        <hr className="link-edit-divider" />
        <form
          className="link-edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            closeAndSave();
          }}
        >
          {link.type === "image" ? (
            <div className="link-edit-field">
              <span>Media</span>
              <label
                className={`image-card-upload link-edit-image-upload${linkImageUrl ? " has-image" : ""}`}
              >
                <MediaCardPreview mediaUrl={linkImageUrl} />
                <input
                  accept="image/*,video/*"
                  onChange={(event) => {
                    onImageChange(
                      link.id,
                      event.currentTarget.files?.[0] ?? null,
                    );
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
            </div>
          ) : null}
          <label className="link-edit-field">
            <span>Title</span>
            <input
              aria-label={
                link.type === "image" ? "Media card title" : "Link title"
              }
              autoFocus
              placeholder={link.type === "image" ? "Media title" : "Link title"}
              value={link.label}
              onChange={(event) =>
                onUpdate(link.id, { label: event.target.value })
              }
            />
          </label>
          <label className="link-edit-field">
            <span>URL</span>
            <input
              aria-label={link.type === "image" ? "Media card URL" : "Link URL"}
              placeholder={
                link.type === "image"
                  ? "Optional link URL"
                  : "https://example.com"
              }
              value={link.url}
              onChange={(event) =>
                onUpdate(link.id, { url: event.target.value })
              }
            />
          </label>
          {link.type === "image" ? null : (
            <div className="link-edit-field">
              <span id={`link-display-title-${link.id}`}>Display</span>
              <div
                aria-labelledby={`link-display-title-${link.id}`}
                className="link-edit-segmented"
                role="radiogroup"
              >
                {(["auto", "embed", "link"] as const).map((mode) => (
                  <label
                    className={`link-edit-segment${(link.embedMode ?? "auto") === mode ? " is-selected" : ""}`}
                    key={mode}
                  >
                    <input
                      checked={(link.embedMode ?? "auto") === mode}
                      name={`link-display-mode-${link.id}`}
                      onChange={() => onUpdate(link.id, { embedMode: mode })}
                      type="radio"
                      value={mode}
                    />
                    <span>
                      {mode === "auto"
                        ? "Auto"
                        : mode === "embed"
                          ? "Embed"
                          : "Link"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <button className="button-primary link-edit-save" type="submit">
            Save
          </button>
        </form>
      </section>
    </div>,
    document.body,
  );
}
