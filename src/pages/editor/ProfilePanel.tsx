import { Camera, UserCircle } from "lucide-react";
import {
  isReservedPath,
  normalizeHandle,
  type LinkProfile,
} from "../../profile";

type ProfilePanelProps = {
  avatarUrl: string | null;
  mode: "loading" | "offline" | "backend";
  onAvatarChange(file: File | null): void;
  onSave(): void;
  onUpdate(patch: Partial<LinkProfile>): void;
  profile: LinkProfile;
};

export function ProfilePanel({
  avatarUrl,
  mode,
  onAvatarChange,
  onSave,
  onUpdate,
  profile,
}: ProfilePanelProps) {
  return (
    <section className="profile-panel" aria-label="Profile form">
      <div className="profile-editor-summary">
        <label className="profile-editor-avatar" title="Upload avatar">
          <span className="sr-only">Avatar image</span>
          <span className="profile-avatar-visual">
            {avatarUrl ? (
              <img alt="" src={avatarUrl} />
            ) : (
              <UserCircle aria-hidden="true" size={54} />
            )}
          </span>
          <span className="profile-avatar-action" aria-hidden="true">
            <Camera size={16} />
          </span>
          <input
            accept="image/*"
            onChange={(event) => {
              onAvatarChange(event.currentTarget.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
        <div>
          {mode === "backend" ? (
            <div className="readonly-field">
              <span>Handle</span>
              <strong>@{profile.handle}</strong>
            </div>
          ) : (
            <label>
              Handle
              <input
                value={profile.handle}
                onChange={(event) => {
                  onUpdate({ handle: normalizeHandle(event.target.value) });
                }}
                onBlur={onSave}
              />
            </label>
          )}
          {isReservedPath(profile.handle) && (
            <p className="field-error">This handle is reserved.</p>
          )}
        </div>
      </div>

      <div className="profile-fields-grid">
        <label>
          Name
          <input
            placeholder="Your name"
            value={profile.title}
            onChange={(event) => onUpdate({ title: event.target.value })}
            onBlur={onSave}
          />
        </label>
        <label>
          Bio
          <textarea
            placeholder="A short intro for your page"
            value={profile.bio}
            onChange={(event) => onUpdate({ bio: event.target.value })}
            onBlur={onSave}
            rows={3}
          />
        </label>
      </div>
    </section>
  );
}
