import { useState } from "react";
import { FaCamera, FaCircleUser, FaPlus, FaTrash, FaXmark } from "react-icons/fa6";
import {
  normalizeSocialUserId,
  socialPlatformDefinitions,
  type LinkProfile,
  type SocialLink,
  type SocialPlatform,
} from "../../profile";
import { getSocialPlatformIcon } from "../../socialIcons";
import { useTranslation } from "../../i18n";

type ProfilePanelProps = {
  avatarUrl: string | null;
  onAvatarChange(file: File | null): void;
  onCommit(patch: Partial<LinkProfile>): void;
  onSave(): void;
  onUpdate(patch: Partial<LinkProfile>): void;
  profile: LinkProfile;
};

export function ProfilePanel({
  avatarUrl,
  onAvatarChange,
  onCommit,
  onSave,
  onUpdate,
  profile,
}: ProfilePanelProps) {
  const { t } = useTranslation();
  const [socialDialogOpen, setSocialDialogOpen] = useState(false);

  function addSocialLink(platform: SocialPlatform): void {
    const nextSocialLinks = [
      ...profile.socialLinks,
      {
        id: crypto.randomUUID(),
        platform,
        userId: "",
      },
    ];
    onCommit({ socialLinks: nextSocialLinks });
    setSocialDialogOpen(false);
  }

  function updateSocialLink(id: string, patch: Partial<SocialLink>): void {
    onUpdate({
      socialLinks: profile.socialLinks.map((link) =>
        link.id === id ? { ...link, ...patch } : link,
      ),
    });
  }

  function removeSocialLink(id: string): void {
    onCommit({
      socialLinks: profile.socialLinks.filter((link) => link.id !== id),
    });
  }

  return (
    <section className="profile-panel" aria-label={t("editor.forms.profile")}>
      <div className="profile-editor-summary">
        <label
          className="profile-editor-avatar"
          title={t("editor.forms.uploadAvatar")}
        >
          <span className="sr-only">{t("editor.forms.avatarImage")}</span>
          <span className="profile-avatar-visual">
            {avatarUrl ? (
              <img alt="" src={avatarUrl} />
            ) : (
              <FaCircleUser aria-hidden="true" size={54} />
            )}
          </span>
          <span className="profile-avatar-action" aria-hidden="true">
            <FaCamera size={16} />
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
        <div className="profile-editor-identity">
          <span className="profile-editor-handle">
            {profile.handle ? `@${profile.handle}` : t("editor.forms.noHandle")}
          </span>
        </div>
      </div>

      <div className="profile-fields-grid">
        <label>
          {t("editor.forms.name")}
          <input
            placeholder={t("editor.forms.yourName")}
            value={profile.title}
            onChange={(event) => onUpdate({ title: event.target.value })}
            onBlur={onSave}
          />
        </label>
        <label>
          {t("editor.forms.bio")}
          <textarea
            placeholder={t("editor.forms.bioPlaceholder")}
            value={profile.bio}
            onChange={(event) => onUpdate({ bio: event.target.value })}
            onBlur={onSave}
            rows={3}
          />
        </label>
      </div>

      <hr className="panel-section-divider" />
      <section className="design-section social-editor" aria-labelledby="social-editor-title">
        <div className="social-editor-header">
          <h2 id="social-editor-title">{t("editor.forms.socialIcons")}</h2>
          <button
            aria-label={t("editor.forms.addSocialIcon")}
            className="circle-icon-button"
            onClick={() => setSocialDialogOpen(true)}
            title={t("editor.forms.addSocialIcon")}
            type="button"
          >
            <FaPlus aria-hidden="true" size={18} />
          </button>
        </div>

        {profile.socialLinks.length > 0 && (
          <div className="social-editor-list">
            {profile.socialLinks.map((link) => {
              const definition = socialPlatformDefinitions.find(
                (platform) => platform.id === link.platform,
              );
              const Icon = getSocialPlatformIcon(link.platform);

              return (
                <div className="social-editor-row" key={link.id}>
                  <span className="social-editor-platform">
                    <Icon aria-hidden="true" size={18} />
                    {definition?.label ?? link.platform}
                  </span>
                  <input
                    aria-label={`${definition?.label ?? link.platform} ID`}
                    placeholder={definition?.placeholder ?? "username"}
                    value={link.userId}
                    onChange={(event) =>
                      updateSocialLink(link.id, {
                        userId: normalizeSocialUserId(event.target.value),
                      })
                    }
                    onBlur={onSave}
                  />
                  <button
                    aria-label={t("editor.forms.removeSocialIcon")}
                    className="circle-icon-button danger"
                    onClick={() => removeSocialLink(link.id)}
                    title={t("editor.forms.removeSocialIcon")}
                    type="button"
                  >
                    <FaTrash aria-hidden="true" size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div className="social-position-field">
          <span className="design-field-label">{t("editor.forms.position")}</span>
          <div
            className="radio-options"
            role="radiogroup"
            aria-label={t("editor.forms.socialPosition")}
          >
            <label className="radio-option">
              <input
                checked={profile.theme.socialLinksPosition === "top"}
                name="social-links-position"
                onChange={() =>
                  onCommit({
                    theme: {
                      ...profile.theme,
                      socialLinksPosition: "top",
                    },
                  })
                }
                type="radio"
              />
              {t("editor.forms.top")}
            </label>
            <label className="radio-option">
              <input
                checked={profile.theme.socialLinksPosition === "bottom"}
                name="social-links-position"
                onChange={() =>
                  onCommit({
                    theme: {
                      ...profile.theme,
                      socialLinksPosition: "bottom",
                    },
                  })
                }
                type="radio"
              />
              {t("editor.forms.bottom")}
            </label>
          </div>
        </div>
      </section>

      {socialDialogOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="social-dialog-title"
            aria-modal="true"
            className="modal-card social-platform-dialog"
            role="dialog"
          >
            <div className="profile-social-dialog-header">
              <h2 id="social-dialog-title">
                {t("editor.forms.addSocialIcon")}
              </h2>
              <button
                aria-label={t("editor.forms.closeSocialDialog")}
                className="circle-icon-button"
                onClick={() => setSocialDialogOpen(false)}
                type="button"
              >
                <FaXmark aria-hidden="true" size={18} />
              </button>
            </div>
            <hr className="social-platform-divider" />
            <div className="social-platform-scroll">
              <div className="social-platform-grid">
                {socialPlatformDefinitions.map((platform) => {
                  const Icon = getSocialPlatformIcon(platform.id);

                  return (
                    <button
                      className="social-platform-option"
                      key={platform.id}
                      onClick={() => addSocialLink(platform.id)}
                      type="button"
                    >
                      <Icon aria-hidden="true" size={20} />
                      {platform.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
