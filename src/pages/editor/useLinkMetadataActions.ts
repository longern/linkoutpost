import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { resolveLinkMetadata } from "../../linkMetadata";
import { resolveOEmbed } from "../../oembed";
import type { LinkItem, LinkProfile } from "../../profile";
import type { EditorMode } from "./useEditorAssetUrls";

const metadataCooldownMs = 10_000;

type MetadataAttempt = {
  at: number;
  url: string;
};

type LinkMetadataActionsOptions = {
  autosaveProfile(profile: LinkProfile): Promise<void>;
  mode: EditorMode;
  profile: LinkProfile;
  setProfile: Dispatch<SetStateAction<LinkProfile>>;
  setStatus: Dispatch<SetStateAction<string>>;
};

function isFetchableUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function useLinkMetadataActions({
  autosaveProfile,
  mode,
  profile,
  setProfile,
  setStatus,
}: LinkMetadataActionsOptions) {
  const latestProfileRef = useRef(profile);
  const metadataAttemptsRef = useRef(new Map<string, MetadataAttempt>());
  const metadataRequestsRef = useRef(new Map<string, Promise<void>>());
  const embedAttemptsRef = useRef(new Map<string, MetadataAttempt>());
  const embedRequestsRef = useRef(new Map<string, Promise<void>>());

  useEffect(() => {
    latestProfileRef.current = profile;
  }, [profile]);

  function updateLinkState(
    id: string,
    update: (link: LinkItem) => LinkItem,
    persist = true,
  ): void {
    const current = latestProfileRef.current;
    const nextProfile = {
      ...current,
      links: current.links.map((link) => (link.id === id ? update(link) : link)),
      updatedAt: new Date().toISOString(),
    };
    latestProfileRef.current = nextProfile;
    setProfile(nextProfile);
    if (persist) void autosaveProfile(nextProfile);
  }

  function refreshLinkMetadata(id: string): Promise<void> {
    const link = latestProfileRef.current.links.find((item) => item.id === id);
    const url = link?.url.trim() ?? "";
    if (!link || link.type === "image" || !isFetchableUrl(url)) {
      return Promise.resolve();
    }

    const key = `${id}:${url}`;
    const existingRequest = metadataRequestsRef.current.get(key);
    if (existingRequest) return existingRequest;

    const previousAttempt = metadataAttemptsRef.current.get(id);
    if (
      previousAttempt?.url === url &&
      Date.now() - previousAttempt.at < metadataCooldownMs
    ) {
      return Promise.resolve();
    }

    metadataAttemptsRef.current.set(id, { at: Date.now(), url });
    const request = resolveLinkMetadata(url)
      .then((metadata) => {
        if (!metadata) return;
        const currentLink = latestProfileRef.current.links.find(
          (item) => item.id === id,
        );
        if (!currentLink || currentLink.url.trim() !== url) return;

        updateLinkState(id, (item) => ({
          ...item,
          embedAvailable: metadata.embedAvailable,
          embedHtml: metadata.embedAvailable ? item.embedHtml : null,
          embedMode:
            item.embedMode === "embed" && !metadata.embedAvailable
              ? "auto"
              : item.embedMode,
          embedProvider: metadata.embedAvailable ? item.embedProvider : null,
          label: item.label.trim() ? item.label : metadata.title,
          thumbnailUrl:
            item.thumbnailAssetId || item.thumbnailUrl || item.thumbnailHidden
              ? item.thumbnailUrl
              : metadata.faviconUrl,
        }));
      })
      .finally(() => {
        metadataRequestsRef.current.delete(key);
      });
    metadataRequestsRef.current.set(key, request);
    return request;
  }

  function setLinkUrl(id: string, url: string): void {
    const currentLink = latestProfileRef.current.links.find(
      (item) => item.id === id,
    );
    if (!currentLink || currentLink.url === url) return;

    updateLinkState(id, (item) => ({
      ...item,
      embedAvailable: false,
      embedHtml: null,
      embedMode: item.embedMode === "embed" ? "auto" : item.embedMode,
      embedProvider: null,
      thumbnailHidden: false,
      thumbnailUrl: null,
      url,
    }), false);
  }

  function setLinkEmbedMode(
    id: string,
    embedMode: NonNullable<LinkItem["embedMode"]>,
  ): Promise<void> {
    const link = latestProfileRef.current.links.find((item) => item.id === id);
    if (!link || link.type === "image") return Promise.resolve();

    if (embedMode !== "embed") {
      updateLinkState(id, (item) => ({ ...item, embedMode }), false);
      return Promise.resolve();
    }

    const url = link.url.trim();
    if (!link.embedAvailable || !isFetchableUrl(url)) return Promise.resolve();
    if (link.embedHtml && link.embedProvider) {
      updateLinkState(id, (item) => ({ ...item, embedMode: "embed" }));
      return Promise.resolve();
    }

    updateLinkState(id, (item) => ({ ...item, embedMode: "embed" }));
    const key = `${id}:${url}`;
    const existingRequest = embedRequestsRef.current.get(key);
    if (existingRequest) return existingRequest;

    const previousAttempt = embedAttemptsRef.current.get(id);
    if (
      previousAttempt?.url === url &&
      Date.now() - previousAttempt.at < metadataCooldownMs
    ) {
      return Promise.resolve();
    }

    embedAttemptsRef.current.set(id, { at: Date.now(), url });
    const request = resolveOEmbed(url, {
      allowDiscovery: true,
      useBackend: mode === "backend",
    })
      .then((embed) => {
        const currentLink = latestProfileRef.current.links.find(
          (item) => item.id === id,
        );
        if (!currentLink || currentLink.url.trim() !== url) return;

        if (!embed) {
          updateLinkState(id, (item) => ({
            ...item,
            embedAvailable: false,
            embedHtml: null,
            embedMode: item.embedMode === "embed" ? "auto" : item.embedMode,
            embedProvider: null,
          }));
          if (currentLink.embedMode === "embed") {
            setStatus("Embed unavailable; switched to Auto");
          }
          return;
        }

        updateLinkState(id, (item) => ({
          ...item,
          embedAvailable: true,
          embedHtml: embed.html,
          embedMode: item.embedMode,
          embedProvider: embed.provider,
          label: item.label.trim() ? item.label : embed.title,
        }));
        setStatus("Embed ready");
      })
      .catch(() => {
        const currentLink = latestProfileRef.current.links.find(
          (item) => item.id === id,
        );
        if (!currentLink || currentLink.url.trim() !== url) return;
        updateLinkState(id, (item) => ({
          ...item,
          embedAvailable: false,
          embedHtml: null,
          embedMode: item.embedMode === "embed" ? "auto" : item.embedMode,
          embedProvider: null,
        }));
        if (currentLink.embedMode === "embed") {
          setStatus("Embed unavailable; switched to Auto");
        }
      })
      .finally(() => {
        embedRequestsRef.current.delete(key);
      });
    embedRequestsRef.current.set(key, request);
    return request;
  }

  return {
    refreshLinkMetadata,
    setLinkEmbedMode,
    setLinkUrl,
  };
}
