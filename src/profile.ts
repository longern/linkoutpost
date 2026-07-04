export type LinkItem = {
  id: string;
  label: string;
  url: string;
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
  textColor: string;
};

export type LinkProfile = {
  handle: string;
  title: string;
  bio: string;
  avatarAssetId: string | null;
  links: LinkItem[];
  theme: ProfileTheme;
  updatedAt: string;
};

export const siteTitle = "LinkOutpost";

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
  if (assetId.startsWith("data:image/")) return assetId;
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
