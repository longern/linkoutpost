import { useState, type CSSProperties } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import type { LinkProfile, ProfileTheme } from "../../profile";

type CardField = ProfileTheme["cardFields"][number];

function moveCardFieldsById(
  fields: CardField[],
  activeId: string,
  overId: string,
): CardField[] {
  const activeIndex = fields.findIndex((field) => field.id === activeId);
  const overIndex = fields.findIndex((field) => field.id === overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return fields;
  }

  return arrayMove(fields, activeIndex, overIndex);
}

function SortableCardFieldRow({
  active,
  field,
  onRemove,
  onSave,
  onUpdate,
}: {
  active: boolean;
  field: CardField;
  onRemove(id: string): void;
  onSave(): void;
  onUpdate(id: string, patch: Partial<CardField>): void;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({ id: field.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? undefined
      : "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  };

  return (
    <div
      className={`card-field-editor-row${active || isDragging ? " is-dragging" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <button
        aria-label={`Drag ${field.label || "card field"}`}
        className="link-row-drag"
        title="Drag to reorder"
        type="button"
        {...attributes}
        {...listeners}
      >
        <FaGripVertical aria-hidden="true" size={18} />
      </button>
      <div className="card-field-editor-inputs">
        <input
          aria-label="Field name"
          placeholder="Field name"
          value={field.label}
          onChange={(event) =>
            onUpdate(field.id, { label: event.target.value })
          }
          onBlur={onSave}
        />
        <input
          aria-label="Field value"
          placeholder="Value"
          value={field.value}
          onChange={(event) =>
            onUpdate(field.id, { value: event.target.value })
          }
          onBlur={onSave}
        />
      </div>
      <button
        aria-label="Remove card field"
        className="circle-icon-button danger"
        onClick={() => onRemove(field.id)}
        title="Remove card field"
        type="button"
      >
        <FaTrash aria-hidden="true" size={18} />
      </button>
    </div>
  );
}

type LayoutPanelProps = {
  onCommitTheme(patch: Partial<ProfileTheme>): void;
  onSave(): void;
  onUpdateTheme(patch: Partial<ProfileTheme>): void;
  profile: LinkProfile;
};

export function LayoutPanel({
  onCommitTheme,
  onSave,
  onUpdateTheme,
  profile,
}: LayoutPanelProps) {
  const [activeDragFieldId, setActiveDragFieldId] = useState<string | null>(null);
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

  function updateCardField(
    id: string,
    patch: Partial<CardField>,
  ): void {
    onUpdateTheme({
      cardFields: profile.theme.cardFields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    });
  }

  function addCardField(): void {
    onUpdateTheme({
      cardFields: [
        ...profile.theme.cardFields,
        { id: crypto.randomUUID(), label: "Field", value: "" },
      ],
    });
  }

  function removeCardField(id: string): void {
    onUpdateTheme({
      cardFields: profile.theme.cardFields.filter((field) => field.id !== id),
    });
  }

  function clearCardFieldDrag(): void {
    setActiveDragFieldId(null);
  }

  function onCardFieldDragStart(event: DragStartEvent): void {
    setActiveDragFieldId(String(event.active.id));
  }

  function onCardFieldDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    clearCardFieldDrag();

    if (!over) return;

    const finalFields = moveCardFieldsById(
      profile.theme.cardFields,
      String(active.id),
      String(over.id),
    );
    if (finalFields === profile.theme.cardFields) return;

    onCommitTheme({ cardFields: finalFields });
  }

  return (
    <section className="layout-panel" aria-label="Layout form">
      <label>
        Layout
        <select
          value={profile.theme.layout}
          onChange={(event) =>
            onUpdateTheme({ layout: event.target.value as ProfileTheme["layout"] })
          }
          onBlur={onSave}
        >
          <option value="classic">Classic links</option>
          <option value="card">Structured card</option>
        </select>
      </label>

      {profile.theme.layout === "card" && (
        <section className="card-layout-editor" aria-label="Card layout options">
          <div className="card-field-editor-header">
            <strong>Card fields</strong>
            <button
              aria-label="Add card field"
              className="circle-icon-button"
              onClick={addCardField}
              title="Add card field"
              type="button"
            >
              <FaPlus aria-hidden="true" size={18} />
            </button>
          </div>

          <DndContext
            collisionDetection={closestCenter}
            onDragCancel={clearCardFieldDrag}
            onDragEnd={onCardFieldDragEnd}
            onDragStart={onCardFieldDragStart}
            sensors={sensors}
          >
            <SortableContext
              items={profile.theme.cardFields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="card-field-editor-list">
                {profile.theme.cardFields.map((field) => (
                  <SortableCardFieldRow
                    active={activeDragFieldId === field.id}
                    field={field}
                    key={field.id}
                    onSave={onSave}
                    onRemove={removeCardField}
                    onUpdate={updateCardField}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}
    </section>
  );
}
