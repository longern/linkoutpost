import type { CSSProperties, ReactNode } from "react";

export function ProfileClassicLayout({
  avatar,
  bannerMedia,
  footer,
  profileActions,
  profileIntro,
  shareButton,
  shareDialog,
  style,
}: {
  avatar: ReactNode;
  bannerMedia?: ReactNode;
  footer: ReactNode;
  profileActions: ReactNode;
  profileIntro: ReactNode;
  shareButton: ReactNode;
  shareDialog: ReactNode;
  style: CSSProperties;
}) {
  return (
    <main className="public-page public-page-classic" style={style}>
      <section
        className={`public-profile public-profile-classic${bannerMedia ? " has-banner-image" : ""}`}
      >
        {shareButton}
        {bannerMedia}
        <div className="public-profile-content">
          {avatar}
          {profileIntro}
          {profileActions}
        </div>
        {footer}
        {shareDialog}
      </section>
    </main>
  );
}
