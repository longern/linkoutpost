import { useEffect, useState } from "react";
import type { LinkProfile } from "../../profile";
import {
  resolveProfileAssetUrl,
  resolveProfileAvatarUrl,
} from "./profileAvatarUrl";

export type EditorMode = "loading" | "offline" | "backend";

function revokeObjectUrl(url: string | null): void {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function useEditorAssetUrls(profile: LinkProfile, mode: EditorMode) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [linkImageUrls, setLinkImageUrls] = useState<
    Record<string, string | null>
  >({});
  const allowLocalAssets = mode !== "backend";

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    resolveProfileAvatarUrl(profile, allowLocalAssets)
      .then((url) => {
        if (cancelled) {
          revokeObjectUrl(url);
          return;
        }
        objectUrl = url;
        setAvatarUrl(url);
      })
      .catch(() => {
        if (!cancelled) setAvatarUrl(null);
      });

    return () => {
      cancelled = true;
      revokeObjectUrl(objectUrl);
    };
  }, [allowLocalAssets, profile]);

  useEffect(() => {
    let cancelled = false;
    let nextBackgroundUrl: string | null = null;
    let nextBannerImageUrl: string | null = null;

    void Promise.all([
      resolveProfileAssetUrl(
        profile.theme.backgroundAssetId,
        allowLocalAssets,
      ),
      resolveProfileAssetUrl(
        profile.theme.bannerImageAssetId,
        allowLocalAssets,
      ),
    ])
      .then(([resolvedBackgroundUrl, resolvedBannerImageUrl]) => {
        if (cancelled) {
          revokeObjectUrl(resolvedBackgroundUrl);
          revokeObjectUrl(resolvedBannerImageUrl);
          return;
        }
        nextBackgroundUrl = resolvedBackgroundUrl;
        nextBannerImageUrl = resolvedBannerImageUrl;
        setBackgroundUrl(resolvedBackgroundUrl);
        setBannerImageUrl(resolvedBannerImageUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setBackgroundUrl(null);
          setBannerImageUrl(null);
        }
      });

    return () => {
      cancelled = true;
      revokeObjectUrl(nextBackgroundUrl);
      revokeObjectUrl(nextBannerImageUrl);
    };
  }, [
    allowLocalAssets,
    profile.theme.backgroundAssetId,
    profile.theme.bannerImageAssetId,
  ]);

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    void Promise.all(
      profile.links
        .filter((link) => link.type === "image" && link.imageAssetId)
        .map(async (link) => {
          const url = await resolveProfileAssetUrl(
            link.imageAssetId ?? null,
            allowLocalAssets,
          );
          if (url?.startsWith("blob:")) objectUrls.push(url);
          return [link.id, url] as const;
        }),
    )
      .then((entries) => {
        if (cancelled) {
          objectUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }
        setLinkImageUrls(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setLinkImageUrls({});
      });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [allowLocalAssets, profile.links]);

  return { avatarUrl, backgroundUrl, bannerImageUrl, linkImageUrls };
}
