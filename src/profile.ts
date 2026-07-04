import { brandTheme } from "./theme";

export type LinkItem = {
  id: string;
  label: string;
  url: string;
};

export type ProfileTheme = {
  accentColor: string;
  backgroundColor: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  fontFamily: string;
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

export function getProfileAvatarUrl(profile: LinkProfile | null): string | null {
  const avatarAssetId = profile?.avatarAssetId;
  if (!avatarAssetId) return null;
  if (avatarAssetId.startsWith("data:image/")) return avatarAssetId;
  if (avatarAssetId.startsWith("avatars/")) return `/api/files/${encodeURIComponent(avatarAssetId)}`;
  return null;
}

export const fontOptions = [
  {
    label: "System",
    value: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
  },
  {
    label: "Serif",
    value: "Georgia, \"Times New Roman\", serif"
  },
  {
    label: "Mono",
    value: "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace"
  },
  {
    label: "Rounded",
    value: "\"Arial Rounded MT Bold\", \"Trebuchet MS\", sans-serif"
  }
] as const;

export const defaultTheme: ProfileTheme = {
  accentColor: brandTheme.accent,
  backgroundColor: "#ffffff",
  buttonBackgroundColor: brandTheme.raisedBackground,
  buttonTextColor: brandTheme.text,
  fontFamily: fontOptions[0].value,
  textColor: brandTheme.text
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
      url: "https://example.com"
    }
  ],
  theme: defaultTheme,
  updatedAt: new Date(0).toISOString()
};

export function createProfile(overrides: Partial<LinkProfile> = {}): LinkProfile {
  return {
    ...defaultProfile,
    ...overrides,
    links: overrides.links ?? defaultProfile.links,
    theme: {
      ...defaultTheme,
      ...overrides.theme
    },
    updatedAt: overrides.updatedAt ?? new Date().toISOString()
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
