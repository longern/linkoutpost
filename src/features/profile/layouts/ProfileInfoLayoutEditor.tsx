import type { ProfileTheme } from "../../../profile";
import type { ProfileLayoutEditorProps } from "./ProfileLayoutEditor";
import { useTranslation } from "../../../i18n";

type InfoDetails = ProfileTheme["infoDetails"];

export function ProfileInfoLayoutEditor({
  onCommitTheme,
  onUpdateTheme,
  profile,
}: ProfileLayoutEditorProps) {
  const { t } = useTranslation();
  function updateInfoDetails(patch: Partial<InfoDetails>): void {
    onUpdateTheme({
      infoDetails: { ...profile.theme.infoDetails, ...patch },
    });
  }

  function commitInfoDetails(patch: Partial<InfoDetails>): void {
    onCommitTheme({
      infoDetails: { ...profile.theme.infoDetails, ...patch },
    });
  }

  return (
    <section
      className="info-layout-editor"
      aria-label={t("editor.forms.infoLayoutOptions")}
    >
      <div className="card-field-editor-header">
        <strong>{t("editor.forms.personalInfo")}</strong>
      </div>
      <div className="info-details-grid">
        <label className="design-field">
          <span className="design-field-label">
            {t("editor.forms.gender")}
          </span>
          <input
            placeholder={t("editor.forms.gender")}
            value={profile.theme.infoDetails.gender}
            onChange={(event) =>
              updateInfoDetails({ gender: event.target.value })
            }
            onBlur={(event) =>
              commitInfoDetails({ gender: event.target.value })
            }
          />
        </label>
        <label className="design-field">
          <span className="design-field-label">
            {t("editor.forms.birthDate")}
          </span>
          <input
            type="date"
            value={profile.theme.infoDetails.birthDate}
            onChange={(event) =>
              updateInfoDetails({ birthDate: event.target.value })
            }
            onBlur={(event) =>
              commitInfoDetails({ birthDate: event.target.value })
            }
          />
        </label>
        <label className="design-field">
          <span className="design-field-label">
            {t("editor.forms.location")}
          </span>
          <input
            placeholder={t("editor.forms.location")}
            value={profile.theme.infoDetails.location}
            onChange={(event) =>
              updateInfoDetails({ location: event.target.value })
            }
            onBlur={(event) =>
              commitInfoDetails({ location: event.target.value })
            }
          />
        </label>
      </div>
    </section>
  );
}
