import {
  fontOptions,
  type LinkProfile,
  type ProfileTheme,
} from "../../profile";

type DesignPanelProps = {
  onSave(): void;
  onUpdateTheme(patch: Partial<ProfileTheme>): void;
  profile: LinkProfile;
};

export function DesignPanel({
  onSave,
  onUpdateTheme,
  profile,
}: DesignPanelProps) {
  return (
    <section className="design-panel" aria-label="Style form">
      <div className="theme-grid">
        <label>
          Background
          <input
            type="color"
            value={profile.theme.backgroundColor}
            onChange={(event) =>
              onUpdateTheme({ backgroundColor: event.target.value })
            }
            onBlur={onSave}
          />
        </label>
        <label>
          Text
          <input
            type="color"
            value={profile.theme.textColor}
            onChange={(event) => onUpdateTheme({ textColor: event.target.value })}
            onBlur={onSave}
          />
        </label>
        <label>
          Accent
          <input
            type="color"
            value={profile.theme.accentColor}
            onChange={(event) =>
              onUpdateTheme({ accentColor: event.target.value })
            }
            onBlur={onSave}
          />
        </label>
        <label>
          Button
          <input
            type="color"
            value={profile.theme.buttonBackgroundColor}
            onChange={(event) =>
              onUpdateTheme({ buttonBackgroundColor: event.target.value })
            }
            onBlur={onSave}
          />
        </label>
        <label>
          Button text
          <input
            type="color"
            value={profile.theme.buttonTextColor}
            onChange={(event) =>
              onUpdateTheme({ buttonTextColor: event.target.value })
            }
            onBlur={onSave}
          />
        </label>
        <label>
          Font
          <select
            value={profile.theme.fontFamily}
            onChange={(event) => onUpdateTheme({ fontFamily: event.target.value })}
          >
            {fontOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
