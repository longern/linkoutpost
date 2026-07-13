import type { LinkProfile, ProfileTheme } from "../../profile";
import { getProfileLayoutEditor } from "../../features/profile/layouts/editorRegistry";
import { profileLayoutDefinitions } from "../../features/profile/layouts/registry";
import "../../features/profile/layouts/ProfileLayoutEditor.css";

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
  const LayoutEditor = getProfileLayoutEditor(profile.theme.layout);

  return (
    <section className="layout-panel" aria-label="Layout form">
      <fieldset className="layout-options" aria-label="Layout">
        <div className="layout-option-grid">
          {profileLayoutDefinitions.map((definition) => {
            const Preview = definition.Preview;

            return (
              <label
                className={`layout-option${profile.theme.layout === definition.id ? " is-selected" : ""}`}
                key={definition.id}
              >
                <input
                  checked={profile.theme.layout === definition.id}
                  name="profile-layout"
                  onChange={() => onCommitTheme({ layout: definition.id })}
                  type="radio"
                  value={definition.id}
                />
                <span
                  aria-hidden="true"
                  className={`layout-option-preview is-${definition.id}`}
                >
                  <span className="layout-preview-phone">
                    <Preview />
                  </span>
                </span>
                <span className="layout-option-copy">
                  <span className="layout-option-title">{definition.label}</span>
                  <span className="layout-option-description">
                    {definition.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {LayoutEditor ? (
        <LayoutEditor
          onCommitTheme={onCommitTheme}
          onSave={onSave}
          onUpdateTheme={onUpdateTheme}
          profile={profile}
        />
      ) : null}
    </section>
  );
}
