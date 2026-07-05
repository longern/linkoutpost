import { FaTrash } from "react-icons/fa6";
import {
  fontOptions,
  type LinkProfile,
  type ProfileTheme,
} from "../../profile";

type DesignPanelProps = {
  onBackgroundChange(file: File | null): void;
  onProfileImageChange(file: File | null): void;
  onProfileImageRemove(): void;
  onSave(): void;
  onUpdateTheme(patch: Partial<ProfileTheme>): void;
  profile: LinkProfile;
};

export function DesignPanel({
  onBackgroundChange,
  onProfileImageChange,
  onProfileImageRemove,
  onSave,
  onUpdateTheme,
  profile,
}: DesignPanelProps) {
  return (
    <section className="design-panel" aria-label="Style form">
      <fieldset className="design-section">
        <legend>Background</legend>
        <div className="theme-grid">
          <label>
            Background image
            <input
              accept="image/*"
              onChange={(event) => {
                onBackgroundChange(event.currentTarget.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
              type="file"
            />
          </label>
          <label>
            Profile image (classic)
            <input
              accept="image/*,video/*"
              onChange={(event) => {
                onProfileImageChange(event.currentTarget.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
              type="file"
            />
          </label>
          {profile.theme.profileImageAssetId && (
            <div className="theme-file-action">
              <span>Profile image is set</span>
              <button
                aria-label="Remove profile image"
                className="circle-icon-button danger"
                onClick={onProfileImageRemove}
                title="Remove profile image"
                type="button"
              >
                <FaTrash aria-hidden="true" size={18} />
              </button>
            </div>
          )}
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
        </div>
      </fieldset>

      <fieldset className="design-section">
        <legend>Colors</legend>
        <div className="theme-grid">
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
        </div>
      </fieldset>

      <fieldset className="design-section">
        <legend>Typography</legend>
        <div className="theme-grid">
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
      </fieldset>
    </section>
  );
}
