import { useState } from "react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FaChevronDown, FaImage, FaPlus } from "react-icons/fa6";
import type { LinkItem } from "../../profile";
import { LinkRowOverlay, SortableLinkRow } from "./links/LinkRow";
import { moveLinksById } from "./links/linkSorting";
import { useAnimatedMenu } from "./useAnimatedMenu";
import { useTranslation } from "../../i18n";

const maxLinkItems = 50;
const maxMediaCards = 10;

type LinksPanelProps = {
  linkImageUrls?: Record<string, string | null>;
  linkThumbnailUrls?: Record<string, string | null>;
  links: LinkItem[];
  onAddImage(): void;
  onAddLink(): void;
  onCommitLinks(links: LinkItem[]): void;
  onImageChange(id: string, file: File | null): void;
  onEmbedModeChange(
    id: string,
    mode: NonNullable<LinkItem["embedMode"]>,
  ): void;
  onMetadataRefresh(id: string): void;
  onPreviewLinksChange(links: LinkItem[] | null): void;
  onRemove(id: string): void;
  onSaveLink(id: string): void;
  onToggleVisibility(id: string): void;
  onThumbnailChange(id: string, file: File | null): void;
  onThumbnailRemove(id: string): void;
  onUpdate(id: string, patch: Partial<LinkItem>): void;
  onUrlChange(id: string, url: string): void;
};

export function LinksPanel({
  linkImageUrls = {},
  linkThumbnailUrls = {},
  links,
  onAddImage,
  onAddLink,
  onCommitLinks,
  onImageChange,
  onEmbedModeChange,
  onMetadataRefresh,
  onPreviewLinksChange,
  onRemove,
  onSaveLink,
  onToggleVisibility,
  onThumbnailChange,
  onThumbnailRemove,
  onUpdate,
  onUrlChange,
}: LinksPanelProps) {
  const { t } = useTranslation();
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
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
    clearLinkDrag();
    if (!over) return;

    const finalLinks = moveLinksById(links, String(active.id), String(over.id));
    if (finalLinks !== links) onCommitLinks(finalLinks);
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
                linkThumbnailUrl={linkThumbnailUrls[activeDragLink.id]}
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
          {t("editor.forms.addLink")}
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
            {t("editor.forms.other")}
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
                    {t("editor.forms.mediaCard")}
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
          <section
            className="link-list"
            aria-label={t("editor.forms.links")}
          >
            {links.map((link) => (
              <SortableLinkRow
                active={activeDragLinkId === link.id}
                key={link.id}
                link={link}
                linkImageUrl={linkImageUrls[link.id]}
                linkThumbnailUrl={linkThumbnailUrls[link.id]}
                onEmbedModeChange={onEmbedModeChange}
                onImageChange={onImageChange}
                onMetadataRefresh={onMetadataRefresh}
                onRemove={onRemove}
                onSaveLink={onSaveLink}
                onToggleVisibility={onToggleVisibility}
                onThumbnailChange={onThumbnailChange}
                onThumbnailRemove={onThumbnailRemove}
                onUpdate={onUpdate}
                onUrlChange={onUrlChange}
              />
            ))}
          </section>
        </SortableContext>
        {dragOverlay}
      </DndContext>
    </>
  );
}
