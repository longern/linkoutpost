import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowUpRightFromSquare,
  FaBars,
  FaCircleUser,
  FaDownload,
  FaEllipsisVertical,
  FaEye,
} from "react-icons/fa6";
import {
  loadMyProfile,
  loadMyProfiles,
  saveProfile,
} from "../apiClient";
import {
  deleteLocalProfile,
  readLocalProfileByHandle,
  readLocalProfileSummaries,
  writeLocalProfile,
} from "../localEditorStore";
import {
  createProfile,
  hostedHandleMinLength,
  isHostedHandleTooShort,
  isReservedPath,
  normalizeHandle,
  type LinkItem,
  type LinkProfile,
} from "../profile";
import { siteTitle } from "../siteConfig";
import type { ImportedStaticProfile } from "../staticImport";
import type { ProfileSummary, SessionState } from "../types";
import { DesignPanel } from "./editor/DesignPanel";
import { createEditorMediaActions } from "./editor/createEditorMediaActions";
import { createEditorProfileActions } from "./editor/createEditorProfileActions";
import { EditorLoadingSpinner } from "./editor/EditorLoadingSpinner";
import { EditorSidebar, type EditorPanel } from "./editor/EditorSidebar";
import { HandleSetupDialog } from "./editor/HandleSetupDialog";
import { LayoutPanel } from "./editor/LayoutPanel";
import { LinksPanel } from "./editor/LinksPanel";
import {
  handleCreateErrorMessage,
  loadEditorBootstrap,
} from "./editor/loadEditorBootstrap";
import {
  FullscreenProfilePreview,
  ProfilePreview,
} from "./editor/ProfilePreview";
import { ProfilePanel } from "./editor/ProfilePanel";
import {
  exportStaticProfile,
  prepareImportedProfile,
} from "./editor/profileTransfer";
import { useAnimatedMenu } from "./editor/useAnimatedMenu";
import {
  useEditorAssetUrls,
  type EditorMode,
} from "./editor/useEditorAssetUrls";

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
  const [mode, setMode] = useState<EditorMode>("loading");
  const [status, setStatus] = useState("Loading editor");
  const [activeEditorPanel, setActiveEditorPanel] =
    useState<EditorPanel>("profile");
  const [dragLinks, setDragLinks] = useState<LinkItem[] | null>(null);
  const [handleSetupOpen, setHandleSetupOpen] = useState(false);
  const [handleSetupRequired, setHandleSetupRequired] = useState(false);
  const [handleDraft, setHandleDraft] = useState("");
  const [handleSetupError, setHandleSetupError] = useState<string | null>(null);
  const [handleSetupSaving, setHandleSetupSaving] = useState(false);
  const [importCandidate, setImportCandidate] =
    useState<ImportedStaticProfile | null>(null);
  const [importHandleDraft, setImportHandleDraft] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSaving, setImportSaving] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [toolbarMenuOpen, setToolbarMenuOpen] = useState(false);
  const toolbarMenuAnimation = useAnimatedMenu(toolbarMenuOpen);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const zipInputRef = useRef<HTMLInputElement | null>(null);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.location.pathname === "/admin/preview",
  );
  const {
    avatarUrl: editorAvatarUrl,
    backgroundUrl: editorBackgroundUrl,
    bannerImageUrl: editorBannerImageUrl,
    linkImageUrls: editorLinkImageUrls,
  } = useEditorAssetUrls(profile, mode);

  useEffect(() => {
    let cancelled = false;

    void loadEditorBootstrap(initialSession).then((bootstrap) => {
      if (cancelled) return;
      setSession(bootstrap.session);
      setProfile(bootstrap.profile);
      setProfileSummaries(bootstrap.profileSummaries);
      setHandleDraft(bootstrap.handleDraft);
      setHandleSetupError(bootstrap.handleSetupError);
      setHandleSetupRequired(bootstrap.handleSetupRequired);
      setHandleSetupOpen(bootstrap.handleSetupOpen);
      setMode(bootstrap.mode);
      setStatus(bootstrap.status);
    });

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

  const profileUrl = useMemo(
    () => (profile.handle ? `/${profile.handle}` : "/"),
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

  const {
    onAvatarChange,
    onBackgroundChange,
    onBackgroundRemove,
    onBannerImageChange,
    onBannerImageRemove,
    onLinkImageChange,
  } = createEditorMediaActions({
    autosaveProfile,
    mode,
    profile,
    setProfile,
    setStatus,
  });

  const {
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
  } = createEditorProfileActions({
    autosaveProfile,
    mode,
    profile,
    setProfile,
  });

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
    setHandleSetupRequired(false);
    setHandleSetupOpen(true);
  }

  async function onDeleteLocalProfile(handle: string): Promise<void> {
    if (mode === "backend") return;

    const normalizedHandle = normalizeHandle(handle);
    if (!normalizedHandle) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete @${normalizedHandle}? This cannot be undone.`)
    ) {
      return;
    }

    try {
      setStatus("Deleting profile");
      const nextProfile = await deleteLocalProfile(normalizedHandle);
      const summaries = await readLocalProfileSummaries();
      const needsLocalHandle =
        summaries.length === 0 && !normalizeHandle(nextProfile.handle);
      setProfile(nextProfile);
      if (needsLocalHandle) {
        setHandleDraft("");
        setHandleSetupRequired(true);
        setHandleSetupOpen(true);
      } else {
        setHandleDraft(nextProfile.handle);
      }
      setProfileSummaries(
        summaries.length > 0 || needsLocalHandle
          ? summaries
          : [
              {
                handle: nextProfile.handle,
                title: nextProfile.title,
                updatedAt: nextProfile.updatedAt,
              },
            ],
      );
      setActiveEditorPanel("profile");
      setStatus("Profile deleted");
    } catch {
      setStatus("Profile delete failed");
    }
  }

  async function onExport(): Promise<void> {
    await exportStaticProfile(profile, mode);
    setStatus("Static ZIP exported");
  }

  function handleExists(handle: string): boolean {
    return profileSummaries.some((summary) => summary.handle === handle);
  }

  function createAvailableHandle(baseHandle: string): string {
    const normalizedBase = (normalizeHandle(baseHandle) || "imported").slice(
      0,
      34,
    );
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

  async function commitImportedProfile(
    imported: ImportedStaticProfile,
    handle: string,
  ): Promise<void> {
    const normalizedHandle = normalizeHandle(handle);

    if (!normalizedHandle || isReservedPath(normalizedHandle)) {
      setImportError("Choose a valid handle.");
      return;
    }

    if (mode === "backend" && isHostedHandleTooShort(normalizedHandle)) {
      setImportError(`Use at least ${hostedHandleMinLength} characters.`);
      return;
    }

    setImportSaving(true);
    setImportError(null);

    try {
      setStatus("Importing ZIP");
      const nextProfile = await prepareImportedProfile(
        imported,
        normalizedHandle,
        mode,
      );

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
      setImportError(
        error instanceof Error ? error.message : "ZIP import failed",
      );
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
        setImportHandleDraft(
          createAvailableHandle(importedHandle || "imported"),
        );
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

    if (mode === "backend" && isHostedHandleTooShort(handle)) {
      setHandleSetupError(`Use at least ${hostedHandleMinLength} characters.`);
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
      setHandleSetupRequired(false);
      setHandleSetupOpen(false);
      setStatus("Handle created");

      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/admin");
      }
    } catch (error) {
      setHandleSetupError(handleCreateErrorMessage(error));
    } finally {
      setHandleSetupSaving(false);
    }
  }

  if (fullPreviewOpen && mode === "loading") {
    return (
      <main className="editor-full-preview">
        <EditorLoadingSpinner className="editor-loading-fullscreen" />
      </main>
    );
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
            {mode === "offline" && (
              <button
                className="button-secondary"
                onClick={onExport}
                type="button"
              >
                <FaDownload aria-hidden="true" size={16} />
                Export ZIP
              </button>
            )}
            {mode === "backend" && (
              <a
                aria-label="View page"
                className="circle-icon-button"
                href={profileUrl}
                target="_blank"
                title="View page"
              >
                <FaArrowUpRightFromSquare aria-hidden="true" size={18} />
              </a>
            )}
            {mode === "backend" && (
              <div className="toolbar-menu-wrap">
                <button
                  aria-expanded={toolbarMenuOpen}
                  aria-haspopup="menu"
                  aria-label="More actions"
                  className="circle-icon-button"
                  onClick={() => setToolbarMenuOpen((open) => !open)}
                  title="More actions"
                  type="button"
                >
                  <FaEllipsisVertical aria-hidden="true" size={18} />
                </button>
                {toolbarMenuAnimation.mounted && (
                  <>
                    <button
                      aria-hidden="true"
                      className="toolbar-menu-backdrop"
                      onClick={() => setToolbarMenuOpen(false)}
                      tabIndex={-1}
                      type="button"
                    />
                    <ul
                      className={`toolbar-menu animated-menu${toolbarMenuAnimation.visible ? " is-open" : " is-closing"}`}
                      role="menu"
                    >
                      <li role="none">
                        <button
                          className="account-menu-item"
                          onClick={() => {
                            setToolbarMenuOpen(false);
                            void onExport();
                          }}
                          role="menuitem"
                          type="button"
                        >
                          <FaDownload aria-hidden="true" size={15} />
                          Export ZIP
                        </button>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="editor-scroll">
          <div className="editor-content">
            {mode === "loading" ? (
              <EditorLoadingSpinner className="editor-pane-loading" />
            ) : (
              <>
                {activeEditorPanel === "profile" && (
                  <ProfilePanel
                    avatarUrl={editorAvatarUrl}
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
                    linkImageUrls={editorLinkImageUrls}
                    links={profile.links}
                    onAddImage={addImageCard}
                    onAddLink={addLink}
                    onCommitLinks={commitLinks}
                    onImageChange={(id, file) => {
                      void onLinkImageChange(id, file);
                    }}
                    onPreviewLinksChange={setDragLinks}
                    onRemove={removeLink}
                    onSaveLink={saveLink}
                    onToggleVisibility={toggleLinkVisibility}
                    onUpdate={updateLink}
                  />
                )}

                {activeEditorPanel === "design" && (
                  <DesignPanel
                    backgroundUrl={editorBackgroundUrl}
                    bannerImageUrl={editorBannerImageUrl}
                    onBackgroundChange={(file) => {
                      void onBackgroundChange(file);
                    }}
                    onBackgroundRemove={onBackgroundRemove}
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
              </>
            )}
          </div>
        </div>
      </div>

      <hr className="editor-divider" />

      {mode === "loading" ? (
        <section
          aria-label="Profile preview"
          className="preview editor-preview-loading"
        >
          <EditorLoadingSpinner />
        </section>
      ) : (
        <ProfilePreview
          allowLocalAssets={mode !== "backend"}
          profile={previewProfile}
        />
      )}

      {handleSetupOpen && (
        <HandleSetupDialog
          error={handleSetupError}
          handleDraft={handleDraft}
          saving={handleSetupSaving}
          onClose={
            handleSetupRequired
              ? undefined
              : () => {
                  setHandleSetupOpen(false);
                  setHandleSetupError(null);
                }
          }
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
