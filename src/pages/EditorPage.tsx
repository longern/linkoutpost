import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Bell,
  Camera,
  ChevronDown,
  Download,
  Eye,
  ExternalLink,
  GripVertical,
  LogOut,
  Palette,
  Plus,
  Save,
  Settings,
  Trash2,
  UserCircle
} from "lucide-react";
import { loadMyProfile, loadSession, saveProfile, updateSessionHandle } from "../apiClient";
import {
  readLocalAssetAsDataUrl,
  readLocalProfile,
  saveLocalAsset,
  writeLocalProfile
} from "../localEditorStore";
import {
  createProfile,
  fontOptions,
  isReservedPath,
  normalizeHandle,
  type LinkItem,
  type LinkProfile,
  type ProfileTheme
} from "../profile";
import { ProfilePage } from "../PublicProfile";
import type { SessionState } from "../types";

function moveLinksById(links: LinkItem[], activeId: string, overId: string): LinkItem[] {
  const activeIndex = links.findIndex((link) => link.id === activeId);
  const overIndex = links.findIndex((link) => link.id === overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return links;
  }

  return arrayMove(links, activeIndex, overIndex);
}

function ProfilePreview({ profile }: { profile: LinkProfile }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const previousLinkRects = useRef(new Map<string, DOMRect>());

  useEffect(() => {
    let cancelled = false;

    if (!profile.avatarAssetId) {
      setAvatarUrl(null);
      return;
    }

    readLocalAssetAsDataUrl(profile.avatarAssetId)
      .then((url) => {
        if (!cancelled) setAvatarUrl(url);
      })
      .catch(() => {
        if (!cancelled) setAvatarUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [profile.avatarAssetId]);

  useLayoutEffect(() => {
    const previewElement = previewRef.current;
    if (!previewElement) return;

    const nextRects = new Map<string, DOMRect>();
    const linkElements = previewElement.querySelectorAll<HTMLElement>("[data-profile-link-id]");

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
        <ProfilePage avatarUrl={avatarUrl} profile={profile} shareEnabled={false} />
      </div>
    </section>
  );
}

function FullscreenProfilePreview({
  onBack,
  profile
}: {
  onBack(): void;
  profile: LinkProfile;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!profile.avatarAssetId) {
      setAvatarUrl(null);
      return;
    }

    readLocalAssetAsDataUrl(profile.avatarAssetId)
      .then((url) => {
        if (!cancelled) setAvatarUrl(url);
      })
      .catch(() => {
        if (!cancelled) setAvatarUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [profile.avatarAssetId]);

  return (
    <div className="editor-full-preview">
      <button
        aria-label="Back to editor"
        className="circle-icon-button full-preview-back"
        onClick={onBack}
        title="Back to editor"
        type="button"
      >
        <ArrowLeft aria-hidden="true" size={20} />
      </button>
      <ProfilePage avatarUrl={avatarUrl} profile={profile} />
    </div>
  );
}

function SortableLinkRow({
  active,
  link,
  onRemove,
  onUpdate
}: {
  active: boolean;
  link: LinkItem;
  onRemove(id: string): void;
  onUpdate(id: string, patch: Partial<LinkItem>): void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform
  } = useSortable({ id: link.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? undefined
      : "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)"
  };

  return (
    <div
      className={`link-row${active || isDragging ? " is-dragging" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <button
        aria-label={`Drag ${link.label}`}
        className="link-row-drag"
        title="Drag to reorder"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" size={18} />
      </button>
      <div className="link-row-fields">
        <input
          aria-label="Link label"
          value={link.label}
          onChange={(event) => onUpdate(link.id, { label: event.target.value })}
        />
        <input
          aria-label="Link URL"
          value={link.url}
          onChange={(event) => onUpdate(link.id, { url: event.target.value })}
        />
      </div>
      <button
        aria-label="Remove link"
        className="circle-icon-button danger"
        onClick={() => onRemove(link.id)}
        title="Remove link"
        type="button"
      >
        <Trash2 aria-hidden="true" size={18} />
      </button>
    </div>
  );
}

export function EditorPage({ initialSession }: { initialSession: SessionState }) {
  const [session, setSession] = useState(initialSession);
  const [profile, setProfile] = useState<LinkProfile>(() => createProfile());
  const [mode, setMode] = useState<"loading" | "offline" | "backend">("loading");
  const [status, setStatus] = useState("Loading editor");
  const [activeEditorPanel, setActiveEditorPanel] = useState<"links" | "design" | "profile">("profile");
  const [editorAvatarUrl, setEditorAvatarUrl] = useState<string | null>(null);
  const [activeDragLinkId, setActiveDragLinkId] = useState<string | null>(null);
  const [dragLinks, setDragLinks] = useState<LinkItem[] | null>(null);
  const [handleSetupOpen, setHandleSetupOpen] = useState(false);
  const [handleDraft, setHandleDraft] = useState("");
  const [handleSetupError, setHandleSetupError] = useState<string | null>(null);
  const [handleSetupSaving, setHandleSetupSaving] = useState(false);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(() => (
    typeof window !== "undefined" && window.location.pathname === "/admin/preview"
  ));
  const dragLinksRef = useRef<LinkItem[] | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
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

        const savedProfile = await loadMyProfile();
        if (cancelled) return;

        setProfile(savedProfile ?? createProfile({ handle: nextSession.handle ?? "your_handle" }));
        setHandleDraft(nextSession.handle ?? "");
        if (typeof window !== "undefined") {
          setHandleSetupOpen(new URLSearchParams(window.location.search).get("setup") === "handle");
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
    if (mode === "offline") {
      void writeLocalProfile(profile);
    }
  }, [mode, profile]);

  useEffect(() => {
    let cancelled = false;

    if (!profile.avatarAssetId) {
      setEditorAvatarUrl(null);
      return;
    }

    readLocalAssetAsDataUrl(profile.avatarAssetId)
      .then((url) => {
        if (!cancelled) setEditorAvatarUrl(url);
      })
      .catch(() => {
        if (!cancelled) setEditorAvatarUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [profile.avatarAssetId]);

  const profileUrl = useMemo(() => `/${profile.handle || "your_handle"}`, [profile.handle]);
  const previewProfile = useMemo(() => {
    return dragLinks ? { ...profile, links: dragLinks } : profile;
  }, [dragLinks, profile]);

  function updateProfile(patch: Partial<LinkProfile>): void {
    setProfile((current) => ({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    }));
  }

  function updateLink(id: string, patch: Partial<LinkItem>): void {
    updateProfile({
      links: profile.links.map((link) => (
        link.id === id ? { ...link, ...patch } : link
      ))
    });
  }

  function updateTheme(patch: Partial<ProfileTheme>): void {
    updateProfile({
      theme: {
        ...profile.theme,
        ...patch
      }
    });
  }

  function addLink(): void {
    updateProfile({
      links: [
        ...profile.links,
        {
          id: crypto.randomUUID(),
          label: "New link",
          url: "https://example.com"
        }
      ]
    });
  }

  function removeLink(id: string): void {
    updateProfile({
      links: profile.links.filter((link) => link.id !== id)
    });
  }

  function commitDragLinks(nextLinks: LinkItem[] | null): void {
    dragLinksRef.current = nextLinks;
    setDragLinks(nextLinks);
  }

  function onLinkDragStart(event: DragStartEvent): void {
    setActiveDragLinkId(String(event.active.id));
  }

  function onLinkDragOver(event: DragOverEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      commitDragLinks(null);
      return;
    }

    const nextLinks = moveLinksById(profile.links, String(active.id), String(over.id));
    commitDragLinks(nextLinks === profile.links ? null : nextLinks);
  }

  function clearLinkDrag(): void {
    setActiveDragLinkId(null);
    commitDragLinks(null);
  }

  function onLinkDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    const hasValidDrop = Boolean(event.over);

    clearLinkDrag();

    if (!hasValidDrop || !over) return;

    const finalLinks = moveLinksById(profile.links, String(active.id), String(over.id));
    if (finalLinks === profile.links) return;

    setProfile((currentProfile) => ({
      ...currentProfile,
      links: finalLinks,
      updatedAt: new Date().toISOString()
    }));
  }

  async function onSave(): Promise<void> {
    if (mode !== "backend") {
      await writeLocalProfile(profile);
      setStatus("Saved locally");
      return;
    }

    try {
      await saveProfile(profile);
      setStatus("Saved to backend");
    } catch {
      await writeLocalProfile(profile);
      setMode("offline");
      setStatus("Backend save failed, kept locally");
    }
  }

  async function onAvatarChange(file: File | null): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file");
      return;
    }

    try {
      const asset = await saveLocalAsset(file);
      updateProfile({ avatarAssetId: asset.id });
      setStatus("Image saved locally");
    } catch {
      setStatus("This browser cannot save local images");
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
    if (typeof window !== "undefined" && window.location.pathname !== "/admin/preview") {
      window.history.pushState({ linkoutpostPreview: true }, "", "/admin/preview");
    }
    setFullPreviewOpen(true);
  }

  function closeFullPreview(): void {
    if (typeof window !== "undefined" && window.location.pathname === "/admin/preview") {
      window.history.replaceState(null, "", "/admin");
    }

    setFullPreviewOpen(false);
  }

  async function onHandleSetupSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const handle = normalizeHandle(handleDraft);

    if (!handle || isReservedPath(handle)) {
      setHandleSetupError("Choose a valid handle.");
      return;
    }

    setHandleSetupSaving(true);
    setHandleSetupError(null);

    try {
      const nextSession = await updateSessionHandle(handle);
      setSession(nextSession);
      setProfile((current) => ({
        ...current,
        handle,
        updatedAt: new Date().toISOString()
      }));
      setHandleSetupOpen(false);
      setStatus("Handle saved");

      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/admin");
      }
    } catch (error) {
      setHandleSetupError(error instanceof Error ? error.message : "Handle update failed");
    } finally {
      setHandleSetupSaving(false);
    }
  }

  if (fullPreviewOpen) {
    return <FullscreenProfilePreview onBack={closeFullPreview} profile={previewProfile} />;
  }

  return (
    <main className="editor-shell">
      <aside className="editor-sidebar" aria-label="Editor navigation">
        <div className="sidebar-account">
          <UserCircle aria-hidden="true" size={22} />
          <span>{profile.handle || "your_handle"}</span>
          <ChevronDown aria-hidden="true" size={16} />
          <Bell aria-hidden="true" className="sidebar-bell" size={18} />
        </div>

        <nav className="sidebar-nav" aria-label="Editor sections">
          <button
            className={activeEditorPanel === "profile" ? "active" : undefined}
            onClick={() => setActiveEditorPanel("profile")}
            type="button"
          >
            <UserCircle aria-hidden="true" size={16} />
            Profile
          </button>
          <button
            className={activeEditorPanel === "links" ? "active" : undefined}
            onClick={() => setActiveEditorPanel("links")}
            type="button"
          >
            <Plus aria-hidden="true" size={16} />
            Links
          </button>
          <button
            className={activeEditorPanel === "design" ? "active" : undefined}
            onClick={() => setActiveEditorPanel("design")}
            type="button"
          >
            <Palette aria-hidden="true" size={16} />
            Design
          </button>
        </nav>

        <div className="sidebar-card">
          <strong>{mode === "backend" ? "Backend mode" : "Local editor"}</strong>
          <p>{status}</p>
          <button className="primary-link" onClick={onSave} type="button">
            <Save aria-hidden="true" size={16} />
            Save
          </button>
        </div>
      </aside>

      <div className="editor-pane">
        <section className="editor-toolbar">
          <h1>
            {activeEditorPanel === "design"
              ? "Design"
              : activeEditorPanel === "profile"
                ? "Profile"
                : "Links"}
          </h1>
          <div className="toolbar-actions">
            <button aria-label="Settings" className="circle-icon-button" title="Settings" type="button">
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
            <button className="action-button" onClick={onExport} type="button">
              <Download aria-hidden="true" size={16} />
              Export ZIP
            </button>
            {mode === "backend" && (
              <>
                <a className="action-button" href={profileUrl}>
                  <ExternalLink aria-hidden="true" size={16} />
                  View page
                </a>
                <a className="action-button" href="/api/logout">
                  <LogOut aria-hidden="true" size={16} />
                  Logout
                </a>
              </>
            )}
          </div>
        </section>

        <div className="editor-scroll">
          <div className="editor-content">
            {activeEditorPanel === "profile" && (
              <section className="profile-panel" aria-label="Profile form">
                <div className="profile-editor-summary">
                  <label className="profile-editor-avatar" title="Upload avatar">
                    <span className="sr-only">Avatar image</span>
                    <span className="profile-avatar-visual">
                      {editorAvatarUrl ? (
                        <img alt="" src={editorAvatarUrl} />
                      ) : (
                        <UserCircle aria-hidden="true" size={54} />
                      )}
                    </span>
                    <span className="profile-avatar-action" aria-hidden="true">
                      <Camera size={16} />
                    </span>
                    <input
                      accept="image/*"
                      onChange={(event) => {
                        void onAvatarChange(event.currentTarget.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                      type="file"
                    />
                  </label>
                  <div>
                    <label>
                      Handle
                      <input
                        value={profile.handle}
                        onChange={(event) => {
                          const handle = normalizeHandle(event.target.value);
                          updateProfile({ handle });
                        }}
                      />
                    </label>
                    {isReservedPath(profile.handle) && (
                      <p className="field-error">This handle is reserved.</p>
                    )}
                  </div>
                </div>

                <div className="profile-fields-grid">
                  <label>
                    Name
                    <input
                      value={profile.title}
                      onChange={(event) => updateProfile({ title: event.target.value })}
                    />
                  </label>
                  <label>
                    Bio
                    <textarea
                      value={profile.bio}
                      onChange={(event) => updateProfile({ bio: event.target.value })}
                      rows={3}
                    />
                  </label>
                </div>
              </section>
            )}

            {activeEditorPanel === "links" && (
              <>
                <button className="add-link-button" onClick={addLink} type="button">
                  <Plus aria-hidden="true" size={20} />
                  Add
                </button>

                <DndContext
                  collisionDetection={closestCenter}
                  onDragCancel={clearLinkDrag}
                  onDragEnd={onLinkDragEnd}
                  onDragOver={onLinkDragOver}
                  onDragStart={onLinkDragStart}
                  sensors={sensors}
                >
                  <SortableContext
                    items={profile.links.map((link) => link.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <section className="link-list" aria-label="Links">
                      {profile.links.map((link) => (
                        <SortableLinkRow
                          active={activeDragLinkId === link.id}
                          key={link.id}
                          link={link}
                          onRemove={removeLink}
                          onUpdate={updateLink}
                        />
                      ))}
                    </section>
                  </SortableContext>
                </DndContext>
              </>
            )}

            {activeEditorPanel === "design" && (
              <section className="design-panel" aria-label="Style form">
                <div className="theme-grid">
                  <label>
                    Background
                    <input
                      type="color"
                      value={profile.theme.backgroundColor}
                      onChange={(event) => updateTheme({ backgroundColor: event.target.value })}
                    />
                  </label>
                  <label>
                    Text
                    <input
                      type="color"
                      value={profile.theme.textColor}
                      onChange={(event) => updateTheme({ textColor: event.target.value })}
                    />
                  </label>
                  <label>
                    Accent
                    <input
                      type="color"
                      value={profile.theme.accentColor}
                      onChange={(event) => updateTheme({ accentColor: event.target.value })}
                    />
                  </label>
                  <label>
                    Button
                    <input
                      type="color"
                      value={profile.theme.buttonBackgroundColor}
                      onChange={(event) => updateTheme({ buttonBackgroundColor: event.target.value })}
                    />
                  </label>
                  <label>
                    Button text
                    <input
                      type="color"
                      value={profile.theme.buttonTextColor}
                      onChange={(event) => updateTheme({ buttonTextColor: event.target.value })}
                    />
                  </label>
                  <label>
                    Font
                    <select
                      value={profile.theme.fontFamily}
                      onChange={(event) => updateTheme({ fontFamily: event.target.value })}
                    >
                      {fontOptions.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <hr className="editor-divider" />

      <ProfilePreview profile={previewProfile} />

      {handleSetupOpen && (
        <div className="modal-backdrop" role="presentation">
          <section aria-labelledby="handle-setup-title" className="modal-card" role="dialog" aria-modal="true">
            <form onSubmit={onHandleSetupSubmit}>
              <h2 id="handle-setup-title">Choose your handle</h2>
              <p>Your handle becomes your public LinkOutpost URL.</p>
              <label>
                Handle
                <input
                  autoFocus
                  value={handleDraft}
                  onChange={(event) => {
                    setHandleDraft(normalizeHandle(event.target.value));
                    setHandleSetupError(null);
                  }}
                />
              </label>
              {handleSetupError && <p className="field-error">{handleSetupError}</p>}
              <button className="primary-link" disabled={handleSetupSaving} type="submit">
                {handleSetupSaving ? "Saving" : "Continue"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
