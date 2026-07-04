import { FaPlus, FaTrash } from "react-icons/fa6";
import type { LinkProfile, ProfileTheme } from "../../profile";

type LayoutPanelProps = {
  onSave(): void;
  onUpdateTheme(patch: Partial<ProfileTheme>): void;
  profile: LinkProfile;
};

export function LayoutPanel({
  onSave,
  onUpdateTheme,
  profile,
}: LayoutPanelProps) {
  function updateCardField(
    id: string,
    patch: Partial<ProfileTheme["cardFields"][number]>,
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

          <div className="card-field-editor-list">
            {profile.theme.cardFields.map((field) => (
              <div className="card-field-editor-row" key={field.id}>
                <input
                  aria-label="Field name"
                  placeholder="Field name"
                  value={field.label}
                  onChange={(event) =>
                    updateCardField(field.id, { label: event.target.value })
                  }
                  onBlur={onSave}
                />
                <input
                  aria-label="Field value"
                  placeholder="Value"
                  value={field.value}
                  onChange={(event) =>
                    updateCardField(field.id, { value: event.target.value })
                  }
                  onBlur={onSave}
                />
                <button
                  aria-label="Remove card field"
                  className="circle-icon-button danger"
                  onClick={() => removeCardField(field.id)}
                  title="Remove card field"
                  type="button"
                >
                  <FaTrash aria-hidden="true" size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
