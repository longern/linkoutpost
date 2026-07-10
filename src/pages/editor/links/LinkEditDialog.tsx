import { createPortal } from "react-dom";
import { FaImage, FaTrash, FaXmark } from "react-icons/fa6";
import type { LinkItem } from "../../../profile";
import { MediaCardPreview } from "./MediaCardPreview";

export function LinkEditDialog({
  link,
  linkImageUrl,
  linkThumbnailUrl,
  onEmbedModeChange,
  onImageChange,
  onMetadataRefresh,
  visible,
  onRequestClose,
  onSaveLink,
  onThumbnailChange,
  onThumbnailRemove,
  onUpdate,
  onUrlChange,
}: {
  link: LinkItem;
  linkImageUrl?: string | null;
  linkThumbnailUrl?: string | null;
  onEmbedModeChange(
    id: string,
    mode: NonNullable<LinkItem["embedMode"]>,
  ): void;
  onImageChange(id: string, file: File | null): void;
  onMetadataRefresh(id: string): void;
  visible: boolean;
  onRequestClose(): void;
  onSaveLink(id: string): void;
  onThumbnailChange(id: string, file: File | null): void;
  onThumbnailRemove(id: string): void;
  onUpdate(id: string, patch: Partial<LinkItem>): void;
  onUrlChange(id: string, url: string): void;
}) {
  const embedAvailable = Boolean(
    link.embedAvailable || (link.embedHtml && link.embedProvider),
  );

  function closeAndSave(): void {
    if (link.type !== "image") onMetadataRefresh(link.id);
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
              onBlur={() => {
                if (link.type !== "image") onMetadataRefresh(link.id);
              }}
              onChange={(event) => {
                if (link.type === "image") {
                  onUpdate(link.id, { url: event.target.value });
                } else {
                  onUrlChange(link.id, event.target.value);
                }
              }}
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
                {(["auto", "link", "embed"] as const).map((mode) => (
                  <label
                    className={`link-edit-segment${(link.embedMode ?? "auto") === mode ? " is-selected" : ""}${mode === "embed" && !embedAvailable ? " is-disabled" : ""}`}
                    key={mode}
                  >
                    <input
                      checked={(link.embedMode ?? "auto") === mode}
                      disabled={mode === "embed" && !embedAvailable}
                      name={`link-display-mode-${link.id}`}
                      onChange={() => onEmbedModeChange(link.id, mode)}
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
          {link.type === "image" ? null : (
            <div className="link-edit-field">
              <span>Thumbnail</span>
              <div className="link-thumbnail-editor">
                <label
                  className="link-thumbnail-preview"
                  title="Upload thumbnail"
                >
                  <span className="sr-only">Upload thumbnail</span>
                  {linkThumbnailUrl ? (
                    <img alt="" src={linkThumbnailUrl} />
                  ) : (
                    <FaImage aria-hidden="true" size={18} />
                  )}
                  <input
                    accept="image/*"
                    onChange={(event) => {
                      onThumbnailChange(
                        link.id,
                        event.currentTarget.files?.[0] ?? null,
                      );
                      event.currentTarget.value = "";
                    }}
                    type="file"
                  />
                </label>
                {linkThumbnailUrl ? (
                  <button
                    aria-label="Remove thumbnail"
                    className="circle-icon-button danger"
                    onClick={() => onThumbnailRemove(link.id)}
                    title="Remove thumbnail"
                    type="button"
                  >
                    <FaTrash aria-hidden="true" size={16} />
                  </button>
                ) : null}
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
