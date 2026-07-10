import type { CSSProperties, ReactNode } from "react";

export function ProfileInfoLayout({
  avatar,
  bannerMedia,
  bio,
  footer,
  infoChips,
  profileActions,
  shareButton,
  shareDialog,
  style,
  titleBlock,
}: {
  avatar: ReactNode;
  bannerMedia?: ReactNode;
  bio: ReactNode;
  footer: ReactNode;
  infoChips: ReactNode;
  profileActions: ReactNode;
  shareButton: ReactNode;
  shareDialog: ReactNode;
  style: CSSProperties;
  titleBlock: ReactNode;
}) {
  return (
    <main className="public-page public-page-info" style={style}>
      <section
        className={`public-profile public-profile-info${bannerMedia ? " has-banner-image" : ""}`}
      >
        {shareButton}
        <div className="profile-info-hero">
          {bannerMedia}
          <div className="profile-info-identity">
            {avatar}
            <div className="profile-info-title-block">{titleBlock}</div>
          </div>
        </div>
        <div className="profile-info-body">
          {bio}
          {infoChips}
          {profileActions}
        </div>
        {footer}
        {shareDialog}
      </section>
    </main>
  );
}
