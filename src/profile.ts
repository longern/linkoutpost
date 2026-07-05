import { siteTitle } from "./siteConfig";

export type LinkItem = {
  id: string;
  label: string;
  url: string;
};

export type SocialPlatform =
  | "bilibili"
  | "discord"
  | "facebook"
  | "instagram"
  | "github"
  | "youtube"
  | "tiktok"
  | "wechat"
  | "x"
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
  profileImageAssetId: string | null;
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

export { siteTitle } from "./siteConfig";

export function getProfileDocumentTitle(profile: LinkProfile | null): string {
  const name = profile?.title.trim();
  return name ? `${name} | ${siteTitle}` : siteTitle;
}

export function getProfileAvatarUrl(
  profile: LinkProfile | null,
): string | null {
  return getProfileAssetUrl(profile?.avatarAssetId ?? null);
}

export function getProfileAssetUrl(assetId: string | null): string | null {
  if (!assetId) return null;
  if (assetId.startsWith("data:image/") || assetId.startsWith("data:video/")) return assetId;
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
    id: "wechat",
    label: "WeChat",
    placeholder: "WeChat ID",
    urlPrefix: "",
  },
  {
    id: "bilibili",
    label: "Bilibili",
    placeholder: "space UID",
    urlPrefix: "https://space.bilibili.com/",
  },
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "username",
    urlPrefix: "https://instagram.com/",
  },
  {
    id: "github",
    label: "GitHub",
    placeholder: "username",
    urlPrefix: "https://github.com/",
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
    id: "discord",
    label: "Discord",
    placeholder: "username",
    urlPrefix: "https://discord.com/users/",
  },
  {
    id: "email",
    label: "Email",
    placeholder: "name@example.com",
    urlPrefix: "mailto:",
  },
  {
    id: "website",
    label: "Website",
    placeholder: "example.com",
    urlPrefix: "https://",
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
  profileImageAssetId: null,
  textColor: "#172033",
};

export const defaultProfile: LinkProfile = {
  handle: "your_handle",
  title: "",
  bio: "",
  avatarAssetId: null,
  links: [
    {
      id: "website",
      label: "Website",
      url: "https://example.com",
    },
  ],
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

export function isReservedPath(value: string): boolean {
  return ["admin", "api", "assets", "favicon.ico"].includes(value);
}
