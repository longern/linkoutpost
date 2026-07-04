import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  AtSign,
  Camera,
  Code2,
  Copy,
  Globe,
  Link,
  Mail,
  Music2,
  Share2,
  User,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import type { LinkItem, LinkProfile, ProfileTheme } from "./profile";
import {
  copyProfileUrl,
  getProfileShareCapabilities,
  profileShareAttributes,
  shareProfile,
  type ProfileShareCapabilities,
} from "./profileShare";
import { siteTitle } from "./siteConfig";

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

function iconForLink(link: LinkItem): LucideIcon {
  const value = `${link.label} ${link.url}`.toLowerCase();
  if (value.includes("github") || value.includes("gitlab")) return Code2;
  if (value.includes("instagram")) return Camera;
  if (value.includes("linkedin")) return AtSign;
  if (value.includes("youtube") || value.includes("video")) return Video;
  if (value.includes("mailto:") || value.includes("email")) return Mail;
  if (
    value.includes("spotify") ||
    value.includes("tiktok") ||
    value.includes("music")
  ) {
    return Music2;
  }
  if (value.includes("http")) return Globe;
  return Link;
}

function ProfileAvatar({ avatarUrl }: { avatarUrl?: string | null }) {
  return avatarUrl ? (
    <img alt="" className="profile-avatar" src={avatarUrl} />
  ) : (
    <div aria-hidden="true" className="profile-avatar-placeholder">
      <User size={38} strokeWidth={1.8} />
    </div>
  );
}

function ShareDialog({
  canCopy,
  canShare,
  onClose,
  onSystemShare,
  open,
  shareOverlayRef,
  shareUrl,
}: {
  canCopy: boolean;
  canShare: boolean;
  onClose(): void;
  onSystemShare(): void;
  open: boolean;
  shareOverlayRef: RefObject<HTMLDivElement | null>;
  shareUrl: string;
}) {
  return (
    <div
      aria-hidden={!open}
      className={`profile-share-overlay${open ? " is-open" : ""}`}
      data-profile-share-overlay=""
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
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
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="profile-share-url">
          <span className="profile-share-url-text" data-profile-share-url-text="">
            {shareUrl}
          </span>
        </div>
        <div className="profile-share-actions">
          <button
            className="profile-share-dialog profile-share-copy-button"
            data-profile-share-copy=""
            disabled={!canCopy}
            onClick={() => {
              if (!canCopy) return;
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
            disabled={!canShare}
            onClick={onSystemShare}
            type="button"
          >
            <Share2 aria-hidden="true" size={16} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage({
  avatarUrl,
  backgroundUrl,
  profile,
  shareEnabled = true,
}: {
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  profile: LinkProfile | null;
  shareEnabled?: boolean;
}) {
  if (!profile) {
    return (
      <main className="public-page public-page-classic">
        <section className="public-profile public-profile-classic">
          <div className="public-profile-content">
            <p className="eyebrow">{siteTitle}</p>
            <h1 className="profile-title">Profile not found</h1>
            <p>This handle does not have a published page yet.</p>
          </div>
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

  const shareButton = (
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
  );

  const shareDialog = shareEnabled ? (
    <ShareDialog
      canCopy={shareCapabilities.canCopy}
      canShare={shareCapabilities.canShare}
      onClose={() => setShareOpen(false)}
      onSystemShare={onSystemShare}
      open={shareOpen}
      shareOverlayRef={shareOverlayRef}
      shareUrl={shareUrl}
    />
  ) : null;

  if (currentProfile.theme.layout === "card") {
    const filledFields = currentProfile.theme.cardFields.filter(
      (field) => field.label.trim() || field.value.trim(),
    );

    return (
      <main
        className="public-page public-page-card"
        style={themeStyle(currentProfile.theme)}
      >
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
              <ProfileAvatar avatarUrl={avatarUrl} />
              {currentProfile.title.trim() && (
                <h1 className="profile-card-name">{currentProfile.title}</h1>
              )}
              {filledFields.length > 0 && (
                <dl className="profile-card-fields">
                  {filledFields.map((field) => (
                    <div className="profile-card-field" key={field.id}>
                      {field.label.trim() && <dt>{field.label}</dt>}
                      {field.value.trim() && <dd>{field.value}</dd>}
                    </div>
                  ))}
                </dl>
              )}
            </article>
            <div className="profile-social-links" aria-label="Social links">
              {currentProfile.links.map((link) => {
                const Icon = iconForLink(link);
                return (
                  <a
                    aria-label={link.label}
                    className="profile-social-link"
                    data-profile-link-id={link.id}
                    href={link.url}
                    key={link.id}
                    rel="noreferrer"
                    target="_blank"
                    title={link.label}
                  >
                    <Icon aria-hidden="true" size={20} strokeWidth={2} />
                  </a>
                );
              })}
            </div>
          </div>
          {shareDialog}
        </section>
      </main>
    );
  }

  return (
    <main
      className="public-page public-page-classic"
      style={themeStyle(currentProfile.theme)}
    >
      <section className="public-profile public-profile-classic">
        {shareButton}
        <div className="public-profile-content">
          <ProfileAvatar avatarUrl={avatarUrl} />
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
        </div>
        {shareDialog}
      </section>
    </main>
  );
}
