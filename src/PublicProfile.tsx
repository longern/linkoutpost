import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Copy, Share2, User, X } from "lucide-react";
import type { LinkProfile, ProfileTheme } from "./profile";
import {
  copyProfileUrl,
  getProfileShareCapabilities,
  profileShareAttributes,
  shareProfile,
  type ProfileShareCapabilities,
} from "./profileShare";

function themeStyle(theme: ProfileTheme): CSSProperties {
  return {
    "--profile-accent-color": theme.accentColor,
    "--profile-background-color": theme.backgroundColor,
    "--profile-button-background-color": theme.buttonBackgroundColor,
    "--profile-button-text-color": theme.buttonTextColor,
    "--profile-font-family": theme.fontFamily,
    "--profile-text-color": theme.textColor,
  } as CSSProperties;
}

export function ProfilePage({
  avatarUrl,
  profile,
  shareEnabled = true,
}: {
  avatarUrl?: string | null;
  profile: LinkProfile | null;
  shareEnabled?: boolean;
}) {
  if (!profile) {
    return (
      <main className="public-page">
        <section className="public-profile">
          <p className="eyebrow">LinkOutpost</p>
          <h1 className="profile-title">Profile not found</h1>
          <p>This handle does not have a published page yet.</p>
        </section>
      </main>
    );
  }

  const currentProfile = profile;
  const shareOverlayRef = useRef<HTMLDivElement | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCapabilities, setShareCapabilities] =
    useState<ProfileShareCapabilities>({
      canCopy: false,
      canShare: false,
    });
  const shareUrl =
    typeof window === "undefined"
      ? `/${currentProfile.handle}`
      : `${window.location.origin}/${currentProfile.handle}`;

  useEffect(() => {
    setShareCapabilities(getProfileShareCapabilities());
  }, []);

  function onSystemShare(): void {
    if (!shareCapabilities.canShare) return;

    void shareProfile({
      text: currentProfile.bio,
      title: currentProfile.title,
      url: shareUrl,
    });
  }

  return (
    <main className="public-page" style={themeStyle(currentProfile.theme)}>
      <section className="public-profile">
        <button
          aria-label="Share profile"
          className="circle-icon-button profile-share-button"
          onClick={() => {
            if (shareEnabled) setShareOpen(true);
          }}
          type="button"
          {...(shareEnabled
            ? profileShareAttributes({
                text: currentProfile.bio,
                title: currentProfile.title,
              })
            : {})}
        >
          <Share2 aria-hidden="true" size={18} strokeWidth={2.2} />
        </button>
        {avatarUrl ? (
          <img alt="" className="profile-avatar" src={avatarUrl} />
        ) : (
          <div aria-hidden="true" className="profile-avatar-placeholder">
            <User size={38} strokeWidth={1.8} />
          </div>
        )}
        <h1 className="profile-title">{currentProfile.title}</h1>
        <p className="handle">@{currentProfile.handle}</p>
        <p className="bio">{currentProfile.bio}</p>
        <div className="public-links">
          {currentProfile.links.map((link) => (
            <a
              className="public-link"
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
        {shareEnabled && (
          <div
            aria-hidden={!shareOpen}
            className={`profile-share-overlay${shareOpen ? " is-open" : ""}`}
            data-profile-share-overlay=""
            onClick={(event) => {
              if (event.target === event.currentTarget) setShareOpen(false);
            }}
            ref={shareOverlayRef}
          >
            <div
              aria-modal="true"
              className="profile-share-panel"
              data-profile-share-panel=""
              role="dialog"
            >
              <div className="profile-share-header">
                <h2 className="profile-share-title">Share this page</h2>
                <button
                  aria-label="Close share dialog"
                  className="circle-icon-button"
                  data-profile-share-close=""
                  onClick={() => setShareOpen(false)}
                  type="button"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              </div>
              <div className="profile-share-url">
                <span
                  className="profile-share-url-text"
                  data-profile-share-url-text=""
                >
                  {shareUrl}
                </span>
              </div>
              <div className="profile-share-actions">
                <button
                  className="profile-share-dialog profile-share-copy-button"
                  data-profile-share-copy=""
                  disabled={!shareCapabilities.canCopy}
                  onClick={() => {
                    if (!shareCapabilities.canCopy) return;
                    void copyProfileUrl(shareUrl);
                  }}
                  type="button"
                >
                  <Copy aria-hidden="true" size={16} />
                  Copy link
                </button>
                <button
                  className="profile-share-dialog profile-share-system-button"
                  data-profile-share-system=""
                  disabled={!shareCapabilities.canShare}
                  onClick={onSystemShare}
                  type="button"
                >
                  <Share2 aria-hidden="true" size={16} />
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
