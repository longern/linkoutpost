import type { LinkProfile, ProfileTheme } from "../../profile";
import { getProfileLayoutEditor } from "../../features/profile/layouts/editorRegistry";
import {
  isProfileLayout,
  profileLayoutRegistry,
  type ProfileLayout,
} from "../../features/profile/layouts/registry";
import "../../features/profile/layouts/ProfileLayoutEditor.css";
import { useTranslation } from "../../i18n";

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
  const { t } = useTranslation();
  const selectedLayout = isProfileLayout(profile.theme.layout)
    ? profile.theme.layout
    : "classic";
  const LayoutEditor = getProfileLayoutEditor(selectedLayout);

  return (
    <section className="layout-panel" aria-label={t("editor.forms.layout")}>
      <fieldset
        className="layout-options"
        aria-label={t("editor.sections.layout")}
      >
        <div className="layout-option-grid">
          {(Object.entries(profileLayoutRegistry) as Array<
            [ProfileLayout, (typeof profileLayoutRegistry)[ProfileLayout]]
          >).map(([key, definition]) => {
            const Preview = definition.Preview;

            return (
              <label
                className={`layout-option${selectedLayout === key ? " is-selected" : ""}`}
                key={key}
              >
                <input
                  checked={selectedLayout === key}
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
                  <span className="layout-option-title">
                    {t(`editor.layouts.${key}Label`, {
                      defaultValue: definition.label,
                    })}
                  </span>
                  <span className="layout-option-description">
                    {t(`editor.layouts.${key}Description`, {
                      defaultValue: definition.description,
                    })}
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
