import { FaFilm, FaImage, FaTrash } from "react-icons/fa6";
import {
  fontOptions,
  type LinkProfile,
  type ProfileTheme,
} from "../../profile";
import { getProfileLayoutDefinition } from "../../features/profile/layouts/registry";

function isVideoUrl(url: string): boolean {
  return /^data:video\//i.test(url) || /\.(mp4|webm|ogv|ogg|mov)(?:[?#].*)?$/i.test(url);
}

type DesignPanelProps = {
  backgroundUrl: string | null;
  bannerImageUrl: string | null;
  onBackgroundChange(file: File | null): void;
  onBackgroundRemove(): void;
  onBannerImageChange(file: File | null): void;
  onBannerImageRemove(): void;
  onSave(): void;
  onUpdateTheme(patch: Partial<ProfileTheme>): void;
  profile: LinkProfile;
};

function ColorField({
  id,
  label,
  onChange,
  onSave,
  value,
}: {
  id: string;
  label: string;
  onChange(value: string): void;
  onSave(): void;
  value: string;
}) {
  return (
    <div className="design-field">
      <label className="design-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="design-color-control">
        <input
          aria-label={`${label} color`}
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onSave}
        />
        <output className="design-color-code" htmlFor={id}>
          {value.toUpperCase()}
        </output>
      </div>
    </div>
  );
}

export function DesignPanel({
  backgroundUrl,
  bannerImageUrl,
  onBackgroundChange,
  onBackgroundRemove,
  onBannerImageChange,
  onBannerImageRemove,
  onSave,
  onUpdateTheme,
  profile,
}: DesignPanelProps) {
  const { designCapabilities } = getProfileLayoutDefinition(
    profile.theme.layout,
  );

  return (
    <section className="design-panel" aria-label="Style form">
      <section className="design-section" aria-labelledby="design-background-title">
        <h2 id="design-background-title">Background</h2>
        <div className="design-section-content">
          {designCapabilities.backgroundImage ? (
            <div className="design-field">
              <div className="design-field-label">Background image</div>
              <div
                className={`media-upload-row${backgroundUrl ? " has-media" : ""}`}
              >
                <label className="media-upload-field">
                  <span className="media-upload-preview">
                    {backgroundUrl ? (
                      <img alt="" src={backgroundUrl} />
                    ) : (
                      <span className="media-upload-placeholder">
                        <FaImage aria-hidden="true" size={20} />
                      </span>
                    )}
                  </span>
                  <input
                    accept="image/*"
                    onChange={(event) => {
                      onBackgroundChange(event.currentTarget.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                    type="file"
                  />
                </label>
                <button
                  aria-label="Remove background image"
                  className="circle-icon-button danger"
                  disabled={!profile.theme.backgroundAssetId}
                  onClick={onBackgroundRemove}
                  title="Remove background image"
                  type="button"
                >
                  <FaTrash aria-hidden="true" size={18} />
                </button>
              </div>
            </div>
          ) : null}
          <ColorField
            id="design-background-color"
            label="Background color"
            onChange={(backgroundColor) => onUpdateTheme({ backgroundColor })}
            onSave={onSave}
            value={profile.theme.backgroundColor}
          />
        </div>
      </section>

      {designCapabilities.bannerMedia ? (
        <section className="design-section" aria-labelledby="design-banner-title">
          <h2 id="design-banner-title">Banner</h2>
          <div className="design-section-content">
            <div className="design-field">
              <div className="design-field-label">Banner image</div>
              <div
                className={`media-upload-row${bannerImageUrl ? " has-media" : ""}`}
              >
                <label className="media-upload-field">
                  <span className="media-upload-preview">
                    {bannerImageUrl && isVideoUrl(bannerImageUrl) ? (
                      <video muted playsInline src={bannerImageUrl} />
                    ) : bannerImageUrl ? (
                      <img alt="" src={bannerImageUrl} />
                    ) : (
                      <span className="media-upload-placeholder">
                        <FaFilm aria-hidden="true" size={20} />
                      </span>
                    )}
                  </span>
                  <input
                    accept="image/*,video/*"
                    onChange={(event) => {
                      onBannerImageChange(event.currentTarget.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                    type="file"
                  />
                </label>
                <button
                  aria-label="Remove banner image"
                  className="circle-icon-button danger"
                  disabled={!profile.theme.bannerImageAssetId}
                  onClick={onBannerImageRemove}
                  title="Remove banner image"
                  type="button"
                >
                  <FaTrash aria-hidden="true" size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="design-section" aria-labelledby="design-colors-title">
        <h2 id="design-colors-title">Colors</h2>
        <div className="design-section-content">
          <ColorField
            id="design-text-color"
            label="Text"
            onChange={(textColor) => onUpdateTheme({ textColor })}
            onSave={onSave}
            value={profile.theme.textColor}
          />
          <ColorField
            id="design-accent-color"
            label="Accent"
            onChange={(accentColor) => onUpdateTheme({ accentColor })}
            onSave={onSave}
            value={profile.theme.accentColor}
          />
          <ColorField
            id="design-button-color"
            label="Button"
            onChange={(buttonBackgroundColor) =>
              onUpdateTheme({ buttonBackgroundColor })
            }
            onSave={onSave}
            value={profile.theme.buttonBackgroundColor}
          />
          <ColorField
            id="design-button-text-color"
            label="Button text"
            onChange={(buttonTextColor) => onUpdateTheme({ buttonTextColor })}
            onSave={onSave}
            value={profile.theme.buttonTextColor}
          />
        </div>
      </section>

      <section className="design-section" aria-labelledby="design-typography-title">
        <h2 id="design-typography-title">Typography</h2>
        <div className="design-section-content">
          <div className="design-field">
            <label className="design-field-label" htmlFor="design-font-family">
              Font
            </label>
            <select
              id="design-font-family"
              value={profile.theme.fontFamily}
              onChange={(event) => onUpdateTheme({ fontFamily: event.target.value })}
            >
              {fontOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </section>
  );
}
