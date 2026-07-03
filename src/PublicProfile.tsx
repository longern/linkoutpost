import type { CSSProperties } from "react";
import { Share2, User } from "lucide-react";
import type { LinkProfile, ProfileTheme } from "./profile";
import { profileShareAttributes, shareProfile } from "./profileShare";
import { publicProfileClassNames as styles } from "./PublicProfileClasses";

function themeStyle(theme: ProfileTheme): CSSProperties {
  return {
    "--profile-accent-color": theme.accentColor,
    "--profile-background-color": theme.backgroundColor,
    "--profile-button-background-color": theme.buttonBackgroundColor,
    "--profile-button-text-color": theme.buttonTextColor,
    "--profile-font-family": theme.fontFamily,
    "--profile-text-color": theme.textColor
  } as CSSProperties;
}

export function ProfilePage({
  avatarUrl,
  profile
}: {
  avatarUrl?: string | null;
  profile: LinkProfile | null;
}) {
  if (!profile) {
    return (
      <main className={styles.publicPage}>
        <section className={styles.publicProfile}>
          <p className={styles.eyebrow}>Link Outpost</p>
          <h1 className={styles.title}>Profile not found</h1>
          <p>This handle does not have a published page yet.</p>
        </section>
      </main>
    );
  }

  const currentProfile = profile;

  function onShare(): void {
    const shareUrl = typeof window === "undefined"
      ? `/${currentProfile.handle}`
      : `${window.location.origin}/${currentProfile.handle}`;

    void shareProfile({
      text: currentProfile.bio,
      title: currentProfile.title,
      url: shareUrl
    });
  }

  return (
    <main className={styles.publicPage} style={themeStyle(currentProfile.theme)}>
      <section className={styles.publicProfile}>
        <button
          aria-label="Share profile"
          className={`${styles.circleIconButton} ${styles.profileShareButton}`}
          onClick={onShare}
          type="button"
          {...profileShareAttributes({
            text: currentProfile.bio,
            title: currentProfile.title
          })}
        >
          <Share2 aria-hidden="true" size={18} strokeWidth={2.2} />
        </button>
        {avatarUrl ? (
          <img alt="" className={styles.avatar} src={avatarUrl} />
        ) : (
          <div aria-hidden="true" className={styles.avatarPlaceholder}>
            <User size={38} strokeWidth={1.8} />
          </div>
        )}
        <h1 className={styles.title}>{currentProfile.title}</h1>
        <p className={styles.handle}>@{currentProfile.handle}</p>
        <p className={styles.bio}>{currentProfile.bio}</p>
        <div className={styles.links}>
          {currentProfile.links.map((link) => (
            <a
              className={styles.link}
              data-profile-link-id={link.id}
              href={link.url}
              key={link.id}
              rel="noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
