import type { Dispatch, SetStateAction } from "react";
import { resolveOEmbed } from "../../oembed";
import type {
  LinkItem,
  LinkProfile,
  ProfileTheme,
} from "../../profile";
import type { EditorMode } from "./useEditorAssetUrls";

type EditorProfileActionsOptions = {
  autosaveProfile(profile: LinkProfile): Promise<void>;
  mode: EditorMode;
  profile: LinkProfile;
  setProfile: Dispatch<SetStateAction<LinkProfile>>;
};

export function createEditorProfileActions({
  autosaveProfile,
  mode,
  profile,
  setProfile,
}: EditorProfileActionsOptions) {
  function commit(nextProfile: LinkProfile): void {
    setProfile(nextProfile);
    void autosaveProfile(nextProfile);
  }

  function withUpdatedAt(nextProfile: LinkProfile): LinkProfile {
    return { ...nextProfile, updatedAt: new Date().toISOString() };
  }

  function saveCurrentProfile(): void {
    void autosaveProfile(profile);
  }

  function updateProfile(patch: Partial<LinkProfile>): void {
    setProfile((current) => withUpdatedAt({ ...current, ...patch }));
  }

  function commitProfile(patch: Partial<LinkProfile>): void {
    commit(withUpdatedAt({ ...profile, ...patch }));
  }

  function updateLink(id: string, patch: Partial<LinkItem>): void {
    updateProfile({
      links: profile.links.map((link) =>
        link.id === id ? { ...link, ...patch } : link,
      ),
    });
  }

  function updateTheme(patch: Partial<ProfileTheme>): void {
    updateProfile({ theme: { ...profile.theme, ...patch } });
  }

  function commitTheme(patch: Partial<ProfileTheme>): void {
    commit(
      withUpdatedAt({
        ...profile,
        theme: { ...profile.theme, ...patch },
      }),
    );
  }

  function addLink(): void {
    commit(
      withUpdatedAt({
        ...profile,
        links: [
          ...profile.links,
          { id: crypto.randomUUID(), label: "", url: "" },
        ],
      }),
    );
  }

  function addImageCard(): void {
    commit(
      withUpdatedAt({
        ...profile,
        links: [
          ...profile.links,
          {
            id: crypto.randomUUID(),
            imageAssetId: null,
            label: "",
            type: "image",
            url: "",
          },
        ],
      }),
    );
  }

  function removeLink(id: string): void {
    commit(
      withUpdatedAt({
        ...profile,
        links: profile.links.filter((link) => link.id !== id),
      }),
    );
  }

  function toggleLinkVisibility(id: string): void {
    commit(
      withUpdatedAt({
        ...profile,
        links: profile.links.map((link) =>
          link.id === id ? { ...link, hidden: !link.hidden } : link,
        ),
      }),
    );
  }

  function saveLink(id: string): void {
    const link = profile.links.find((item) => item.id === id);
    if (!link || link.type === "image") {
      saveCurrentProfile();
      return;
    }

    if (link.embedMode === "link") {
      commit(
        withUpdatedAt({
          ...profile,
          links: profile.links.map((item) =>
            item.id === id
              ? { ...item, embedHtml: null, embedProvider: null }
              : item,
          ),
        }),
      );
      return;
    }

    void resolveOEmbed(link.url, {
      allowDiscovery: link.embedMode === "embed",
      useBackend: mode === "backend",
    }).then((embed) => {
      commit(
        withUpdatedAt({
          ...profile,
          links: profile.links.map((item) => {
            if (item.id !== id) return item;
            if (!embed) {
              return { ...item, embedHtml: null, embedProvider: null };
            }
            return {
              ...item,
              embedHtml: embed.html,
              embedProvider: embed.provider,
              label: item.label.trim() || embed.title,
            };
          }),
        }),
      );
    });
  }

  function commitLinks(links: LinkItem[]): void {
    commit(withUpdatedAt({ ...profile, links }));
  }

  return {
    addImageCard,
    addLink,
    commitLinks,
    commitProfile,
    commitTheme,
    removeLink,
    saveCurrentProfile,
    saveLink,
    toggleLinkVisibility,
    updateLink,
    updateProfile,
    updateTheme,
  };
}
