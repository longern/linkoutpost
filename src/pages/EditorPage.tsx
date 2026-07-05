import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowUpRightFromSquare,
  FaBars,
  FaCircleUser,
  FaDownload,
  FaEye,
  FaGear,
} from "react-icons/fa6";
import {
  loadMyProfile,
  loadMyProfiles,
  loadSession,
  saveProfile,
  uploadAvatar,
  uploadProfileAsset,
} from "../apiClient";
import {
  deleteLocalProfile,
  readLocalProfileByHandle,
  readLocalProfile,
  readLocalProfileSummaries,
  saveLocalAsset,
  saveLocalAssetBlob,
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
import { siteTitle } from "../siteConfig";
import type { ImportedStaticProfile } from "../staticImport";
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

const maxBannerMediaBytes = 10 * 1024 * 1024;

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
  const [activeEditorPanel, setActiveEditorPanel] =
    useState<EditorPanel>("profile");
  const [editorAvatarUrl, setEditorAvatarUrl] = useState<string | null>(null);
  const [dragLinks, setDragLinks] = useState<LinkItem[] | null>(null);
  const [handleSetupOpen, setHandleSetupOpen] = useState(false);
  const [handleDraft, setHandleDraft] = useState("");
  const [handleSetupError, setHandleSetupError] = useState<string | null>(null);
  const [handleSetupSaving, setHandleSetupSaving] = useState(false);
  const [importCandidate, setImportCandidate] =
    useState<ImportedStaticProfile | null>(null);
  const [importHandleDraft, setImportHandleDraft] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSaving, setImportSaving] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const zipInputRef = useRef<HTMLInputElement | null>(null);
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
          const summaries = await readLocalProfileSummaries();
          if (cancelled) return;
          setProfile(offlineProfile);
          setProfileSummaries(
            summaries.length > 0 ? summaries : [{
              handle: offlineProfile.handle,
              title: offlineProfile.title,
              updatedAt: offlineProfile.updatedAt,
            }],
          );
          setHandleDraft(offlineProfile.handle);
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
        const offlineProfile = await readLocalProfile();
        const summaries = await readLocalProfileSummaries();
        setProfile(offlineProfile);
        setProfileSummaries(
          summaries.length > 0 ? summaries : [{
            handle: offlineProfile.handle,
            title: offlineProfile.title,
            updatedAt: offlineProfile.updatedAt,
          }],
        );
        setHandleDraft(offlineProfile.handle);
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
    let objectUrl: string | null = null;

    resolveProfileAvatarUrl(profile, mode !== "backend")
      .then((url) => {
        if (cancelled) {
          if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setEditorAvatarUrl(url);
      })
      .catch(() => {
        if (!cancelled) setEditorAvatarUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl?.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
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
    if (mode !== "backend") {
      const summaries = await readLocalProfileSummaries();
      setProfileSummaries(summaries);
      return summaries;
    }

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
    await refreshProfileSummaries();
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

  function commitProfile(patch: Partial<LinkProfile>): void {
    const nextProfile = {
      ...profile,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setProfile(nextProfile);
    void autosaveProfile(nextProfile);
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

  function commitTheme(patch: Partial<ProfileTheme>): void {
    const nextProfile = {
      ...profile,
      theme: {
        ...profile.theme,
        ...patch,
      },
      updatedAt: new Date().toISOString(),
    };
    setProfile(nextProfile);
    void autosaveProfile(nextProfile);
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
    if (!handle || handle === profile.handle) return;

    if (mode !== "backend") {
      try {
        setStatus("Loading profile");
        const nextProfile = await readLocalProfileByHandle(handle);
        if (!nextProfile) {
          setStatus("Profile not found");
          return;
        }

        setProfile(nextProfile);
        setHandleDraft(nextProfile.handle);
        setActiveEditorPanel("profile");
        setStatus("Offline editor");
      } catch {
        setStatus("Profile load failed");
      }
      return;
    }

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

  async function onDeleteLocalProfile(handle: string): Promise<void> {
    if (mode === "backend") return;

    const normalizedHandle = normalizeHandle(handle);
    if (!normalizedHandle) return;

    try {
      setStatus("Deleting profile");
      const nextProfile = await deleteLocalProfile(normalizedHandle);
      const summaries = await readLocalProfileSummaries();
      setProfile(nextProfile);
      setProfileSummaries(
        summaries.length > 0 ? summaries : [{
          handle: nextProfile.handle,
          title: nextProfile.title,
          updatedAt: nextProfile.updatedAt,
        }],
      );
      setHandleDraft(nextProfile.handle);
      setActiveEditorPanel("profile");
      setStatus("Profile deleted");
    } catch {
      setStatus("Profile delete failed");
    }
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
        const backgroundAssetId = await uploadProfileAsset(file, "background");
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

  async function onBannerImageChange(file: File | null): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setStatus("Choose an image or video file");
      return;
    }
    if (file.size > maxBannerMediaBytes) {
      setStatus("Banner media must be 10 MB or smaller");
      return;
    }

    try {
      if (mode === "backend") {
        const bannerImageAssetId = await uploadProfileAsset(file, "banner");
        const nextProfile = {
          ...profile,
          theme: {
            ...profile.theme,
            bannerImageAssetId,
          },
          updatedAt: new Date().toISOString(),
        };
        setProfile(nextProfile);
        void autosaveProfile(nextProfile);
        setStatus("Banner image uploaded");
        return;
      }

      const asset = await saveLocalAsset(file);
      const nextProfile = {
        ...profile,
        theme: {
          ...profile.theme,
          bannerImageAssetId: asset.id,
        },
        updatedAt: new Date().toISOString(),
      };
      setProfile(nextProfile);
      void autosaveProfile(nextProfile);
      setStatus("Banner image saved locally");
    } catch {
      setStatus(
        mode === "backend"
          ? "Banner image upload failed"
          : "This browser cannot save local images",
      );
    }
  }

  function onBannerImageRemove(): void {
    const nextProfile = {
      ...profile,
      theme: {
        ...profile.theme,
        bannerImageAssetId: null,
      },
      updatedAt: new Date().toISOString(),
    };
    setProfile(nextProfile);
    void autosaveProfile(nextProfile);
    setStatus("Banner image removed");
  }

  async function onExport(): Promise<void> {
    const { buildStaticZip } = await import("../staticExport");
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
    setStatus("Static ZIP exported");
  }

  function handleExists(handle: string): boolean {
    return profileSummaries.some((summary) => summary.handle === handle);
  }

  function createAvailableHandle(baseHandle: string): string {
    const normalizedBase = (normalizeHandle(baseHandle) || "imported").slice(0, 34);
    let candidate = normalizedBase;
    let index = 2;

    while (handleExists(candidate)) {
      candidate = normalizeHandle(`${normalizedBase}-${index}`);
      index += 1;
    }

    return candidate;
  }

  function resetImportDialog(): void {
    setImportCandidate(null);
    setImportHandleDraft("");
    setImportError(null);
    setImportSaving(false);
  }

  async function prepareImportedProfile(
    imported: ImportedStaticProfile,
    handle: string,
  ): Promise<LinkProfile> {
    const fallbackAvatarAssetId = imported.profile.avatarAssetId?.startsWith("data:image/")
      ? imported.profile.avatarAssetId
      : null;
    const fallbackBackgroundAssetId = imported.profile.theme.backgroundAssetId?.startsWith("data:image/")
      ? imported.profile.theme.backgroundAssetId
      : null;
    const fallbackBannerImageAssetId = (
      imported.profile.theme.bannerImageAssetId?.startsWith("data:image/") ||
      imported.profile.theme.bannerImageAssetId?.startsWith("data:video/")
    )
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
      if (mode === "backend") {
        const file = new File([imported.avatar.blob], imported.avatar.name, {
          type: imported.avatar.type,
        });
        nextProfile = {
          ...nextProfile,
          avatarAssetId: await uploadAvatar(file),
        };
      } else {
        const asset = await saveLocalAssetBlob(
          imported.avatar.blob,
          imported.avatar.name,
          imported.avatar.type,
        );
        nextProfile = {
          ...nextProfile,
          avatarAssetId: asset.id,
        };
      }
    }

    if (imported.background) {
      if (mode === "backend") {
        const file = new File([imported.background.blob], imported.background.name, {
          type: imported.background.type,
        });
        nextProfile = {
          ...nextProfile,
          theme: {
            ...nextProfile.theme,
            backgroundAssetId: await uploadProfileAsset(file, "background"),
          },
        };
      } else {
        const asset = await saveLocalAssetBlob(
          imported.background.blob,
          imported.background.name,
          imported.background.type,
        );
        nextProfile = {
          ...nextProfile,
          theme: {
            ...nextProfile.theme,
            backgroundAssetId: asset.id,
          },
        };
      }
    }

    if (imported.bannerImage) {
      if (mode === "backend") {
        const file = new File([imported.bannerImage.blob], imported.bannerImage.name, {
          type: imported.bannerImage.type,
        });
        nextProfile = {
          ...nextProfile,
          theme: {
            ...nextProfile.theme,
            bannerImageAssetId: await uploadProfileAsset(file, "banner"),
          },
        };
      } else {
        const asset = await saveLocalAssetBlob(
          imported.bannerImage.blob,
          imported.bannerImage.name,
          imported.bannerImage.type,
        );
        nextProfile = {
          ...nextProfile,
          theme: {
            ...nextProfile.theme,
            bannerImageAssetId: asset.id,
          },
        };
      }
    }

    return nextProfile;
  }

  async function commitImportedProfile(
    imported: ImportedStaticProfile,
    handle: string,
  ): Promise<void> {
    const normalizedHandle = normalizeHandle(handle);

    if (!normalizedHandle || isReservedPath(normalizedHandle)) {
      setImportError("Choose a valid handle.");
      return;
    }

    setImportSaving(true);
    setImportError(null);

    try {
      setStatus("Importing ZIP");
      const nextProfile = await prepareImportedProfile(imported, normalizedHandle);

      if (mode === "backend") {
        await saveProfile(nextProfile);
      } else {
        await writeLocalProfile(nextProfile);
      }

      setProfile(nextProfile);
      setHandleDraft(nextProfile.handle);
      await refreshProfileSummaries();
      resetImportDialog();
      setActiveEditorPanel("profile");
      setStatus("ZIP imported");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "ZIP import failed");
      setStatus("ZIP import failed");
      setImportSaving(false);
    }
  }

  async function onZipImportChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    try {
      setStatus("Reading ZIP");
      const { readProfileFromStaticZip } = await import("../staticImport");
      const imported = await readProfileFromStaticZip(file);
      const importedHandle = normalizeHandle(imported.profile.handle);

      if (!importedHandle || isReservedPath(importedHandle)) {
        setImportCandidate(imported);
        setImportHandleDraft(createAvailableHandle(importedHandle || "imported"));
        setImportError("Choose a valid handle.");
        return;
      }

      if (handleExists(importedHandle)) {
        setImportCandidate(imported);
        setImportHandleDraft(createAvailableHandle(importedHandle));
        setImportError(null);
        return;
      }

      await commitImportedProfile(imported, importedHandle);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "ZIP import failed");
    }
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

      if (mode === "backend") {
        await saveProfile(nextProfile);
      } else {
        await writeLocalProfile(nextProfile);
      }

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
          <FaBars aria-hidden="true" size={24} />
        </button>
        <a className="editor-mobile-brand" href="/">
          {siteTitle}
        </a>
        <div className="editor-mobile-avatar" aria-label="Current user">
          {editorAvatarUrl ? (
            <img alt="" src={editorAvatarUrl} />
          ) : (
            <FaCircleUser aria-hidden="true" size={30} />
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
        onDeleteProfile={(handle) => {
          void onDeleteLocalProfile(handle);
        }}
        onImportZip={() => zipInputRef.current?.click()}
        profile={profile}
        profileSummaries={profileSummaries}
      />

      <input
        ref={zipInputRef}
        accept=".zip,application/zip"
        className="visually-hidden"
        onChange={(event) => {
          void onZipImportChange(event);
        }}
        type="file"
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
              <FaGear aria-hidden="true" size={18} />
            </button>
            {mode === "offline" && (
              <button
                aria-label="Preview page"
                className="circle-icon-button local-preview-button"
                onClick={openFullPreview}
                title="Preview page"
                type="button"
              >
                <FaEye aria-hidden="true" size={18} />
              </button>
            )}
            <button
              className="button-secondary"
              onClick={onExport}
              type="button"
            >
              <FaDownload aria-hidden="true" size={16} />
              Export ZIP
            </button>
            {mode === "backend" && (
              <>
                <a
                  className="button-secondary"
                  href={profileUrl}
                  target="_blank"
                >
                  <FaArrowUpRightFromSquare aria-hidden="true" size={16} />
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
                onCommit={commitProfile}
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
                onBannerImageChange={(file) => {
                  void onBannerImageChange(file);
                }}
                onBannerImageRemove={onBannerImageRemove}
                onSave={saveCurrentProfile}
                onUpdateTheme={updateTheme}
                profile={profile}
              />
            )}

            {activeEditorPanel === "layout" && (
              <LayoutPanel
                onCommitTheme={commitTheme}
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

      {importCandidate && (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="zip-import-conflict-title"
            className="modal-card zip-import-dialog"
            role="dialog"
          >
            <h2 id="zip-import-conflict-title">Import ZIP</h2>
            <p>
              The ZIP uses @{importCandidate.profile.handle || "imported"}.
              Choose how to import it.
            </p>
            <div className="zip-import-actions">
              <button
                className="button-secondary"
                disabled={importSaving}
                onClick={() => {
                  void commitImportedProfile(
                    importCandidate,
                    importCandidate.profile.handle,
                  );
                }}
                type="button"
              >
                Overwrite
              </button>
              <label>
                Rename to
                <input
                  value={importHandleDraft}
                  onChange={(event) => {
                    setImportHandleDraft(normalizeHandle(event.target.value));
                    setImportError(null);
                  }}
                />
              </label>
              <button
                className="button-primary"
                disabled={importSaving}
                onClick={() => {
                  const renamedHandle = normalizeHandle(importHandleDraft);
                  if (handleExists(renamedHandle)) {
                    setImportError("That handle already exists.");
                    return;
                  }
                  void commitImportedProfile(importCandidate, renamedHandle);
                }}
                type="button"
              >
                Rename and import
              </button>
              <button
                className="button-secondary"
                disabled={importSaving}
                onClick={resetImportDialog}
                type="button"
              >
                Cancel
              </button>
            </div>
            {importError && <p className="field-error">{importError}</p>}
          </section>
        </div>
      )}
    </main>
  );
}
