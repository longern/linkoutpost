export type LinkItem = {
  id: string;
  label: string;
  url: string;
};

export type LinkProfile = {
  handle: string;
  title: string;
  bio: string;
  avatarAssetId: string | null;
  links: LinkItem[];
  updatedAt: string;
};

export const defaultProfile: LinkProfile = {
  handle: "your_handle",
  title: "Your Name",
  bio: "One page for every link that matters.",
  avatarAssetId: null,
  links: [
    {
      id: "website",
      label: "Website",
      url: "https://example.com"
    }
  ],
  updatedAt: new Date(0).toISOString()
};

export function createProfile(overrides: Partial<LinkProfile> = {}): LinkProfile {
  return {
    ...defaultProfile,
    ...overrides,
    links: overrides.links ?? defaultProfile.links,
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
