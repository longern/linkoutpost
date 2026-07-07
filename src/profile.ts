import { hostedHandleMinLength, siteTitle } from "./siteConfig";

export type LinkItem = {
  id: string;
  imageAssetId?: string | null;
  label: string;
  type?: "link" | "image";
  url: string;
};

export type SocialPlatform =
  | "bilibili"
  | "bluesky"
  | "discord"
  | "facebook"
  | "instagram"
  | "github"
  | "linkedin"
  | "mastodon"
  | "medium"
  | "pinterest"
  | "qq"
  | "reddit"
  | "snapchat"
  | "spotify"
  | "substack"
  | "telegram"
  | "threads"
  | "twitch"
  | "youtube"
  | "tiktok"
  | "wechat"
  | "weibo"
  | "whatsapp"
  | "x"
  | "xiaohongshu"
  | "email"
  | "website";

export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  userId: string;
};

export type SocialPlatformDefinition = {
  id: SocialPlatform;
  label: string;
  placeholder: string;
  urlPrefix: string;
};

export type ProfileLayout = "classic" | "card";
export type SocialLinksPosition = "top" | "bottom";

export type ProfileCardField = {
  id: string;
  label: string;
  value: string;
};

export type ProfileTheme = {
  accentColor: string;
  backgroundAssetId: string | null;
  backgroundColor: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  cardFields: ProfileCardField[];
  fontFamily: string;
  layout: ProfileLayout;
  bannerImageAssetId: string | null;
  socialLinksPosition: SocialLinksPosition;
  textColor: string;
};

export type LinkProfile = {
  handle: string;
  title: string;
  bio: string;
  avatarAssetId: string | null;
  links: LinkItem[];
  socialLinks: SocialLink[];
  theme: ProfileTheme;
  updatedAt: string;
};

export { hostedHandleMinLength, siteTitle } from "./siteConfig";

export const defaultDocumentDescription =
  "Create a free hosted link page, export your profile data and page files, or deploy a rendered static page anywhere.";

export function getProfileDocumentTitle(profile: LinkProfile | null): string {
  const name = profile?.title.trim();
  return name ? `${name} | ${siteTitle}` : siteTitle;
}

export function getProfileDocumentDescription(
  profile: LinkProfile | null,
): string {
  return profile?.bio.trim() || defaultDocumentDescription;
}

export function getProfileAvatarUrl(
  profile: LinkProfile | null,
): string | null {
  return getProfileAssetUrl(profile?.avatarAssetId ?? null);
}

export function getProfileAssetUrl(assetId: string | null): string | null {
  if (!assetId) return null;
  if (assetId.startsWith("data:image/") || assetId.startsWith("data:video/"))
    return assetId;
  if (assetId.includes("/")) return `/api/files/${encodeURIComponent(assetId)}`;
  return null;
}

export const fontOptions = [
  {
    label: "System",
    value:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    label: "Serif",
    value: 'Georgia, "Times New Roman", serif',
  },
  {
    label: "Mono",
    value: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },
  {
    label: "Rounded",
    value: '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif',
  },
] as const;

export const socialPlatformDefinitions: SocialPlatformDefinition[] = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "username",
    urlPrefix: "https://instagram.com/",
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "@channel",
    urlPrefix: "https://youtube.com/",
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "@username",
    urlPrefix: "https://tiktok.com/",
  },
  {
    id: "x",
    label: "X",
    placeholder: "username",
    urlPrefix: "https://x.com/",
  },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "username",
    urlPrefix: "https://facebook.com/",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "username",
    urlPrefix: "https://linkedin.com/in/",
  },
  {
    id: "github",
    label: "GitHub",
    placeholder: "username",
    urlPrefix: "https://github.com/",
  },
  {
    id: "wechat",
    label: "WeChat",
    placeholder: "WeChat ID",
    urlPrefix: "",
  },
  {
    id: "xiaohongshu",
    label: "Xiaohongshu",
    placeholder: "user ID",
    urlPrefix: "https://www.xiaohongshu.com/user/profile/",
  },
  {
    id: "bilibili",
    label: "Bilibili",
    placeholder: "space UID",
    urlPrefix: "https://space.bilibili.com/",
  },
  {
    id: "weibo",
    label: "Weibo",
    placeholder: "profile ID",
    urlPrefix: "https://weibo.com/u/",
  },
  {
    id: "qq",
    label: "QQ",
    placeholder: "QQ number",
    urlPrefix: "https://qm.qq.com/q/",
  },
  {
    id: "reddit",
    label: "Reddit",
    placeholder: "username",
    urlPrefix: "https://reddit.com/user/",
  },
  {
    id: "threads",
    label: "Threads",
    placeholder: "username",
    urlPrefix: "https://threads.net/@",
  },
  {
    id: "telegram",
    label: "Telegram",
    placeholder: "username",
    urlPrefix: "https://t.me/",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    placeholder: "phone number",
    urlPrefix: "https://wa.me/",
  },
  {
    id: "discord",
    label: "Discord",
    placeholder: "username",
    urlPrefix: "https://discord.com/users/",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    placeholder: "username",
    urlPrefix: "https://pinterest.com/",
  },
  {
    id: "snapchat",
    label: "Snapchat",
    placeholder: "username",
    urlPrefix: "https://snapchat.com/add/",
  },
  {
    id: "spotify",
    label: "Spotify",
    placeholder: "artist/user ID",
    urlPrefix: "https://open.spotify.com/user/",
  },
  {
    id: "twitch",
    label: "Twitch",
    placeholder: "username",
    urlPrefix: "https://twitch.tv/",
  },
  {
    id: "bluesky",
    label: "Bluesky",
    placeholder: "handle.bsky.social",
    urlPrefix: "https://bsky.app/profile/",
  },
  {
    id: "medium",
    label: "Medium",
    placeholder: "username",
    urlPrefix: "https://medium.com/@",
  },
  {
    id: "substack",
    label: "Substack",
    placeholder: "subdomain",
    urlPrefix: "https://",
  },
  {
    id: "mastodon",
    label: "Mastodon",
    placeholder: "instance/@username",
    urlPrefix: "https://",
  },
  {
    id: "website",
    label: "Website",
    placeholder: "example.com",
    urlPrefix: "https://",
  },
  {
    id: "email",
    label: "Email",
    placeholder: "name@example.com",
    urlPrefix: "mailto:",
  },
];

export function getSocialPlatformDefinition(
  platform: SocialPlatform,
): SocialPlatformDefinition {
  return (
    socialPlatformDefinitions.find(
      (definition) => definition.id === platform,
    ) ?? socialPlatformDefinitions[0]
  );
}

export function normalizeSocialUserId(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^@+/, "");
}

export function getSocialLinkUrl(socialLink: SocialLink): string {
  const definition = getSocialPlatformDefinition(socialLink.platform);
  const userId = normalizeSocialUserId(socialLink.userId);
  if (!userId) return definition.urlPrefix;
  if (socialLink.platform === "email")
    return `${definition.urlPrefix}${userId}`;
  return `${definition.urlPrefix}${userId}`;
}

export const defaultTheme: ProfileTheme = {
  accentColor: "#2563eb",
  backgroundAssetId: null,
  backgroundColor: "#ffffff",
  buttonBackgroundColor: "#ffffff",
  buttonTextColor: "#172033",
  cardFields: [
    { id: "location", label: "Location", value: "" },
    { id: "role", label: "Role", value: "" },
  ],
  fontFamily: fontOptions[0].value,
  layout: "classic",
  bannerImageAssetId: null,
  socialLinksPosition: "top",
  textColor: "#172033",
};

export const defaultProfile: LinkProfile = {
  handle: "",
  title: "",
  bio: "",
  avatarAssetId: null,
  links: [],
  socialLinks: [],
  theme: defaultTheme,
  updatedAt: new Date(0).toISOString(),
};

export function createProfile(
  overrides: Partial<LinkProfile> = {},
): LinkProfile {
  return {
    ...defaultProfile,
    ...overrides,
    links: overrides.links ?? defaultProfile.links,
    socialLinks: overrides.socialLinks ?? defaultProfile.socialLinks,
    theme: {
      ...defaultTheme,
      ...overrides.theme,
    },
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

export function normalizeHandle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function isHostedHandleTooShort(handle: string): boolean {
  return handle.length > 0 && handle.length < hostedHandleMinLength;
}

export function isReservedPath(value: string): boolean {
  return [
    "admin",
    "api",
    "assets",
    "favicon.ico",
    "license",
    "privacy",
    "terms",
  ].includes(value);
}
