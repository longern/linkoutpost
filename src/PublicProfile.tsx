import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { FaCopy, FaUser, FaXmark } from "react-icons/fa6";
import { LuCopyCheck } from "react-icons/lu";
import { RxShare2 } from "react-icons/rx";
import {
  getSocialLinkUrl,
  type LinkItem,
  type LinkProfile,
  type ProfileTheme,
  type SocialLink,
} from "./profile";
import {
  copyProfileUrl,
  getProfileShareCapabilities,
  profileShareAttributes,
  shareProfile,
  type ProfileShareCapabilities,
} from "./profileShare";
import { siteTitle } from "./siteConfig";
import { getSocialPlatformIcon } from "./socialIcons";

function parseHexColor(value: string): [number, number, number] | null {
  const hex = value.trim().replace(/^#/, "");

  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return hex.split("").map((character) => {
      const channel = Number.parseInt(`${character}${character}`, 16);
      return channel;
    }) as [number, number, number];
  }

  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
    ];
  }

  return null;
}

function getRelativeLuminance([red, green, blue]: [number, number, number]): number {
  const [r, g, b] = [red, green, blue].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getProfileControlColor(backgroundColor: string): string {
  const rgb = parseHexColor(backgroundColor);
  if (!rgb) return "#111827";

  return getRelativeLuminance(rgb) < 0.45 ? "#ffffff" : "#111827";
}

function themeStyle(theme: ProfileTheme): CSSProperties {
  return {
    "--profile-accent-color": theme.accentColor,
    "--profile-background-color": theme.backgroundColor,
    "--profile-button-background-color": theme.buttonBackgroundColor,
    "--profile-button-text-color": theme.buttonTextColor,
    "--profile-control-color": getProfileControlColor(theme.backgroundColor),
    "--profile-font-family": theme.fontFamily,
    "--profile-text-color": theme.textColor,
  } as CSSProperties;
}

function ProfileSocialLinks({ links }: { links: SocialLink[] }) {
  const visibleLinks = links.filter((link) => link.userId.trim());
  const [copiedSocialId, setCopiedSocialId] = useState<string | null>(null);
  if (visibleLinks.length === 0) return null;

  return (
    <div className="profile-social-links" aria-label="Social links">
      {visibleLinks.map((link) => {
        const Icon = getSocialPlatformIcon(link.platform);
        if (link.platform === "wechat") {
          const copied = copiedSocialId === link.id;
          return (
            <button
              aria-label="Copy WeChat ID"
              className={`profile-social-link${copied ? " is-copied" : ""}`}
              data-profile-wechat-copy=""
              data-wechat-id={link.userId}
              key={link.id}
              onClick={() => {
                if (!navigator.clipboard?.writeText) return;
                void navigator.clipboard.writeText(link.userId).then(() => {
                  setCopiedSocialId(link.id);
                  window.setTimeout(() => setCopiedSocialId(null), 1400);
                });
              }}
              title="Copy WeChat ID"
              type="button"
            >
              {copied ? (
                <LuCopyCheck aria-hidden="true" data-wechat-success-icon="" size={20} />
              ) : (
                <Icon aria-hidden="true" data-wechat-default-icon="" size={20} />
              )}
            </button>
          );
        }

        return (
          <a
            aria-label={link.platform}
            className="profile-social-link"
            href={getSocialLinkUrl(link)}
            key={link.id}
            rel="noreferrer noopener"
            target="_blank"
            title={link.platform}
          >
            <Icon aria-hidden="true" size={20} />
          </a>
        );
      })}
    </div>
  );
}

function PublicLinks({ links }: { links: LinkItem[] }) {
  return (
    <div className="public-links">
      {links.map((link) => (
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
  );
}

function ProfileAvatar({ avatarUrl }: { avatarUrl?: string | null }) {
  return avatarUrl ? (
    <img alt="" className="profile-avatar" src={avatarUrl} />
  ) : (
    <div aria-hidden="true" className="profile-avatar-placeholder">
      <FaUser size={34} />
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
            <FaXmark aria-hidden="true" size={18} />
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
            disabled={!canCopy}
            onClick={() => {
              if (!canCopy) return;
              void copyProfileUrl(shareUrl);
            }}
            type="button"
          >
            <FaCopy aria-hidden="true" size={16} />
            Copy link
          </button>
          <button
            className="profile-share-dialog profile-share-system-button"
            data-profile-share-system=""
            disabled={!canShare}
            onClick={onSystemShare}
            type="button"
          >
            <RxShare2 aria-hidden="true" size={16} />
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
      <RxShare2 aria-hidden="true" size={18} />
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
            <div className="profile-card-meta">
              <p className="handle">@{currentProfile.handle}</p>
              {currentProfile.bio.trim() && (
                <p className="bio">{currentProfile.bio}</p>
              )}
              <ProfileSocialLinks links={currentProfile.socialLinks} />
              <PublicLinks links={currentProfile.links} />
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
          <ProfileSocialLinks links={currentProfile.socialLinks} />
          <PublicLinks links={currentProfile.links} />
        </div>
        {shareDialog}
      </section>
    </main>
  );
}
