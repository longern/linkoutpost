import { uploadProfileAsset } from "../../apiClient";
import { saveLocalAsset } from "../../localEditorStore";
import type { ProfileAssetKind } from "../../media/config";
import {
  prepareAvatarFile,
  prepareProfileImageFile,
  prepareThumbnailFile,
} from "../../media/imageProcessing";
import { createProfile, type LinkProfile } from "../../profile";
import type {
  ImportedStaticAsset,
  ImportedStaticProfile,
} from "../../staticImport";
import type { EditorMode } from "./useEditorAssetUrls";

async function storeImportedAsset(
  asset: ImportedStaticAsset,
  kind: ProfileAssetKind,
  mode: EditorMode,
): Promise<string> {
  let file = new File([asset.blob], asset.name, { type: asset.type });
  if (file.type.startsWith("image/")) {
    file =
      kind === "avatar"
        ? await prepareAvatarFile(file)
        : kind === "thumbnail"
          ? await prepareThumbnailFile(file)
          : await prepareProfileImageFile(file);
  }

  return mode === "backend"
    ? uploadProfileAsset(file, kind)
    : (await saveLocalAsset(file)).id;
}

export async function prepareImportedProfile(
  imported: ImportedStaticProfile,
  handle: string,
  mode: EditorMode,
): Promise<LinkProfile> {
  const fallbackAvatarAssetId = imported.profile.avatarAssetId?.startsWith(
    "data:image/",
  )
    ? imported.profile.avatarAssetId
    : null;
  const fallbackBackgroundAssetId =
    imported.profile.theme.backgroundAssetId?.startsWith("data:image/")
      ? imported.profile.theme.backgroundAssetId
      : null;
  const fallbackBannerImageAssetId =
    imported.profile.theme.bannerImageAssetId?.startsWith("data:image/") ||
    imported.profile.theme.bannerImageAssetId?.startsWith("data:video/")
      ? imported.profile.theme.bannerImageAssetId
      : null;
  let nextProfile = createProfile({
    ...imported.profile,
    handle,
    avatarAssetId: fallbackAvatarAssetId,
    theme: {
      ...imported.profile.theme,
      backgroundAssetId: fallbackBackgroundAssetId,
      bannerImageAssetId: fallbackBannerImageAssetId,
    },
    updatedAt: new Date().toISOString(),
  });

  if (imported.avatar) {
    nextProfile = {
      ...nextProfile,
      avatarAssetId: await storeImportedAsset(imported.avatar, "avatar", mode),
    };
  }

  if (imported.background) {
    nextProfile = {
      ...nextProfile,
      theme: {
        ...nextProfile.theme,
        backgroundAssetId: await storeImportedAsset(
          imported.background,
          "background",
          mode,
        ),
      },
    };
  }

  if (imported.bannerImage) {
    nextProfile = {
      ...nextProfile,
      theme: {
        ...nextProfile.theme,
        bannerImageAssetId: await storeImportedAsset(
          imported.bannerImage,
          "banner",
          mode,
        ),
      },
    };
  }

  const linkImageAssetIds = new Map<string, string>();
  for (const [linkId, asset] of Object.entries(imported.linkImages)) {
    linkImageAssetIds.set(
      linkId,
      await storeImportedAsset(asset, "link", mode),
    );
  }

  const linkThumbnailAssetIds = new Map<string, string>();
  for (const [linkId, asset] of Object.entries(imported.linkThumbnails)) {
    linkThumbnailAssetIds.set(
      linkId,
      await storeImportedAsset(asset, "thumbnail", mode),
    );
  }

  if (linkImageAssetIds.size > 0 || linkThumbnailAssetIds.size > 0) {
    nextProfile = {
      ...nextProfile,
      links: nextProfile.links.map((link) => {
        const imageAssetId = linkImageAssetIds.get(link.id);
        const thumbnailAssetId = linkThumbnailAssetIds.get(link.id);
        return imageAssetId || thumbnailAssetId
          ? {
              ...link,
              imageAssetId: imageAssetId ?? link.imageAssetId,
              thumbnailAssetId: thumbnailAssetId ?? link.thumbnailAssetId,
            }
          : link;
      }),
    };
  }

  return nextProfile;
}

export async function exportStaticProfile(
  profile: LinkProfile,
  mode: EditorMode,
): Promise<void> {
  const { buildStaticZip } = await import("../../staticExport");
  const blob = await buildStaticZip(
    profile,
    mode === "backend" ? "backend" : "local",
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${profile.handle || "linkoutpost"}.zip`;
  link.click();
  URL.revokeObjectURL(url);
}
