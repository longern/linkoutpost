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
            <h1>Your own free, portable link page.</h1>
            <p>
              Create a hosted handle page online, then use the local editor and static export
              when you want your own domain or static file hosting.
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
            <h2 id="home-difference-title">Hosted by default, portable when you need it.</h2>
          </div>
          <div className="home-feature-grid">
            <article className="home-feature">
              <FaServer aria-hidden="true" size={20} />
              <h3>Free hosted pages</h3>
              <p>Publish a public handle page online without setting up a server, storage, or deployment pipeline.</p>
            </article>
            <article className="home-feature">
              <FaDownload aria-hidden="true" size={20} />
              <h3>Self-host when needed</h3>
              <p>Export a static ZIP for your own domain, object storage, CDN, or any static file host.</p>
            </article>
            <article className="home-feature">
              <FaLayerGroup aria-hidden="true" size={20} />
              <h3>Multiple handles</h3>
              <p>Use one account to manage separate pages for projects, profiles, launches, or clients.</p>
            </article>
            <article className="home-feature">
              <FaLock aria-hidden="true" size={20} />
              <h3>Works before login</h3>
              <p>Try the editor with browser-local data first, then sign in when you are ready to publish online.</p>
            </article>
          </div>
        </section>

        <section className="home-workflow" aria-label="Publishing workflow">
          <div>
            <span>1</span>
            <h3>Claim a handle</h3>
            <p>Start with a free hosted public page.</p>
          </div>
          <div>
            <span>2</span>
            <h3>Edit online</h3>
            <p>Keep your page synced to your account.</p>
          </div>
          <div>
            <span>3</span>
            <h3>Export if needed</h3>
            <p>Move to your own static hosting anytime.</p>
          </div>
        </section>

        <footer className="home-footer">
          <div>
            <a className="site-brand" href="/">{siteTitle}</a>
            <p>Free hosted link pages with a static export path for self-hosting.</p>
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
