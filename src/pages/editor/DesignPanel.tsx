import { FaTrash } from "react-icons/fa6";
import {
  fontOptions,
  type LinkProfile,
  type ProfileTheme,
} from "../../profile";

type DesignPanelProps = {
  onBackgroundChange(file: File | null): void;
  onBannerImageChange(file: File | null): void;
  onBannerImageRemove(): void;
  onSave(): void;
  onUpdateTheme(patch: Partial<ProfileTheme>): void;
  profile: LinkProfile;
};

export function DesignPanel({
  onBackgroundChange,
  onBannerImageChange,
  onBannerImageRemove,
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
            Banner image (classic)
            <input
              accept="image/*,video/*"
              onChange={(event) => {
                onBannerImageChange(event.currentTarget.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
              type="file"
            />
          </label>
          {profile.theme.bannerImageAssetId && (
            <div className="theme-file-action">
              <span>Banner image is set</span>
              <button
                aria-label="Remove banner image"
                className="circle-icon-button danger"
                onClick={onBannerImageRemove}
                title="Remove banner image"
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
