import { strFromU8, unzipSync } from "fflate";
import { createProfile, type LinkProfile } from "./profile";
import { contentTypeFromPath } from "./media/config";

type ExportManifest = {
  app?: string;
  assets?: {
    avatar?: string | null;
    background?: string | null;
    bannerImage?: string | null;
    linkImages?: Record<string, string | null>;
    linkThumbnails?: Record<string, string | null>;
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
  bannerImage: ImportedStaticAsset | null;
  linkImages: Record<string, ImportedStaticAsset>;
  linkThumbnails: Record<string, ImportedStaticAsset>;
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
  const bannerImagePath = manifest.assets?.bannerImage;
  const linkImagePaths = manifest.assets?.linkImages ?? {};
  const linkThumbnailPaths = manifest.assets?.linkThumbnails ?? {};

  return {
    avatar: readAsset(files, avatarPath),
    background: readAsset(files, backgroundPath),
    bannerImage: readAsset(files, bannerImagePath),
    linkImages: Object.fromEntries(
      Object.entries(linkImagePaths)
        .map(([id, path]) => [id, readAsset(files, path)])
        .filter((entry): entry is [string, ImportedStaticAsset] => Boolean(entry[1])),
    ),
    linkThumbnails: Object.fromEntries(
      Object.entries(linkThumbnailPaths)
        .map(([id, path]) => [id, readAsset(files, path)])
        .filter((entry): entry is [string, ImportedStaticAsset] => Boolean(entry[1])),
    ),
    profile: createProfile({
      ...profile,
      updatedAt: new Date().toISOString(),
    }),
  };
}
