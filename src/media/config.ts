export type ProfileAssetKind = "avatar" | "background" | "banner" | "link";

export const avatarMaxDimension = 512;
export const avatarCompressionThresholdBytes = 256 * 1024;
export const profileImageMaxDimension = 1920;
export const imageUploadMaxBytes = 2 * 1024 * 1024;
export const profileMediaUploadMaxBytes = 10 * 1024 * 1024;

const assetFolders: Record<ProfileAssetKind, string> = {
  avatar: "avatars",
  background: "backgrounds",
  banner: "profiles",
  link: "links",
};

export function isProfileAssetKind(value: unknown): value is ProfileAssetKind {
  return (
    value === "avatar" ||
    value === "background" ||
    value === "banner" ||
    value === "link"
  );
}

export function isProfileMediaKind(kind: ProfileAssetKind): boolean {
  return kind === "banner" || kind === "link";
}

export function getProfileAssetFolder(kind: ProfileAssetKind): string {
  return assetFolders[kind];
}

export function getProfileAssetMaxBytes(kind: ProfileAssetKind): number {
  return isProfileMediaKind(kind)
    ? profileMediaUploadMaxBytes
    : imageUploadMaxBytes;
}

export function acceptsProfileAssetType(
  kind: ProfileAssetKind,
  contentType: string,
): boolean {
  return (
    contentType.startsWith("image/") ||
    (isProfileMediaKind(kind) && contentType.startsWith("video/"))
  );
}

export function mediaExtension(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/svg+xml") return "svg";
  if (contentType === "video/mp4") return "mp4";
  if (contentType === "video/webm") return "webm";
  if (contentType === "video/ogg") return "ogv";
  if (contentType === "video/quicktime") return "mov";
  return "jpg";
}

export function contentTypeFromPath(path: string): string {
  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith(".png")) return "image/png";
  if (lowerPath.endsWith(".webp")) return "image/webp";
  if (lowerPath.endsWith(".gif")) return "image/gif";
  if (lowerPath.endsWith(".svg")) return "image/svg+xml";
  if (lowerPath.endsWith(".mp4")) return "video/mp4";
  if (lowerPath.endsWith(".webm")) return "video/webm";
  if (lowerPath.endsWith(".ogv") || lowerPath.endsWith(".ogg")) {
    return "video/ogg";
  }
  if (lowerPath.endsWith(".mov")) return "video/quicktime";
  return "image/jpeg";
}
