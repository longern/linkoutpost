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
  FaChevronDown,
  FaGripVertical,
  FaImage,
  FaPlus,
  FaTrash,
} from "react-icons/fa6";
import type { LinkItem } from "../../profile";
import { useAnimatedMenu } from "./useAnimatedMenu";

const maxLinkItems = 50;
const maxMediaCards = 10;

function isVideoMediaUrl(url: string): boolean {
  return /^data:video\//i.test(url) || /\.(mp4|webm|ogv|ogg|mov)(?:[?#].*)?$/i.test(url);
}

function LinkRowFields({
  link,
  linkImageUrl,
  onImageChange,
  onSave,
  onUpdate,
  readOnly = false,
}: {
  link: LinkItem;
  linkImageUrl?: string | null;
  onImageChange?: (id: string, file: File | null) => void;
  onSave?: () => void;
  onUpdate?: (id: string, patch: Partial<LinkItem>) => void;
  readOnly?: boolean;
}) {
  const inputProps = readOnly
    ? { readOnly: true, tabIndex: -1 }
    : {};

  if (link.type === "image") {
    const mediaPreview = (
      <span className="image-card-upload-preview">
        {linkImageUrl && isVideoMediaUrl(linkImageUrl) ? (
          <video controls muted playsInline src={linkImageUrl} />
        ) : linkImageUrl ? (
          <img alt="" src={linkImageUrl} />
        ) : (
          <span className="media-upload-placeholder">
            <FaImage aria-hidden="true" size={18} />
          </span>
        )}
      </span>
    );

    return (
      <div className="link-row-fields image-card-fields">
        {readOnly ? (
          <span className={`image-card-upload${linkImageUrl ? " has-image" : ""}`}>
            {mediaPreview}
          </span>
        ) : (
          <label className={`image-card-upload${linkImageUrl ? " has-image" : ""}`}>
            {mediaPreview}
            <input
              accept="image/*,video/*"
              onChange={(event) => {
                onImageChange?.(link.id, event.currentTarget.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
              type="file"
            />
          </label>
        )}
        <input
          aria-label="Image card title"
          placeholder="Image title"
          value={link.label}
          onChange={(event) => onUpdate?.(link.id, { label: event.target.value })}
          onBlur={onSave}
          {...inputProps}
        />
        <input
          aria-label="Image card URL"
          placeholder="Optional link URL"
          value={link.url}
          onChange={(event) => onUpdate?.(link.id, { url: event.target.value })}
          onBlur={onSave}
          {...inputProps}
        />
      </div>
    );
  }

  return (
    <div className="link-row-fields">
      <input
        aria-label="Link label"
        placeholder="Link title"
        value={link.label}
        onChange={(event) => onUpdate?.(link.id, { label: event.target.value })}
        onBlur={onSave}
        {...inputProps}
      />
      <input
        aria-label="Link URL"
        placeholder="https://example.com"
        value={link.url}
        onChange={(event) => onUpdate?.(link.id, { url: event.target.value })}
        onBlur={onSave}
        {...inputProps}
      />
    </div>
  );
}

type LinkRowFrameProps = {
  children: ReactNode;
  className?: string;
  dragHandle: ReactNode;
  removeButton: ReactNode;
  style?: CSSProperties;
};

const LinkRowFrame = forwardRef<HTMLDivElement, LinkRowFrameProps>(function LinkRowFrame(
  {
    children,
    className = "",
    dragHandle,
    removeButton,
    style,
  },
  ref,
) {
  return (
    <div className={`link-row${className}`} ref={ref} style={style}>
      {dragHandle}
      {children}
      {removeButton}
    </div>
  );
});

function LinkRowOverlay({
  link,
  linkImageUrl,
}: {
  link: LinkItem;
  linkImageUrl?: string | null;
}) {
  return (
    <LinkRowFrame
      className=" link-row-overlay"
      dragHandle={
        <button
          aria-hidden="true"
          className="link-row-drag"
          tabIndex={-1}
          type="button"
        >
          <FaGripVertical aria-hidden="true" size={18} />
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
    >
      <LinkRowFields link={link} linkImageUrl={linkImageUrl} readOnly />
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
  onSave,
  onUpdate,
}: {
  active: boolean;
  link: LinkItem;
  linkImageUrl?: string | null;
  onImageChange(id: string, file: File | null): void;
  onRemove(id: string): void;
  onSave(): void;
  onUpdate(id: string, patch: Partial<LinkItem>): void;
}) {
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
      className={active || isDragging ? " is-dragging" : ""}
      dragHandle={
        <button
          aria-label={`Drag ${link.label}`}
          className="link-row-drag"
          title="Drag to reorder"
          type="button"
          {...attributes}
          {...listeners}
        >
          <FaGripVertical aria-hidden="true" size={18} />
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
      style={style}
    >
      <LinkRowFields
        link={link}
        linkImageUrl={linkImageUrl}
        onImageChange={onImageChange}
        onSave={onSave}
        onUpdate={onUpdate}
      />
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
  onSave(): void;
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
  onSave,
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
    ? links.find((link) => link.id === activeDragLinkId) ?? null
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
                    Image card
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
                onSave={onSave}
                onRemove={onRemove}
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
