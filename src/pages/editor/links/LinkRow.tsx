import {
  forwardRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FaArrowUpRightFromSquare,
  FaEye,
  FaEyeSlash,
  FaPen,
  FaTrash,
} from "react-icons/fa6";
import { RiDraggable } from "react-icons/ri";
import type { LinkItem } from "../../../profile";
import { useAnimatedMenu } from "../useAnimatedMenu";
import { LinkEditDialog } from "./LinkEditDialog";
import { getLinkDisplayTitle, getLinkDisplayUrl } from "./linkDisplay";
import { MediaCardPreview } from "./MediaCardPreview";

function MediaCardSummary({
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
  const content = (
    <>
      <span className="image-card-summary-preview">
        <MediaCardPreview mediaUrl={linkImageUrl} variant="thumbnail" />
      </span>
      <span className="image-card-summary-copy">
        <span className="link-row-primary">{displayTitle}</span>
        <span className="link-row-secondary">{getLinkDisplayUrl(link)}</span>
      </span>
    </>
  );

  return (
    <div className="link-row-summary-text-wrap image-card-summary-wrap">
      {readOnly ? (
        <span className="link-row-summary-text image-card-summary">{content}</span>
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
  linkThumbnailUrl,
  onEdit,
  readOnly = false,
}: {
  link: LinkItem;
  linkThumbnailUrl?: string | null;
  onEdit?: () => void;
  readOnly?: boolean;
}) {
  const displayTitle = getLinkDisplayTitle(link);
  const content = (
    <>
      {linkThumbnailUrl ? (
        <span className="link-summary-thumbnail">
          <img alt="" src={linkThumbnailUrl} />
        </span>
      ) : null}
      <span className="link-summary-copy">
        <span className="link-row-primary">{displayTitle}</span>
        <span className="link-row-secondary">{getLinkDisplayUrl(link)}</span>
      </span>
    </>
  );

  return (
    <div className="link-row-summary-text-wrap">
      {readOnly ? (
        <span
          className={`link-row-summary-text${linkThumbnailUrl ? " has-thumbnail" : ""}`}
        >
          {content}
        </span>
      ) : (
        <button
          aria-label={`Edit ${displayTitle}`}
          className={`link-row-summary-text${linkThumbnailUrl ? " has-thumbnail" : ""}`}
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

  const label = `Open ${getLinkDisplayTitle(link)} in a new window`;
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

export function LinkRowOverlay({
  link,
  linkImageUrl,
  linkThumbnailUrl,
}: {
  link: LinkItem;
  linkImageUrl?: string | null;
  linkThumbnailUrl?: string | null;
}) {
  return (
    <LinkRowFrame
      className={` link-row-overlay${link.hidden ? " is-hidden" : ""}`}
      dragHandle={
        <button aria-hidden="true" className="link-row-drag" tabIndex={-1} type="button">
          <RiDraggable aria-hidden="true" size={18} />
        </button>
      }
      removeButton={
        <button aria-hidden="true" className="circle-icon-button danger" tabIndex={-1} type="button">
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
        <MediaCardSummary link={link} linkImageUrl={linkImageUrl} readOnly />
      ) : (
        <LinkSummary link={link} linkThumbnailUrl={linkThumbnailUrl} readOnly />
      )}
    </LinkRowFrame>
  );
}

export function SortableLinkRow({
  active,
  link,
  linkImageUrl,
  linkThumbnailUrl,
  onEmbedModeChange,
  onImageChange,
  onMetadataRefresh,
  onRemove,
  onSaveLink,
  onToggleVisibility,
  onThumbnailChange,
  onThumbnailRemove,
  onUpdate,
  onUrlChange,
}: {
  active: boolean;
  link: LinkItem;
  linkImageUrl?: string | null;
  linkThumbnailUrl?: string | null;
  onEmbedModeChange(
    id: string,
    mode: NonNullable<LinkItem["embedMode"]>,
  ): void;
  onImageChange(id: string, file: File | null): void;
  onMetadataRefresh(id: string): void;
  onRemove(id: string): void;
  onSaveLink(id: string): void;
  onToggleVisibility(id: string): void;
  onThumbnailChange(id: string, file: File | null): void;
  onThumbnailRemove(id: string): void;
  onUpdate(id: string, patch: Partial<LinkItem>): void;
  onUrlChange(id: string, url: string): void;
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
  const editDialog = editAnimation.mounted ? (
    <LinkEditDialog
      link={link}
      linkImageUrl={linkImageUrl}
      linkThumbnailUrl={linkThumbnailUrl}
      visible={editAnimation.visible}
      onEmbedModeChange={onEmbedModeChange}
      onImageChange={onImageChange}
      onMetadataRefresh={onMetadataRefresh}
      onRequestClose={() => setEditing(false)}
      onSaveLink={onSaveLink}
      onThumbnailChange={onThumbnailChange}
      onThumbnailRemove={onThumbnailRemove}
      onUpdate={onUpdate}
      onUrlChange={onUrlChange}
    />
  ) : null;

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
          <LinkVisibilityButton link={link} onToggle={() => onToggleVisibility(link.id)} />
          <LinkOpenButton link={link} />
          <LinkEditButton link={link} onEdit={() => setEditing(true)} />
        </>
      }
      style={style}
    >
      {link.type === "image" ? (
        <MediaCardSummary link={link} linkImageUrl={linkImageUrl} onEdit={() => setEditing(true)} />
      ) : (
        <LinkSummary
          link={link}
          linkThumbnailUrl={linkThumbnailUrl}
          onEdit={() => setEditing(true)}
        />
      )}
      {editDialog}
    </LinkRowFrame>
  );
}
