import type { ProfileTheme } from "../../../profile";
import type { ProfileLayoutEditorProps } from "./ProfileLayoutEditor";

type InfoDetails = ProfileTheme["infoDetails"];

export function ProfileInfoLayoutEditor({
  onCommitTheme,
  onUpdateTheme,
  profile,
}: ProfileLayoutEditorProps) {
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
    <section className="info-layout-editor" aria-label="Info layout options">
      <div className="card-field-editor-header">
        <strong>Personal info</strong>
      </div>
      <div className="info-details-grid">
        <label className="design-field">
          <span className="design-field-label">Gender</span>
          <input
            placeholder="Gender"
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
          <span className="design-field-label">Birth date</span>
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
          <span className="design-field-label">Location</span>
          <input
            placeholder="Location"
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
