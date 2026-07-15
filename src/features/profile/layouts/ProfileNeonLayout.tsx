import type { CSSProperties, ReactNode } from "react";

export function ProfileNeonLayout({
  avatar,
  backgroundUrl,
  footer,
  profileActions,
  profileIntro,
  shareButton,
  shareDialog,
  style,
}: {
  avatar: ReactNode;
  backgroundUrl?: string | null;
  footer: ReactNode;
  profileActions: ReactNode;
  profileIntro: ReactNode;
  shareButton: ReactNode;
  shareDialog: ReactNode;
  style: CSSProperties;
}) {
  return (
    <main className="public-page public-page-neon" style={style}>
      <section
        className={`public-profile public-profile-neon${backgroundUrl ? " has-background-image" : ""}`}
        style={
          backgroundUrl
            ? {
                backgroundImage: `url(${backgroundUrl})`,
                backgroundPosition: "center top",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
              }
            : undefined
        }
      >
        {shareButton}
        <div className="neon-profile-content">
          <div className="neon-archive-label">CERBERUS ARCHIVE</div>
          <div className="neon-avatar-frame">{avatar}</div>
          <div className="neon-profile-intro">{profileIntro}</div>
          {profileActions}
        </div>
        {footer}
        {shareDialog}
      </section>
    </main>
  );
}
