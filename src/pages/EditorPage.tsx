import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  ExternalLink,
  Menu,
  Settings,
  UserCircle,
} from "lucide-react";
import {
  loadMyProfile,
  loadMyProfiles,
  loadSession,
  saveProfile,
  uploadAvatar,
  uploadProfileImage,
} from "../apiClient";
import {
  readLocalProfile,
  saveLocalAsset,
  writeLocalProfile,
} from "../localEditorStore";
import {
  createProfile,
  isReservedPath,
  normalizeHandle,
  type LinkItem,
  type LinkProfile,
  type ProfileTheme,
} from "../profile";
import type { ProfileSummary, SessionState } from "../types";
import { DesignPanel } from "./editor/DesignPanel";
import { EditorSidebar, type EditorPanel } from "./editor/EditorSidebar";
import { HandleSetupDialog } from "./editor/HandleSetupDialog";
import { LayoutPanel } from "./editor/LayoutPanel";
import { LinksPanel } from "./editor/LinksPanel";
import { prepareAvatarFile } from "./editor/avatarImage";
import { resolveProfileAvatarUrl } from "./editor/profileAvatarUrl";
import {
  FullscreenProfilePreview,
  ProfilePreview,
} from "./editor/ProfilePreview";
import { ProfilePanel } from "./editor/ProfilePanel";

export function EditorPage({
  initialSession,
}: {
  initialSession: SessionState;
}) {
  const [session, setSession] = useState(initialSession);
  const [profile, setProfile] = useState<LinkProfile>(() => createProfile());
  const [profileSummaries, setProfileSummaries] = useState<ProfileSummary[]>(
    [],
  );
  const [mode, setMode] = useState<"loading" | "offline" | "backend">(
    "loading",
  );
  const [status, setStatus] = useState("Loading editor");
  const [activeEditorPanel, setActiveEditorPanel] = useState<EditorPanel>("profile");
  const [editorAvatarUrl, setEditorAvatarUrl] = useState<string | null>(null);
  const [dragLinks, setDragLinks] = useState<LinkItem[] | null>(null);
  const [handleSetupOpen, setHandleSetupOpen] = useState(false);
  const [handleDraft, setHandleDraft] = useState("");
  const [handleSetupError, setHandleSetupError] = useState<string | null>(null);
  const [handleSetupSaving, setHandleSetupSaving] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.location.pathname === "/admin/preview",
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const nextSession = await loadSession();
        if (cancelled) return;
        setSession(nextSession);

        if (!nextSession.authenticated || nextSession.storage !== "backend") {
          const offlineProfile = await readLocalProfile();
          setProfile(offlineProfile);
          setMode("offline");
          setStatus("Offline editor");
          return;
        }

        const summaries = await loadMyProfiles();
        if (cancelled) return;

        setProfileSummaries(summaries);

        if (summaries.length > 0) {
          const firstHandle = summaries[0].handle;
          const savedProfile = await loadMyProfile(firstHandle);
          if (cancelled) return;

          setProfile(savedProfile ?? createProfile({ handle: firstHandle }));
          setHandleDraft(firstHandle);
        } else {
          const initialHandle =
            normalizeHandle(nextSession.name ?? "") || "your_handle";
          setProfile(
            createProfile({
              handle: initialHandle,
            }),
          );
          setHandleDraft(initialHandle);
          setHandleSetupOpen(true);
        }

        if (typeof window !== "undefined") {
          setHandleSetupOpen(
            (open) =>
              open ||
              new URLSearchParams(window.location.search).get("setup") ===
                "handle",
          );
        }
        setMode("backend");
        setStatus("Backend editor");
      } catch {
        if (cancelled) return;
        setProfile(await readLocalProfile());
        setMode("offline");
        setStatus("Backend unavailable, using offline editor");
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onPopState(): void {
      setFullPreviewOpen(window.location.pathname === "/admin/preview");
    }

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    resolveProfileAvatarUrl(profile, mode !== "backend")
      .then((url) => {
        if (!cancelled) setEditorAvatarUrl(url);
      })
      .catch(() => {
        if (!cancelled) setEditorAvatarUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, profile]);

  const profileUrl = useMemo(
    () => `/${profile.handle || "your_handle"}`,
    [profile.handle],
  );
  const previewProfile = useMemo(() => {
    return dragLinks ? { ...profile, links: dragLinks } : profile;
  }, [dragLinks, profile]);

  async function refreshProfileSummaries(): Promise<ProfileSummary[]> {
    if (mode !== "backend") return [];

    const summaries = await loadMyProfiles();
    setProfileSummaries(summaries);
    return summaries;
  }

  async function autosaveProfile(
    nextProfile: LinkProfile = profile,
  ): Promise<void> {
    if (mode === "loading") return;

    if (mode === "backend") {
      try {
        setStatus("Saving changes");
        await saveProfile(nextProfile);
        await refreshProfileSummaries();
        setStatus("Saved");
      } catch {
        setStatus("Autosave failed");
      }
      return;
    }

    await writeLocalProfile(nextProfile);
    setStatus("Saved locally");
  }

  function saveCurrentProfile(): void {
    void autosaveProfile(profile);
  }

  function updateProfile(patch: Partial<LinkProfile>): void {
    setProfile((current) => ({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateLink(id: string, patch: Partial<LinkItem>): void {
    updateProfile({
      links: profile.links.map((link) =>
        link.id === id ? { ...link, ...patch } : link,
      ),
    });
  }

  function updateTheme(patch: Partial<ProfileTheme>): void {
    updateProfile({
      theme: {
        ...profile.theme,
        ...patch,
      },
    });
  }

  function addLink(): void {
    const nextProfile = {
      ...profile,
      links: [
        ...profile.links,
        {
          id: crypto.randomUUID(),
          label: "New link",
          url: "https://example.com",
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    setProfile(nextProfile);
    void autosaveProfile(nextProfile);
  }

  function removeLink(id: string): void {
    const nextProfile = {
      ...profile,
      links: profile.links.filter((link) => link.id !== id),
      updatedAt: new Date().toISOString(),
    };
    setProfile(nextProfile);
    void autosaveProfile(nextProfile);
  }

  function commitLinks(finalLinks: LinkItem[]): void {
    const nextProfile = {
      ...profile,
      links: finalLinks,
      updatedAt: new Date().toISOString(),
    };
    setProfile(nextProfile);
    void autosaveProfile(nextProfile);
  }

  async function onSelectProfile(handle: string): Promise<void> {
    if (mode !== "backend" || !handle || handle === profile.handle) return;

    try {
      setStatus("Loading profile");
      const nextProfile = await loadMyProfile(handle);
      if (!nextProfile) {
        setStatus("Profile not found");
        return;
      }

      setProfile(nextProfile);
      setHandleDraft(nextProfile.handle);
      setActiveEditorPanel("profile");
      setStatus("Backend editor");
    } catch {
      setStatus("Profile load failed");
    }
  }

  function openNewHandleDialog(): void {
    setHandleDraft("");
    setHandleSetupError(null);
    setHandleSetupOpen(true);
  }

  async function onAvatarChange(file: File | null): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file");
      return;
    }

    try {
      const avatarFile = await prepareAvatarFile(file);

      if (mode === "backend") {
        const avatarAssetId = await uploadAvatar(avatarFile);
        const nextProfile = {
          ...profile,
          avatarAssetId,
          updatedAt: new Date().toISOString(),
        };
        setProfile(nextProfile);
        void autosaveProfile(nextProfile);
        setStatus("Image uploaded");
        return;
      }

      const asset = await saveLocalAsset(avatarFile);
      const nextProfile = {
        ...profile,
        avatarAssetId: asset.id,
        updatedAt: new Date().toISOString(),
      };
      setProfile(nextProfile);
      void autosaveProfile(nextProfile);
      setStatus("Image saved locally");
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
      if (mode === "backend") {
        const backgroundAssetId = await uploadProfileImage(file, "background");
        const nextProfile = {
          ...profile,
          theme: {
            ...profile.theme,
            backgroundAssetId,
          },
          updatedAt: new Date().toISOString(),
        };
        setProfile(nextProfile);
        void autosaveProfile(nextProfile);
        setStatus("Background uploaded");
        return;
      }

      const asset = await saveLocalAsset(file);
      const nextProfile = {
        ...profile,
        theme: {
          ...profile.theme,
          backgroundAssetId: asset.id,
        },
        updatedAt: new Date().toISOString(),
      };
      setProfile(nextProfile);
      void autosaveProfile(nextProfile);
      setStatus("Background saved locally");
    } catch {
      setStatus(
        mode === "backend"
          ? "Background upload failed"
          : "This browser cannot save local images",
      );
    }
  }

  async function onExport(): Promise<void> {
    const { buildStaticZip } = await import("../staticExport");
    const blob = await buildStaticZip(profile);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.handle || "linkoutpost"}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Static ZIP exported");
  }

  function openFullPreview(): void {
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/admin/preview"
    ) {
      window.history.pushState(
        { linkoutpostPreview: true },
        "",
        "/admin/preview",
      );
    }
    setFullPreviewOpen(true);
  }

  function closeFullPreview(): void {
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/admin/preview"
    ) {
      window.history.replaceState(null, "", "/admin");
    }

    setFullPreviewOpen(false);
  }

  async function onHandleSetupSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const handle = normalizeHandle(handleDraft);

    if (!handle || isReservedPath(handle)) {
      setHandleSetupError("Choose a valid handle.");
      return;
    }

    setHandleSetupSaving(true);
    setHandleSetupError(null);

    try {
      const nextProfile = createProfile({
        handle,
        title: profile.title,
      });
      await saveProfile(nextProfile);
      setProfile(nextProfile);
      await refreshProfileSummaries();
      setHandleSetupOpen(false);
      setStatus("Handle created");

      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/admin");
      }
    } catch (error) {
      setHandleSetupError(
        error instanceof Error ? error.message : "Handle create failed",
      );
    } finally {
      setHandleSetupSaving(false);
    }
  }

  if (fullPreviewOpen) {
    return (
      <FullscreenProfilePreview
        allowLocalAssets={mode !== "backend"}
        onBack={closeFullPreview}
        profile={previewProfile}
      />
    );
  }

  return (
    <main className="editor-shell">
      <header className="editor-mobile-topbar">
        <button
          aria-controls="editor-sidebar"
          aria-expanded={mobileSidebarOpen}
          aria-label={
            mobileSidebarOpen ? "Close editor sidebar" : "Open editor sidebar"
          }
          className="editor-mobile-menu-button"
          onClick={() => setMobileSidebarOpen((open) => !open)}
          type="button"
        >
          <Menu aria-hidden="true" size={24} />
        </button>
        <a className="editor-mobile-brand" href="/">
          LinkOutpost
        </a>
        <div className="editor-mobile-avatar" aria-label="Current user">
          {editorAvatarUrl ? (
            <img alt="" src={editorAvatarUrl} />
          ) : (
            <UserCircle aria-hidden="true" size={30} />
          )}
        </div>
      </header>

      <EditorSidebar
        accountMenuOpen={accountMenuOpen}
        activePanel={activeEditorPanel}
        avatarUrl={editorAvatarUrl}
        mobileOpen={mobileSidebarOpen}
        mode={mode}
        onAccountMenuOpenChange={setAccountMenuOpen}
        onCreateHandle={openNewHandleDialog}
        onMobileOpenChange={setMobileSidebarOpen}
        onPanelChange={setActiveEditorPanel}
        onSelectProfile={(handle) => {
          void onSelectProfile(handle);
        }}
        profile={profile}
        profileSummaries={profileSummaries}
      />

      <div className="editor-pane">
        <section className="editor-toolbar">
          <h1>
            {activeEditorPanel === "design"
              ? "Design"
              : activeEditorPanel === "layout"
                ? "Layout"
              : activeEditorPanel === "profile"
                ? "Profile"
                : "Links"}
          </h1>
          <div className="toolbar-actions">
            <button
              aria-label="Settings"
              className="circle-icon-button"
              title="Settings"
              type="button"
            >
              <Settings aria-hidden="true" size={18} />
            </button>
            {mode === "offline" && (
              <button
                aria-label="Preview page"
                className="circle-icon-button local-preview-button"
                onClick={openFullPreview}
                title="Preview page"
                type="button"
              >
                <Eye aria-hidden="true" size={18} />
              </button>
            )}
            <button className="button-secondary" onClick={onExport} type="button">
              <Download aria-hidden="true" size={16} />
              Export ZIP
            </button>
            {mode === "backend" && (
              <>
                <a className="button-secondary" href={profileUrl}>
                  <ExternalLink aria-hidden="true" size={16} />
                  View page
                </a>
              </>
            )}
          </div>
        </section>

        <div className="editor-scroll">
          <div className="editor-content">
            {activeEditorPanel === "profile" && (
              <ProfilePanel
                avatarUrl={editorAvatarUrl}
                mode={mode}
                onAvatarChange={(file) => {
                  void onAvatarChange(file);
                }}
                onSave={saveCurrentProfile}
                onUpdate={updateProfile}
                profile={profile}
              />
            )}

            {activeEditorPanel === "links" && (
              <LinksPanel
                links={profile.links}
                onAdd={addLink}
                onCommitLinks={commitLinks}
                onPreviewLinksChange={setDragLinks}
                onRemove={removeLink}
                onSave={saveCurrentProfile}
                onUpdate={updateLink}
              />
            )}

            {activeEditorPanel === "design" && (
              <DesignPanel
                onBackgroundChange={(file) => {
                  void onBackgroundChange(file);
                }}
                onSave={saveCurrentProfile}
                onUpdateTheme={updateTheme}
                profile={profile}
              />
            )}

            {activeEditorPanel === "layout" && (
              <LayoutPanel
                onSave={saveCurrentProfile}
                onUpdateTheme={updateTheme}
                profile={profile}
              />
            )}
          </div>
        </div>
      </div>

      <hr className="editor-divider" />

      <ProfilePreview
        allowLocalAssets={mode !== "backend"}
        profile={previewProfile}
      />

      {handleSetupOpen && (
        <HandleSetupDialog
          error={handleSetupError}
          handleDraft={handleDraft}
          saving={handleSetupSaving}
          onDraftChange={setHandleDraft}
          onErrorClear={() => setHandleSetupError(null)}
          onSubmit={(event) => {
            void onHandleSetupSubmit(event);
          }}
        />
      )}
    </main>
  );
}
