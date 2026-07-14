import type { LinkProfile, ProfileTheme } from "../../profile";
import { getProfileLayoutEditor } from "../../features/profile/layouts/editorRegistry";
import {
  profileLayoutRegistry,
  type ProfileLayout,
} from "../../features/profile/layouts/registry";
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
          {(Object.entries(profileLayoutRegistry) as Array<
            [ProfileLayout, (typeof profileLayoutRegistry)[ProfileLayout]]
          >).map(([key, definition]) => {
            const Preview = definition.Preview;

            return (
              <label
                className={`layout-option${profile.theme.layout === key ? " is-selected" : ""}`}
                key={key}
              >
                <input
                  checked={profile.theme.layout === key}
                  name="profile-layout"
                  onChange={() => onCommitTheme({ layout: key })}
                  type="radio"
                  value={key}
                />
                <span
                  aria-hidden="true"
                  className={`layout-option-preview is-${key}`}
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
