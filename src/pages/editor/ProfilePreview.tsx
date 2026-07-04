import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import type { LinkProfile } from "../../profile";
import { ProfilePage } from "../../PublicProfile";
import {
  resolveProfileAssetUrl,
  resolveProfileAvatarUrl,
} from "./profileAvatarUrl";

function useProfileAvatarUrl(profile: LinkProfile, allowLocalAssets: boolean): string | null {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    resolveProfileAvatarUrl(profile, allowLocalAssets)
      .then((url) => {
        if (!cancelled) setAvatarUrl(url);
      })
      .catch(() => {
        if (!cancelled) setAvatarUrl(null);
      });

    return () => {
      cancelled = true;
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

    resolveProfileAssetUrl(profile.theme.backgroundAssetId, allowLocalAssets)
      .then((url) => {
        if (!cancelled) setBackgroundUrl(url);
      })
      .catch(() => {
        if (!cancelled) setBackgroundUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [allowLocalAssets, profile]);

  return backgroundUrl;
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
        profile={profile}
      />
    </div>
  );
}
