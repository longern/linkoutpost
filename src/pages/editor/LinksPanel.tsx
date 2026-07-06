import { useState, type CSSProperties } from "react";
import {
  closestCenter,
  DndContext,
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
import { FaGripVertical, FaPlus, FaTrash } from "react-icons/fa6";
import type { LinkItem } from "../../profile";

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
  onRemove,
  onSave,
  onUpdate,
}: {
  active: boolean;
  link: LinkItem;
  onRemove(id: string): void;
  onSave(): void;
  onUpdate(id: string, patch: Partial<LinkItem>): void;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({ id: link.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? undefined
      : "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  };

  return (
    <div
      className={`link-row${active || isDragging ? " is-dragging" : ""}`}
      ref={setNodeRef}
      style={style}
    >
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
      <div className="link-row-fields">
        <input
          aria-label="Link label"
          placeholder="Link title"
          value={link.label}
          onChange={(event) => onUpdate(link.id, { label: event.target.value })}
          onBlur={onSave}
        />
        <input
          aria-label="Link URL"
          placeholder="https://example.com"
          value={link.url}
          onChange={(event) => onUpdate(link.id, { url: event.target.value })}
          onBlur={onSave}
        />
      </div>
      <button
        aria-label="Remove link"
        className="circle-icon-button danger"
        onClick={() => onRemove(link.id)}
        title="Remove link"
        type="button"
      >
        <FaTrash aria-hidden="true" size={18} />
      </button>
    </div>
  );
}

type LinksPanelProps = {
  links: LinkItem[];
  onAdd(): void;
  onCommitLinks(links: LinkItem[]): void;
  onPreviewLinksChange(links: LinkItem[] | null): void;
  onRemove(id: string): void;
  onSave(): void;
  onUpdate(id: string, patch: Partial<LinkItem>): void;
};

export function LinksPanel({
  links,
  onAdd,
  onCommitLinks,
  onPreviewLinksChange,
  onRemove,
  onSave,
  onUpdate,
}: LinksPanelProps) {
  const [activeDragLinkId, setActiveDragLinkId] = useState<string | null>(null);
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

  return (
    <>
      <button className="button-primary add-link-button" onClick={onAdd} type="button">
        <FaPlus aria-hidden="true" size={20} />
        Add
      </button>

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
                onSave={onSave}
                onRemove={onRemove}
                onUpdate={onUpdate}
              />
            ))}
          </section>
        </SortableContext>
      </DndContext>
    </>
  );
}
