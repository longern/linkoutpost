import type { Dispatch, SetStateAction } from "react";
import { uploadProfileAsset } from "../../apiClient";
import { saveLocalAsset } from "../../localEditorStore";
import {
  profileMediaUploadMaxBytes,
  thumbnailUploadMaxBytes,
  thumbnailSourceMaxBytes,
  type ProfileAssetKind,
} from "../../media/config";
import {
  prepareAvatarFile,
  prepareProfileImageFile,
  prepareThumbnailFile,
} from "../../media/imageProcessing";
import type { LinkProfile } from "../../profile";
import type { EditorMode } from "./useEditorAssetUrls";

type EditorMediaActionsOptions = {
  autosaveProfile(profile: LinkProfile): Promise<void>;
  mode: EditorMode;
  profile: LinkProfile;
  setProfile: Dispatch<SetStateAction<LinkProfile>>;
  setStatus: Dispatch<SetStateAction<string>>;
};

export function createEditorMediaActions({
  autosaveProfile,
  mode,
  profile,
  setProfile,
  setStatus,
}: EditorMediaActionsOptions) {
  async function storeAsset(
    file: File,
    kind: ProfileAssetKind,
  ): Promise<string> {
    return mode === "backend"
      ? uploadProfileAsset(file, kind)
      : (await saveLocalAsset(file)).id;
  }

  function commit(nextProfile: LinkProfile): void {
    setProfile(nextProfile);
    void autosaveProfile(nextProfile);
  }

  async function onLinkImageChange(
    id: string,
    file: File | null,
  ): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setStatus("Choose an image or video file");
      return;
    }

    try {
      const mediaFile = file.type.startsWith("image/")
        ? await prepareProfileImageFile(file)
        : file;
      if (mediaFile.size > profileMediaUploadMaxBytes) {
        setStatus("Media card must be 10 MB or smaller");
        return;
      }
      const imageAssetId = await storeAsset(mediaFile, "link");
      commit({
        ...profile,
        links: profile.links.map((link) =>
          link.id === id ? { ...link, imageAssetId } : link,
        ),
        updatedAt: new Date().toISOString(),
      });
      setStatus(mode === "backend" ? "Media uploaded" : "Media saved locally");
    } catch {
      setStatus(
        mode === "backend"
          ? "Media upload failed"
          : "This browser cannot save local media",
      );
    }
  }

  async function onLinkThumbnailChange(
    id: string,
    file: File | null,
  ): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file");
      return;
    }
    if (file.size > thumbnailSourceMaxBytes) {
      setStatus("Thumbnail source must be 2 MB or smaller");
      return;
    }

    try {
      const thumbnailFile = await prepareThumbnailFile(file);
      if (thumbnailFile.size > thumbnailUploadMaxBytes) {
        setStatus("Thumbnail must be 512 KB or smaller");
        return;
      }
      const thumbnailAssetId = await storeAsset(thumbnailFile, "thumbnail");
      commit({
        ...profile,
        links: profile.links.map((link) =>
          link.id === id
            ? {
                ...link,
                thumbnailAssetId,
                thumbnailHidden: false,
                thumbnailUrl: null,
              }
            : link,
        ),
        updatedAt: new Date().toISOString(),
      });
      setStatus(
        mode === "backend"
          ? "Thumbnail uploaded"
          : "Thumbnail saved locally",
      );
    } catch {
      setStatus(
        mode === "backend"
          ? "Thumbnail upload failed"
          : "This browser cannot save the thumbnail",
      );
    }
  }

  function onLinkThumbnailRemove(id: string): void {
    commit({
      ...profile,
      links: profile.links.map((link) =>
        link.id === id
          ? {
              ...link,
              thumbnailAssetId: null,
              thumbnailHidden: true,
              thumbnailUrl: null,
            }
          : link,
      ),
      updatedAt: new Date().toISOString(),
    });
    setStatus("Thumbnail removed");
  }

  async function onAvatarChange(file: File | null): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file");
      return;
    }

    try {
      const avatarAssetId = await storeAsset(
        await prepareAvatarFile(file),
        "avatar",
      );
      commit({
        ...profile,
        avatarAssetId,
        updatedAt: new Date().toISOString(),
      });
      setStatus(mode === "backend" ? "Image uploaded" : "Image saved locally");
    } catch {
      setStatus(
        mode === "backend"
          ? "Image upload failed"
          : "This browser cannot save local images",
      );
    }
  }

  async function onBackgroundChange(file: File | null): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file");
      return;
    }

    try {
      const backgroundAssetId = await storeAsset(
        await prepareProfileImageFile(file),
        "background",
      );
      commit({
        ...profile,
        theme: { ...profile.theme, backgroundAssetId },
        updatedAt: new Date().toISOString(),
      });
      setStatus(
        mode === "backend" ? "Background uploaded" : "Background saved locally",
      );
    } catch {
      setStatus(
        mode === "backend"
          ? "Background upload failed"
          : "This browser cannot save local images",
      );
    }
  }

  function onBackgroundRemove(): void {
    commit({
      ...profile,
      theme: { ...profile.theme, backgroundAssetId: null },
      updatedAt: new Date().toISOString(),
    });
    setStatus("Background removed");
  }

  async function onBannerImageChange(file: File | null): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setStatus("Choose an image or video file");
      return;
    }

    try {
      const bannerFile = file.type.startsWith("image/")
        ? await prepareProfileImageFile(file)
        : file;
      if (bannerFile.size > profileMediaUploadMaxBytes) {
        setStatus("Banner media must be 10 MB or smaller");
        return;
      }
      const bannerImageAssetId = await storeAsset(bannerFile, "banner");
      commit({
        ...profile,
        theme: { ...profile.theme, bannerImageAssetId },
        updatedAt: new Date().toISOString(),
      });
      setStatus(
        mode === "backend"
          ? "Banner image uploaded"
          : "Banner image saved locally",
      );
    } catch {
      setStatus(
        mode === "backend"
          ? "Banner image upload failed"
          : "This browser cannot save local images",
      );
    }
  }

  function onBannerImageRemove(): void {
    commit({
      ...profile,
      theme: { ...profile.theme, bannerImageAssetId: null },
      updatedAt: new Date().toISOString(),
    });
    setStatus("Banner image removed");
  }

  return {
    onAvatarChange,
    onBackgroundChange,
    onBackgroundRemove,
    onBannerImageChange,
    onBannerImageRemove,
    onLinkImageChange,
    onLinkThumbnailChange,
    onLinkThumbnailRemove,
  };
}
