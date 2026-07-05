import { useEffect, useState, type FormEvent } from "react";
import { FaDownload, FaLayerGroup, FaLock, FaServer } from "react-icons/fa6";
import { loadSession } from "../apiClient";
import { SiteTopbar } from "../components/SiteTopbar";
import { isReservedPath, normalizeHandle } from "../profile";
import { siteTitle } from "../siteConfig";
import type { SessionState } from "../types";

export function HomePage({ initialSession }: { initialSession: SessionState }) {
  const [session, setSession] = useState(initialSession);
  const [host, setHost] = useState("");
  const [handleDraft, setHandleDraft] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHost(window.location.host);

    loadSession()
      .then((nextSession) => {
        if (!cancelled) setSession(nextSession);
      })
      .catch(() => {
        if (!cancelled) setSession(initialSession);
      });

    return () => {
      cancelled = true;
    };
  }, [initialSession]);

  function onGetStarted(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const handle = normalizeHandle(handleDraft);
    if (!handle || isReservedPath(handle)) {
      setHandleError("Choose a valid handle.");
      return;
    }

    window.location.href = session.authenticated
      ? `/admin?setup=handle&handle=${encodeURIComponent(handle)}`
      : `/signin?handle=${encodeURIComponent(handle)}`;
  }

  return (
    <>
      <SiteTopbar signedIn={session.authenticated} />
      <main className="home-page">
        <section className="home-hero">
          <div className="home-hero-scene" aria-hidden="true">
            <div className="home-preview-shell">
              <div className="home-preview-phone">
                <div className="home-preview-avatar" />
                <div className="home-preview-name">Your Name</div>
                <div className="home-preview-handle">@your_handle</div>
                <div className="home-preview-link">Website</div>
                <div className="home-preview-link">Newsletter</div>
                <div className="home-preview-link">Latest project</div>
              </div>
            </div>
          </div>
          <div className="home-hero-copy">
            <p className="home-kicker">{siteTitle}</p>
            <h1>Link pages you can take with you.</h1>
            <p>
              Build personal link pages locally, export them as static sites, or publish them
              with hosted handles when you are ready.
            </p>
            <form className="home-handle-form" onSubmit={onGetStarted}>
              <div className="home-handle-field">
                <span>{host || "your-site"}/</span>
                <input
                  aria-label="Handle"
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  onChange={(event) => {
                    setHandleDraft(normalizeHandle(event.currentTarget.value));
                    setHandleError(null);
                  }}
                  placeholder="your_handle"
                  spellCheck={false}
                  value={handleDraft}
                />
              </div>
              <button className="button-primary" type="submit">Get Started</button>
              {handleError && <p className="home-handle-error">{handleError}</p>}
            </form>
          </div>
        </section>

        <section className="home-section" aria-labelledby="home-difference-title">
          <div className="home-section-heading">
            <p className="home-kicker">Why it is different</p>
            <h2 id="home-difference-title">Built for ownership, not just a hosted profile.</h2>
          </div>
          <div className="home-feature-grid">
            <article className="home-feature">
              <FaLock aria-hidden="true" size={20} />
              <h3>Works before login</h3>
              <p>Edit with browser-local data when the backend is unavailable or you do not want an account yet.</p>
            </article>
            <article className="home-feature">
              <FaDownload aria-hidden="true" size={20} />
              <h3>Exports a real site</h3>
              <p>Download a static ZIP that renders the same public page without depending on {siteTitle}.</p>
            </article>
            <article className="home-feature">
              <FaLayerGroup aria-hidden="true" size={20} />
              <h3>Multiple handles</h3>
              <p>Use one account to manage separate pages for projects, profiles, launches, or clients.</p>
            </article>
            <article className="home-feature">
              <FaServer aria-hidden="true" size={20} />
              <h3>SSR when published</h3>
              <p>Signed-in pages are stored in D1 and rendered by handle for fast, shareable public URLs.</p>
            </article>
          </div>
        </section>

        <section className="home-workflow" aria-label="Publishing workflow">
          <div>
            <span>1</span>
            <h3>Edit locally</h3>
            <p>Start with a private browser draft.</p>
          </div>
          <div>
            <span>2</span>
            <h3>Choose a path</h3>
            <p>Export a ZIP or sign in to sync.</p>
          </div>
          <div>
            <span>3</span>
            <h3>Publish handles</h3>
            <p>Manage every public page from one account.</p>
          </div>
        </section>

        <footer className="home-footer">
          <div>
            <a className="site-brand" href="/">{siteTitle}</a>
            <p>Portable link pages for local drafts, static exports, and hosted publishing.</p>
          </div>
          <nav aria-label="Footer">
            <a href="/admin">Editor</a>
            <a href="/signin">Sign in</a>
            <a href="/signin">Sign up</a>
          </nav>
        </footer>
      </main>
    </>
  );
}
