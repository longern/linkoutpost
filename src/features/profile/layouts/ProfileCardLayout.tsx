import type { CSSProperties, ReactNode } from "react";

export function ProfileCardLayout({
  avatar,
  backgroundUrl,
  cardFields,
  footer,
  profileActions,
  profileIntro,
  shareButton,
  shareDialog,
  style,
}: {
  avatar: ReactNode;
  backgroundUrl?: string | null;
  cardFields: ReactNode;
  footer: ReactNode;
  profileActions: ReactNode;
  profileIntro: ReactNode;
  shareButton: ReactNode;
  shareDialog: ReactNode;
  style: CSSProperties;
}) {
  return (
    <main className="public-page public-page-card" style={style}>
      <section className="public-profile public-profile-card profile-card-page">
        {shareButton}
        <div className="profile-card-layout">
          <article
            className="profile-structured-card"
            style={
              backgroundUrl
                ? { backgroundImage: `url(${backgroundUrl})` }
                : undefined
            }
          >
            {avatar}
            {cardFields}
          </article>
          <div className="profile-card-meta">
            {profileIntro}
            {profileActions}
          </div>
        </div>
        {footer}
        {shareDialog}
      </section>
    </main>
  );
}
