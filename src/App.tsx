import { useEffect, useMemo, useState } from "react";
import { buildStaticZip } from "./staticExport";
import {
  readLocalAssetAsDataUrl,
  readLocalProfile,
  saveLocalAsset,
  writeLocalProfile
} from "./localEditorStore";
import {
  createProfile,
  defaultProfile,
  isReservedPath,
  normalizeHandle,
  type LinkItem,
  type LinkProfile
} from "./profile";
import { ProfilePage } from "./PublicProfile";

type SessionState = {
  authenticated: boolean;
  handle: string | null;
  name?: string | null;
  provider?: "google" | "twitter" | null;
  storage: "backend" | "offline";
};

type InitialState = {
  pathname: string;
  profile: LinkProfile | null;
  session: SessionState;
};

type AppProps = {
  initialState: InitialState;
};

async function loadSession(): Promise<SessionState> {
  const response = await fetch("/api/session");
  if (!response.ok) {
    throw new Error("Backend unavailable");
  }

  return response.json() as Promise<SessionState>;
}

async function loadMyProfile(): Promise<LinkProfile | null> {
  const response = await fetch("/api/profile");
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Profile API unavailable");
  return response.json() as Promise<LinkProfile>;
}

async function saveProfile(profile: LinkProfile): Promise<void> {
  const response = await fetch("/api/profile", {
    body: JSON.stringify(profile),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PUT"
  });

  if (!response.ok) {
    throw new Error("Backend save failed");
  }
}

function HomePage() {
  return (
    <main className="public-page">
      <section className="public-profile">
        <p className="eyebrow">Link Outpost</p>
        <h1>Personal links, portable by default.</h1>
        <p className="bio">
          Build a link page offline, export it as a static ZIP, or sign in later
          and publish the same data to a handle-backed SSR page.
        </p>
        <a className="primary-link" href="/admin">Open editor</a>
      </section>
    </main>
  );
}

function ProfilePreview({ profile }: { profile: LinkProfile }) {
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
    <section className="preview" aria-label="Profile preview">
      {avatarUrl && <img alt="" className="profile-avatar" src={avatarUrl} />}
      <p className="handle">@{profile.handle || "your_handle"}</p>
      <h2>{profile.title || defaultProfile.title}</h2>
      <p>{profile.bio || defaultProfile.bio}</p>
      <div className="public-links">
        {profile.links.map((link) => (
          <a href={link.url || "#"} key={link.id} rel="noreferrer" target="_blank">
            {link.label || "Untitled link"}
          </a>
        ))}
      </div>
    </section>
  );
}

function EditorPage({ initialSession }: { initialSession: SessionState }) {
  const [session, setSession] = useState(initialSession);
  const [profile, setProfile] = useState<LinkProfile>(() => createProfile());
  const [mode, setMode] = useState<"loading" | "offline" | "backend">("loading");
  const [status, setStatus] = useState("Loading editor");

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
    if (mode === "offline") {
      void writeLocalProfile(profile);
    }
  }, [mode, profile]);

  const profileUrl = useMemo(() => `/${profile.handle || "your_handle"}`, [profile.handle]);

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
    const blob = await buildStaticZip(profile);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.handle || "linkoutpost"}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Static ZIP exported");
  }

  return (
    <main className="editor-shell">
      <section className="editor-toolbar">
        <div>
          <p className="eyebrow">{mode === "backend" ? "Signed in" : "Offline"}</p>
          <h1>Link editor</h1>
          <p>{status}</p>
        </div>
        <div className="toolbar-actions">
          {mode !== "backend" && (
            <>
              <a href="/api/auth/google/start">Google login</a>
              <a href="/api/auth/twitter/start">Twitter login</a>
            </>
          )}
          <button onClick={onSave} type="button">Save</button>
          <button onClick={onExport} type="button">Export ZIP</button>
          {mode === "backend" && (
            <>
              <a href={profileUrl}>View page</a>
              <a href="/api/logout">Logout</a>
            </>
          )}
        </div>
      </section>

      <div className="editor-grid">
        <section className="form-panel" aria-label="Profile form">
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
          <label>
            Title
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
              rows={4}
            />
          </label>
          <label>
            Avatar image
            <input
              accept="image/*"
              onChange={(event) => {
                void onAvatarChange(event.currentTarget.files?.[0] ?? null);
              }}
              type="file"
            />
          </label>

          <div className="section-heading">
            <h2>Links</h2>
            <button onClick={addLink} type="button">Add</button>
          </div>

          <div className="link-list">
            {profile.links.map((link) => (
              <div className="link-row" key={link.id}>
                <input
                  aria-label="Link label"
                  value={link.label}
                  onChange={(event) => updateLink(link.id, { label: event.target.value })}
                />
                <input
                  aria-label="Link URL"
                  value={link.url}
                  onChange={(event) => updateLink(link.id, { url: event.target.value })}
                />
                <button onClick={() => removeLink(link.id)} type="button">Remove</button>
              </div>
            ))}
          </div>
        </section>

        <ProfilePreview profile={profile} />
      </div>
    </main>
  );
}

export function App({ initialState }: AppProps) {
  const pathname = initialState.pathname;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <EditorPage initialSession={initialState.session} />;
  }

  if (pathname === "/") {
    return <HomePage />;
  }

  const handle = normalizeHandle(pathname.split("/").filter(Boolean)[0] ?? "");
  if (!handle || isReservedPath(handle)) {
    return <ProfilePage profile={null} />;
  }

  return <ProfilePage profile={initialState.profile} />;
}

export type { InitialState, SessionState };
