import {
  memo,
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
  getProfileAssetUrl,
  type LinkItem,
  type LinkProfile,
  type ProfileTheme,
  type SocialLink,
} from "../../profile";
import { getOEmbedRenderData } from "../../oembed";
import { ProfileCardLayout } from "./layouts/ProfileCardLayout";
import { ProfileClassicLayout } from "./layouts/ProfileClassicLayout";
import { ProfileInfoLayout } from "./layouts/ProfileInfoLayout";
import {
  copyProfileUrl,
  getProfileShareCapabilities,
  profileShareAttributes,
  shareProfile,
  type ProfileShareCapabilities,
} from "./share";
import { siteTitle } from "../../siteConfig";
import { getSocialPlatformIcon } from "../../socialIcons";

const emptyEmbedScripts: readonly string[] = [];

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

function getRelativeLuminance([red, green, blue]: [
  number,
  number,
  number,
]): number {
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

function isVideoMedia(url: string): boolean {
  return (
    /^data:video\//i.test(url) ||
    /\.(mp4|webm|ogv|ogg|mov)(?:[?#].*)?$/i.test(url)
  );
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
                <LuCopyCheck
                  aria-hidden="true"
                  data-wechat-success-icon=""
                  size={20}
                />
              ) : (
                <Icon
                  aria-hidden="true"
                  data-wechat-default-icon=""
                  size={20}
                />
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

function useEmbedScripts(scripts: readonly string[]): void {
  useEffect(() => {
    if (!scripts.length || typeof document === "undefined") return;

    const elements = scripts.map((src) => {
      const script = document.createElement("script");
      script.async = true;
      script.charset = "utf-8";
      script.src = src;
      document.body.appendChild(script);
      return script;
    });

    return () => {
      elements.forEach((script) => script.remove());
    };
  }, [scripts]);
}

const PublicEmbedHost = memo(
  function PublicEmbedHost({
    html,
    id,
    scripts,
  }: {
    html: string;
    id: string;
    scripts: readonly string[];
  }) {
    useEmbedScripts(scripts);

    return (
      <div
        className="public-link public-embed-link"
        data-profile-link-id={id}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  },
  (previous, next) =>
    previous.id === next.id &&
    previous.html === next.html &&
    previous.scripts.length === next.scripts.length &&
    previous.scripts.every((script, index) => script === next.scripts[index]),
);

function PublicEmbeddedLink({
  link,
  thumbnailUrl,
}: {
  link: LinkItem;
  thumbnailUrl?: string | null;
}) {
  const embed = getOEmbedRenderData(link);
  const scripts = embed?.scripts ?? emptyEmbedScripts;

  if (!embed) {
    return (
      <a
        className={`public-link${thumbnailUrl ? " has-thumbnail" : ""}`}
        data-profile-link-id={link.id}
        href={link.url}
        rel="noreferrer"
        target="_blank"
      >
        {thumbnailUrl ? (
          <span className="public-link-thumbnail">
            <img alt="" height={40} src={thumbnailUrl} width={40} />
          </span>
        ) : null}
        <span className="public-link-label">{link.label}</span>
      </a>
    );
  }

  return <PublicEmbedHost html={embed.html} id={link.id} scripts={scripts} />;
}

function PublicLinks({
  linkImageUrls = {},
  linkThumbnailUrls = {},
  links,
}: {
  linkImageUrls?: Record<string, string | null>;
  linkThumbnailUrls?: Record<string, string | null>;
  links: LinkItem[];
}) {
  const visibleLinks = links.filter((link) => !link.hidden);

  return (
    <div className="public-links">
      {visibleLinks.map((link) => {
        if (link.type === "image") {
          const imageUrl =
            linkImageUrls[link.id] ??
            getProfileAssetUrl(link.imageAssetId ?? null);
          const imageCard = (
            <>
              {imageUrl && isVideoMedia(imageUrl) ? (
                <video
                  autoPlay
                  className="public-image-card-media"
                  loop
                  muted
                  playsInline
                  src={imageUrl}
                />
              ) : imageUrl ? (
                <img
                  alt=""
                  className="public-image-card-media"
                  src={imageUrl}
                />
              ) : (
                <span className="public-image-card-placeholder">
                  {link.label || "Image"}
                </span>
              )}
              {link.label.trim() && (
                <span className="public-image-card-title">{link.label}</span>
              )}
            </>
          );

          if (link.url.trim()) {
            return (
              <a
                className="public-link public-image-card"
                data-profile-link-id={link.id}
                href={link.url}
                key={link.id}
                rel="noreferrer"
                target="_blank"
              >
                {imageCard}
              </a>
            );
          }

          return (
            <div
              className="public-link public-image-card"
              data-profile-link-id={link.id}
              key={link.id}
            >
              {imageCard}
            </div>
          );
        }

        const thumbnailUrl = link.thumbnailHidden
          ? null
          : (linkThumbnailUrls[link.id] ??
            getProfileAssetUrl(link.thumbnailAssetId ?? null) ??
            link.thumbnailUrl ??
            null);
        return (
          <PublicEmbeddedLink
            key={link.id}
            link={link}
            thumbnailUrl={thumbnailUrl}
          />
        );
      })}
    </div>
  );
}

function ProfileActions({
  linksSlot,
  socialLinksSlot,
  socialLinksPosition,
}: {
  linksSlot: React.ReactNode;
  socialLinksSlot: React.ReactNode;
  socialLinksPosition: ProfileTheme["socialLinksPosition"];
}) {
  const className = `profile-actions is-${socialLinksPosition}`;

  if (socialLinksPosition === "bottom") {
    return (
      <div className={className}>
        {linksSlot}
        {socialLinksSlot}
      </div>
    );
  }

  return (
    <div className={className}>
      {socialLinksSlot}
      {linksSlot}
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

function ProfileFooter() {
  return (
    <footer className="profile-footer">
      Powered by <a href="/">{siteTitle}</a>
    </footer>
  );
}

function ProfileIntro({ profile }: { profile: LinkProfile }) {
  return (
    <>
      <h1 className="profile-title">{profile.title}</h1>
      <p className="handle">@{profile.handle}</p>
      {profile.bio.trim() && <p className="bio">{profile.bio}</p>}
    </>
  );
}

function ProfileTitleBlock({ profile }: { profile: LinkProfile }) {
  return (
    <>
      <h1 className="profile-title">{profile.title}</h1>
      <p className="handle">@{profile.handle}</p>
    </>
  );
}

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;

  const date = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < date.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 && age < 130 ? age : null;
}

function ProfileInfoChips({ profile }: { profile: LinkProfile }) {
  const { birthDate, gender, location } = profile.theme.infoDetails;
  const age = calculateAge(birthDate);
  const chips = [
    gender.trim(),
    age === null ? "" : `${age}`,
    location.trim(),
  ].filter(Boolean);

  return (
    <div className="profile-info-chips" aria-label="Profile details">
      {chips.map((chip, index) => (
        <span className="profile-info-chip" key={`${chip}-${index}`}>
          {chip}
        </span>
      ))}
    </div>
  );
}

function ProfileCardFields({ profile }: { profile: LinkProfile }) {
  const filledFields = profile.theme.cardFields.filter(
    (field) => field.label.trim() || field.value.trim(),
  );

  if (filledFields.length === 0) return null;

  return (
    <dl className="profile-card-fields">
      {filledFields.map((field) => (
        <div className="profile-card-field" key={field.id}>
          {field.label.trim() && <dt>{field.label}</dt>}
          {field.value.trim() && <dd>{field.value}</dd>}
        </div>
      ))}
    </dl>
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
  bannerImageUrl,
  profile,
  shareEnabled = true,
  linkImageUrls,
  linkThumbnailUrls,
}: {
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  bannerImageUrl?: string | null;
  linkImageUrls?: Record<string, string | null>;
  linkThumbnailUrls?: Record<string, string | null>;
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
          <ProfileFooter />
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
  const profileAvatar = <ProfileAvatar avatarUrl={avatarUrl} />;
  const profileIntro = <ProfileIntro profile={currentProfile} />;
  const profileTitleBlock = <ProfileTitleBlock profile={currentProfile} />;
  const profileLinks = (
    <PublicLinks
      linkImageUrls={linkImageUrls}
      linkThumbnailUrls={linkThumbnailUrls}
      links={currentProfile.links}
    />
  );
  const profileSocialLinks = (
    <ProfileSocialLinks links={currentProfile.socialLinks} />
  );
  const profileActions = (
    <ProfileActions
      linksSlot={profileLinks}
      socialLinksSlot={profileSocialLinks}
      socialLinksPosition={currentProfile.theme.socialLinksPosition}
    />
  );
  const profileFooter = <ProfileFooter />;

  if (currentProfile.theme.layout === "card") {
    return (
      <ProfileCardLayout
        avatar={profileAvatar}
        backgroundUrl={backgroundUrl}
        cardFields={<ProfileCardFields profile={currentProfile} />}
        footer={profileFooter}
        profileActions={profileActions}
        profileIntro={profileIntro}
        shareButton={shareButton}
        shareDialog={shareDialog}
        style={themeStyle(currentProfile.theme)}
      />
    );
  }

  const bannerMedia = bannerImageUrl ? (
    <div className="banner-hero-image-wrap">
      {isVideoMedia(bannerImageUrl) ? (
        <video
          autoPlay
          className="banner-hero-image"
          loop
          muted
          playsInline
          src={bannerImageUrl}
        />
      ) : (
        <img alt="" className="banner-hero-image" src={bannerImageUrl} />
      )}
    </div>
  ) : null;

  if (currentProfile.theme.layout === "info") {
    return (
      <ProfileInfoLayout
        avatar={profileAvatar}
        bannerMedia={bannerMedia}
        bio={
          currentProfile.bio.trim() ? (
            <p className="bio">{currentProfile.bio}</p>
          ) : null
        }
        footer={profileFooter}
        infoChips={<ProfileInfoChips profile={currentProfile} />}
        profileActions={profileActions}
        shareButton={shareButton}
        shareDialog={shareDialog}
        style={themeStyle(currentProfile.theme)}
        titleBlock={profileTitleBlock}
      />
    );
  }

  return (
    <ProfileClassicLayout
      avatar={profileAvatar}
      bannerMedia={bannerMedia}
      footer={profileFooter}
      profileActions={profileActions}
      profileIntro={profileIntro}
      shareButton={shareButton}
      shareDialog={shareDialog}
      style={themeStyle(currentProfile.theme)}
    />
  );
}
