import { strFromU8, unzipSync } from "fflate";
import { createProfile, type LinkProfile } from "./profile";

type ExportManifest = {
  app?: string;
  assets?: {
    avatar?: string | null;
    background?: string | null;
    profileImage?: string | null;
  };
  profile?: Partial<LinkProfile>;
  version?: number;
};

type ZipFiles = Record<string, Uint8Array>;

export type ImportedStaticAsset = {
  blob: Blob;
  name: string;
  type: string;
};

export type ImportedStaticProfile = {
  avatar: ImportedStaticAsset | null;
  background: ImportedStaticAsset | null;
  profileImage: ImportedStaticAsset | null;
  profile: LinkProfile;
};

function readJsonFile<T>(files: ZipFiles, path: string): T | null {
  const bytes = files[path];
  if (!bytes) return null;

  try {
    return JSON.parse(strFromU8(bytes)) as T;
  } catch {
    return null;
  }
}

function contentTypeFromPath(path: string): string {
  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith(".png")) return "image/png";
  if (lowerPath.endsWith(".webp")) return "image/webp";
  if (lowerPath.endsWith(".gif")) return "image/gif";
  if (lowerPath.endsWith(".svg")) return "image/svg+xml";
  if (lowerPath.endsWith(".mp4")) return "video/mp4";
  if (lowerPath.endsWith(".webm")) return "video/webm";
  if (lowerPath.endsWith(".ogv") || lowerPath.endsWith(".ogg")) return "video/ogg";
  if (lowerPath.endsWith(".mov")) return "video/quicktime";
  return "image/jpeg";
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function readAsset(
  files: ZipFiles,
  path: string | null | undefined,
): ImportedStaticAsset | null {
  if (!path || !files[path]) return null;

  const type = contentTypeFromPath(path);
  return {
    blob: new Blob([toArrayBuffer(files[path])], { type }),
    name: path.split("/").pop() ?? path,
    type,
  };
}

export async function readProfileFromStaticZip(file: File): Promise<ImportedStaticProfile> {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const manifest = readJsonFile<ExportManifest>(files, "linkoutpost-export.json");

  if (manifest?.app !== "linkoutpost" || manifest.version !== 1 || !manifest.profile) {
    throw new Error("This ZIP does not contain a LinkOutpost export.");
  }

  const profile = createProfile(manifest.profile);
  const avatarPath = manifest.assets?.avatar;
  const backgroundPath = manifest.assets?.background;
  const profileImagePath = manifest.assets?.profileImage;

  return {
    avatar: readAsset(files, avatarPath),
    background: readAsset(files, backgroundPath),
    profileImage: readAsset(files, profileImagePath),
    profile: createProfile({
      ...profile,
      updatedAt: new Date().toISOString(),
    }),
  };
}
