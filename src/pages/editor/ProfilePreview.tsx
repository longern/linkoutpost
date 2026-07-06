import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import type { LinkProfile } from "../../profile";
import { ProfilePage } from "../../PublicProfile";
import {
  resolveProfileAssetUrl,
  resolveProfileAvatarUrl,
} from "./profileAvatarUrl";

function revokeObjectUrl(url: string | null): void {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

function useProfileAvatarUrl(profile: LinkProfile, allowLocalAssets: boolean): string | null {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

  return avatarUrl;
}

function useProfileBackgroundUrl(
  profile: LinkProfile,
  allowLocalAssets: boolean,
): string | null {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    let objectUrl: string | null = null;

    resolveProfileAssetUrl(profile.theme.backgroundAssetId, allowLocalAssets)
      .then((url) => {
        if (cancelled) {
          revokeObjectUrl(url);
          return;
        }
        objectUrl = url;
        setBackgroundUrl(url);
      })
      .catch(() => {
        if (!cancelled) setBackgroundUrl(null);
      });

    return () => {
      cancelled = true;
      revokeObjectUrl(objectUrl);
    };
  }, [allowLocalAssets, profile]);

  return backgroundUrl;
}

function useBannerImageUrl(
  profile: LinkProfile,
  allowLocalAssets: boolean,
): string | null {
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    let objectUrl: string | null = null;

    resolveProfileAssetUrl(profile.theme.bannerImageAssetId, allowLocalAssets)
      .then((url) => {
        if (cancelled) {
          revokeObjectUrl(url);
          return;
        }
        objectUrl = url;
        setBannerImageUrl(url);
      })
      .catch(() => {
        if (!cancelled) setBannerImageUrl(null);
      });

    return () => {
      cancelled = true;
      revokeObjectUrl(objectUrl);
    };
  }, [allowLocalAssets, profile]);

  return bannerImageUrl;
}

function useLinkImageUrls(
  profile: LinkProfile,
  allowLocalAssets: boolean,
): Record<string, string | null> {
  const [linkImageUrls, setLinkImageUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    Promise.all(
      profile.links
        .filter((link) => link.type === "image" && link.imageAssetId)
        .map(async (link) => {
          const url = await resolveProfileAssetUrl(link.imageAssetId ?? null, allowLocalAssets);
          if (url?.startsWith("blob:")) objectUrls.push(url);
          return [link.id, url] as const;
        }),
    )
      .then((entries) => {
        if (cancelled) {
          objectUrls.forEach(revokeObjectUrl);
          return;
        }
        setLinkImageUrls(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setLinkImageUrls({});
      });

    return () => {
      cancelled = true;
      objectUrls.forEach(revokeObjectUrl);
    };
  }, [allowLocalAssets, profile.links]);

  return linkImageUrls;
}

export function ProfilePreview({
  allowLocalAssets,
  profile,
}: {
  allowLocalAssets: boolean;
  profile: LinkProfile;
}) {
  const avatarUrl = useProfileAvatarUrl(profile, allowLocalAssets);
  const backgroundUrl = useProfileBackgroundUrl(profile, allowLocalAssets);
  const bannerImageUrl = useBannerImageUrl(profile, allowLocalAssets);
  const linkImageUrls = useLinkImageUrls(profile, allowLocalAssets);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const previousLinkRects = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const previewElement = previewRef.current;
    if (!previewElement) return;

    const nextRects = new Map<string, DOMRect>();
    const linkElements = previewElement.querySelectorAll<HTMLElement>(
      "[data-profile-link-id]",
    );

    linkElements.forEach((node) => {
      const id = node.dataset.profileLinkId;
      if (!id) return;

      const previousRect = previousLinkRects.current.get(id);
      const nextRect = node.getBoundingClientRect();
      nextRects.set(id, nextRect);

      if (!previousRect) return;

      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;
      if (deltaX === 0 && deltaY === 0) return;

      node.style.transition = "none";
      node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      node.getBoundingClientRect();

      requestAnimationFrame(() => {
        node.style.transition = "";
        node.style.transform = "";
      });
    });

    previousLinkRects.current = nextRects;
  }, [profile.links]);

  return (
    <section className="preview" aria-label="Profile preview">
      <div className="preview-frame" ref={previewRef}>
        <ProfilePage
          avatarUrl={avatarUrl}
          backgroundUrl={backgroundUrl}
          bannerImageUrl={bannerImageUrl}
          linkImageUrls={linkImageUrls}
          profile={profile}
          shareEnabled={false}
        />
      </div>
    </section>
  );
}

export function FullscreenProfilePreview({
  allowLocalAssets,
  onBack,
  profile,
}: {
  allowLocalAssets: boolean;
  onBack(): void;
  profile: LinkProfile;
}) {
  const avatarUrl = useProfileAvatarUrl(profile, allowLocalAssets);
  const backgroundUrl = useProfileBackgroundUrl(profile, allowLocalAssets);
  const bannerImageUrl = useBannerImageUrl(profile, allowLocalAssets);
  const linkImageUrls = useLinkImageUrls(profile, allowLocalAssets);

  return (
    <div className="editor-full-preview">
      <button
        aria-label="Back to editor"
        className="circle-icon-button full-preview-back"
        onClick={onBack}
        title="Back to editor"
        type="button"
      >
        <FaArrowLeft aria-hidden="true" size={20} />
      </button>
      <ProfilePage
        avatarUrl={avatarUrl}
        backgroundUrl={backgroundUrl}
        bannerImageUrl={bannerImageUrl}
        linkImageUrls={linkImageUrls}
        profile={profile}
      />
    </div>
  );
}
