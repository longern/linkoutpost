import {
  forwardRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FaArrowUpRightFromSquare,
  FaChevronDown,
  FaEye,
  FaEyeSlash,
  FaImage,
  FaPen,
  FaPlus,
  FaTrash,
  FaXmark,
} from "react-icons/fa6";
import { RiDraggable } from "react-icons/ri";
import type { LinkItem } from "../../profile";
import { useAnimatedMenu } from "./useAnimatedMenu";

const maxLinkItems = 50;
const maxMediaCards = 10;

function getLinkDisplayTitle(link: LinkItem): string {
  return link.label.trim() || "Untitled link";
}

function getLinkDisplayUrl(link: LinkItem): string {
  return link.url.trim() || "No URL";
}

function isVideoMediaUrl(url: string): boolean {
  return (
    /^data:video\//i.test(url) ||
    /\.(mp4|webm|ogv|ogg|mov)(?:[?#].*)?$/i.test(url)
  );
}

function ImageCardPreview({
  linkImageUrl,
  variant = "upload",
}: {
  linkImageUrl?: string | null;
  variant?: "thumbnail" | "upload";
}) {
  return (
    <span className={`image-card-preview is-${variant}`}>
      {linkImageUrl && isVideoMediaUrl(linkImageUrl) ? (
        <video
          autoPlay={variant === "thumbnail"}
          controls={variant === "upload"}
          loop={variant === "thumbnail"}
          muted
          playsInline
          src={linkImageUrl}
        />
      ) : linkImageUrl ? (
        <img alt="" src={linkImageUrl} />
      ) : (
        <span className="media-upload-placeholder">
          <FaImage aria-hidden="true" size={18} />
        </span>
      )}
    </span>
  );
}

function ImageCardSummary({
  link,
  linkImageUrl,
  onEdit,
  readOnly = false,
}: {
  link: LinkItem;
  linkImageUrl?: string | null;
  onEdit?: () => void;
  readOnly?: boolean;
}) {
  const displayTitle = link.label.trim() || "Untitled media";
  const displayUrl = getLinkDisplayUrl(link);
  const content = (
    <>
      <span className="image-card-summary-preview">
        <ImageCardPreview linkImageUrl={linkImageUrl} variant="thumbnail" />
      </span>
      <span className="image-card-summary-copy">
        <span className="link-row-primary">{displayTitle}</span>
        <span className="link-row-secondary">{displayUrl}</span>
      </span>
    </>
  );

  return (
    <div className="link-row-summary-text-wrap image-card-summary-wrap">
      {readOnly ? (
        <span className="link-row-summary-text image-card-summary">
          {content}
        </span>
      ) : (
        <button
          aria-label={`Edit ${displayTitle}`}
          className="link-row-summary-text image-card-summary"
          onClick={onEdit}
          type="button"
        >
          {content}
        </button>
      )}
    </div>
  );
}

function LinkSummary({
  link,
  onEdit,
  readOnly = false,
}: {
  link: LinkItem;
  onEdit?: () => void;
  readOnly?: boolean;
}) {
  const displayTitle = getLinkDisplayTitle(link);
  const displayUrl = getLinkDisplayUrl(link);
  const content = (
    <>
      <span className="link-row-primary">{displayTitle}</span>
      <span className="link-row-secondary">{displayUrl}</span>
    </>
  );

  return (
    <div className="link-row-summary-text-wrap">
      {readOnly ? (
        <span className="link-row-summary-text">{content}</span>
      ) : (
        <button
          aria-label={`Edit ${displayTitle}`}
          className="link-row-summary-text"
          onClick={onEdit}
          type="button"
        >
          {content}
        </button>
      )}
    </div>
  );
}

function LinkEditButton({
  link,
  onEdit,
  readOnly = false,
}: {
  link: LinkItem;
  onEdit?: () => void;
  readOnly?: boolean;
}) {
  const displayTitle = getLinkDisplayTitle(link);

  if (readOnly) {
    return (
      <span className="circle-icon-button link-edit-button" aria-hidden="true">
        <FaPen aria-hidden="true" size={15} />
      </span>
    );
  }

  return (
    <button
      aria-label={`Edit ${displayTitle}`}
      className="circle-icon-button link-edit-button"
      onClick={onEdit}
      title="Edit link"
      type="button"
    >
      <FaPen aria-hidden="true" size={15} />
    </button>
  );
}

function LinkOpenButton({
  link,
  readOnly = false,
}: {
  link: LinkItem;
  readOnly?: boolean;
}) {
  const href = link.url.trim();
  if (!href) return null;

  const displayTitle = getLinkDisplayTitle(link);
  const label = `Open ${displayTitle} in a new window`;

  if (readOnly) {
    return (
      <span className="circle-icon-button link-open-button" aria-hidden="true">
        <FaArrowUpRightFromSquare aria-hidden="true" size={15} />
      </span>
    );
  }

  return (
    <a
      aria-label={label}
      className="circle-icon-button link-open-button"
      href={href}
      rel="noreferrer"
      target="_blank"
      title="Open link"
    >
      <FaArrowUpRightFromSquare aria-hidden="true" size={15} />
    </a>
  );
}

function LinkVisibilityButton({
  link,
  onToggle,
  readOnly = false,
}: {
  link: LinkItem;
  onToggle?: () => void;
  readOnly?: boolean;
}) {
  const displayTitle = getLinkDisplayTitle(link);
  const hidden = Boolean(link.hidden);
  const Icon = hidden ? FaEyeSlash : FaEye;
  const label = hidden ? `Show ${displayTitle}` : `Hide ${displayTitle}`;

  if (readOnly) {
    return (
      <span
        aria-hidden="true"
        className={`circle-icon-button link-visibility-button${hidden ? " is-hidden" : ""}`}
      >
        <Icon aria-hidden="true" size={16} />
      </span>
    );
  }

  return (
    <button
      aria-label={label}
      aria-pressed={hidden}
      className={`circle-icon-button link-visibility-button${hidden ? " is-hidden" : ""}`}
      onClick={onToggle}
      title={hidden ? "Show link" : "Hide link"}
      type="button"
    >
      <Icon aria-hidden="true" size={16} />
    </button>
  );
}

function LinkEditDialog({
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
                <ImageCardPreview linkImageUrl={linkImageUrl} />
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

type LinkRowFrameProps = {
  children: ReactNode;
  className?: string;
  dragHandle: ReactNode;
  linkActions?: ReactNode;
  removeButton: ReactNode;
  style?: CSSProperties;
};

const LinkRowFrame = forwardRef<HTMLDivElement, LinkRowFrameProps>(
  function LinkRowFrame(
    {
      children,
      className = "",
      dragHandle,
      linkActions = null,
      removeButton,
      style,
    },
    ref,
  ) {
    return (
      <div
        className={`link-row${linkActions ? " has-link-actions" : ""}${className}`}
        ref={ref}
        style={style}
      >
        {dragHandle}
        {children}
        {linkActions ? (
          <div className="link-row-actions">
            {linkActions}
            {removeButton}
          </div>
        ) : (
          removeButton
        )}
      </div>
    );
  },
);

function LinkRowOverlay({
  link,
  linkImageUrl,
}: {
  link: LinkItem;
  linkImageUrl?: string | null;
}) {
  return (
    <LinkRowFrame
      className={` link-row-overlay${link.hidden ? " is-hidden" : ""}`}
      dragHandle={
        <button
          aria-hidden="true"
          className="link-row-drag"
          tabIndex={-1}
          type="button"
        >
          <RiDraggable aria-hidden="true" size={18} />
        </button>
      }
      removeButton={
        <button
          aria-hidden="true"
          className="circle-icon-button danger"
          tabIndex={-1}
          type="button"
        >
          <FaTrash aria-hidden="true" size={18} />
        </button>
      }
      linkActions={
        <>
          <LinkVisibilityButton link={link} readOnly />
          <LinkOpenButton link={link} readOnly />
          <LinkEditButton link={link} readOnly />
        </>
      }
    >
      {link.type === "image" ? (
        <ImageCardSummary link={link} linkImageUrl={linkImageUrl} readOnly />
      ) : (
        <LinkSummary link={link} readOnly />
      )}
    </LinkRowFrame>
  );
}

function moveLinksById(
  links: LinkItem[],
  activeId: string,
  overId: string,
): LinkItem[] {
  const activeIndex = links.findIndex((link) => link.id === activeId);
  const overIndex = links.findIndex((link) => link.id === overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return links;
  }

  return arrayMove(links, activeIndex, overIndex);
}

function SortableLinkRow({
  active,
  link,
  linkImageUrl,
  onImageChange,
  onRemove,
  onSaveLink,
  onToggleVisibility,
  onUpdate,
}: {
  active: boolean;
  link: LinkItem;
  linkImageUrl?: string | null;
  onImageChange(id: string, file: File | null): void;
  onRemove(id: string): void;
  onSaveLink(id: string): void;
  onToggleVisibility(id: string): void;
  onUpdate(id: string, patch: Partial<LinkItem>): void;
}) {
  const [editing, setEditing] = useState(false);
  const editAnimation = useAnimatedMenu(editing, 220);
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({ id: link.id });
  const style: CSSProperties = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition: isDragging
      ? undefined
      : "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  };

  return (
    <LinkRowFrame
      className={`${link.hidden ? " is-hidden" : ""}${active || isDragging ? " is-dragging" : ""}`}
      dragHandle={
        <button
          aria-label={`Drag ${link.label}`}
          className="link-row-drag"
          title="Drag to reorder"
          type="button"
          {...attributes}
          {...listeners}
        >
          <RiDraggable aria-hidden="true" size={18} />
        </button>
      }
      ref={setNodeRef}
      removeButton={
        <button
          aria-label="Remove link"
          className="circle-icon-button danger"
          onClick={() => onRemove(link.id)}
          title="Remove link"
          type="button"
        >
          <FaTrash aria-hidden="true" size={18} />
        </button>
      }
      linkActions={
        <>
          <LinkVisibilityButton
            link={link}
            onToggle={() => onToggleVisibility(link.id)}
          />
          <LinkOpenButton link={link} />
          <LinkEditButton link={link} onEdit={() => setEditing(true)} />
        </>
      }
      style={style}
    >
      {link.type === "image" ? (
        <>
          <ImageCardSummary
            link={link}
            linkImageUrl={linkImageUrl}
            onEdit={() => setEditing(true)}
          />
          {editAnimation.mounted ? (
            <LinkEditDialog
              link={link}
              linkImageUrl={linkImageUrl}
              visible={editAnimation.visible}
              onImageChange={onImageChange}
              onRequestClose={() => setEditing(false)}
              onSaveLink={onSaveLink}
              onUpdate={onUpdate}
            />
          ) : null}
        </>
      ) : (
        <>
          <LinkSummary link={link} onEdit={() => setEditing(true)} />
          {editAnimation.mounted ? (
            <LinkEditDialog
              link={link}
              linkImageUrl={linkImageUrl}
              visible={editAnimation.visible}
              onImageChange={onImageChange}
              onRequestClose={() => setEditing(false)}
              onSaveLink={onSaveLink}
              onUpdate={onUpdate}
            />
          ) : null}
        </>
      )}
    </LinkRowFrame>
  );
}

type LinksPanelProps = {
  linkImageUrls?: Record<string, string | null>;
  links: LinkItem[];
  onAddImage(): void;
  onAddLink(): void;
  onCommitLinks(links: LinkItem[]): void;
  onImageChange(id: string, file: File | null): void;
  onPreviewLinksChange(links: LinkItem[] | null): void;
  onRemove(id: string): void;
  onSaveLink(id: string): void;
  onToggleVisibility(id: string): void;
  onUpdate(id: string, patch: Partial<LinkItem>): void;
};

export function LinksPanel({
  linkImageUrls = {},
  links,
  onAddImage,
  onAddLink,
  onCommitLinks,
  onImageChange,
  onPreviewLinksChange,
  onRemove,
  onSaveLink,
  onToggleVisibility,
  onUpdate,
}: LinksPanelProps) {
  const [activeDragLinkId, setActiveDragLinkId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuAnimation = useAnimatedMenu(addMenuOpen);
  const linkLimitReached = links.length >= maxLinkItems;
  const mediaCardLimitReached =
    links.filter((link) => link.type === "image").length >= maxMediaCards;
  const addMediaDisabled = linkLimitReached || mediaCardLimitReached;
  const activeDragLink = activeDragLinkId
    ? (links.find((link) => link.id === activeDragLinkId) ?? null)
    : null;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function clearLinkDrag(): void {
    setActiveDragLinkId(null);
    onPreviewLinksChange(null);
  }

  function onLinkDragStart(event: DragStartEvent): void {
    setActiveDragLinkId(String(event.active.id));
  }

  function onLinkDragOver(event: DragOverEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      onPreviewLinksChange(null);
      return;
    }

    const nextLinks = moveLinksById(links, String(active.id), String(over.id));
    onPreviewLinksChange(nextLinks === links ? null : nextLinks);
  }

  function onLinkDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    const hasValidDrop = Boolean(event.over);

    clearLinkDrag();

    if (!hasValidDrop || !over) return;

    const finalLinks = moveLinksById(links, String(active.id), String(over.id));
    if (finalLinks === links) return;

    onCommitLinks(finalLinks);
  }

  const dragOverlay =
    typeof document === "undefined"
      ? null
      : createPortal(
          <DragOverlay>
            {activeDragLink ? (
              <LinkRowOverlay
                link={activeDragLink}
                linkImageUrl={linkImageUrls[activeDragLink.id]}
              />
            ) : null}
          </DragOverlay>,
          document.body,
        );

  return (
    <>
      <div className="add-content-actions">
        <button
          className="button-primary add-link-button"
          disabled={linkLimitReached}
          onClick={() => {
            setAddMenuOpen(false);
            onAddLink();
          }}
          type="button"
        >
          <FaPlus aria-hidden="true" size={18} />
          Add link
        </button>
        <div className="add-content-menu-wrap">
          <button
            aria-expanded={addMenuOpen}
            aria-haspopup="menu"
            className="button-secondary add-other-button"
            disabled={addMediaDisabled}
            onClick={() => setAddMenuOpen((open) => !open)}
            type="button"
          >
            Other
            <FaChevronDown aria-hidden="true" size={14} />
          </button>
          {addMenuAnimation.mounted && (
            <>
              <button
                aria-hidden="true"
                className="add-content-menu-backdrop"
                onClick={() => setAddMenuOpen(false)}
                tabIndex={-1}
                type="button"
              />
              <ul
                className={`add-content-menu animated-menu${addMenuAnimation.visible ? " is-open" : " is-closing"}`}
                role="menu"
              >
                <li role="none">
                  <button
                    className="account-menu-item"
                    disabled={addMediaDisabled}
                    onClick={() => {
                      setAddMenuOpen(false);
                      onAddImage();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <FaImage aria-hidden="true" size={15} />
                    Media card
                  </button>
                </li>
              </ul>
            </>
          )}
        </div>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragCancel={clearLinkDrag}
        onDragEnd={onLinkDragEnd}
        onDragOver={onLinkDragOver}
        onDragStart={onLinkDragStart}
        sensors={sensors}
      >
        <SortableContext
          items={links.map((link) => link.id)}
          strategy={verticalListSortingStrategy}
        >
          <section className="link-list" aria-label="Links">
            {links.map((link) => (
              <SortableLinkRow
                active={activeDragLinkId === link.id}
                key={link.id}
                link={link}
                linkImageUrl={linkImageUrls[link.id]}
                onImageChange={onImageChange}
                onSaveLink={onSaveLink}
                onRemove={onRemove}
                onToggleVisibility={onToggleVisibility}
                onUpdate={onUpdate}
              />
            ))}
          </section>
        </SortableContext>
        {dragOverlay}
      </DndContext>
    </>
  );
}
