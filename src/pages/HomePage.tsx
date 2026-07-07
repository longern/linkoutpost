import { useEffect, useState, type FormEvent } from "react";
import { FaBolt, FaDownload, FaFileExport, FaServer } from "react-icons/fa6";
import { loadSession } from "../apiClient";
import { SiteTopbar } from "../components/SiteTopbar";
import {
  hostedHandleMinLength,
  isHostedHandleTooShort,
  isReservedPath,
  normalizeHandle,
  type SocialPlatform,
} from "../profile";
import { siteTitle } from "../siteConfig";
import { getSocialPlatformIcon } from "../socialIcons";
import type { SessionState } from "../types";

const previewCards = [
  {
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e0/Henri_Fantin-Latour_-_Portrait_of_a_Woman_MET_DP265190.jpg",
    bannerUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/96/WV_banner_Central_Haiti_Landscape_in_Kenscoff.jpg",
    bio: "Field notes, visual essays, and archival fragments.",
    handle: "@mira",
    links: ["Field journal", "Image archive", "Studio contact"],
    name: "Mira Chen",
    socials: [
      "instagram",
      "medium",
      "pinterest",
      "email",
    ] satisfies SocialPlatform[],
  },
  {
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/67/Scott_James_Reeves_Portrait_%E2%80%93_Professional_Headshot_of_Scott_James_Reeves_in_Blue_Blazer.jpg",
    bannerUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f1/Apple-desk-office-technology_%2824218133962%29.jpg",
    bio: "Product notes, advisory links, and launch updates.",
    handle: "@alex",
    links: ["Product brief", "Advisory calls", "Recent work"],
    name: "Alex Morgan",
    socials: ["linkedin", "github", "x", "website"] satisfies SocialPlatform[],
  },
];
const previewLoopCards = [
  { ...previewCards[0], copy: false },
  { ...previewCards[1], copy: false },
  { ...previewCards[0], copy: true },
  { ...previewCards[1], copy: true },
];

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

    if (isHostedHandleTooShort(handle)) {
      setHandleError(`Use at least ${hostedHandleMinLength} characters.`);
      return;
    }

    window.location.href = session.authenticated
      ? `/admin?create=${encodeURIComponent(handle)}`
      : `/signin?create=${encodeURIComponent(handle)}`;
  }

  return (
    <>
      <SiteTopbar signedIn={session.authenticated} />
      <main className="home-page">
        <section className="home-hero">
          <div className="home-hero-scene" aria-hidden="true">
            <div className="home-preview-shell">
              {previewLoopCards.map((card) => (
                <div
                  className={`home-preview-card home-preview-card-${card.handle.slice(1)}${card.copy ? " is-copy" : ""}`}
                  key={`${card.handle}-${card.copy ? "copy" : "original"}`}
                >
                  <div className="home-preview-banner">
                    <img alt="" draggable={false} src={card.bannerUrl} />
                  </div>
                  <div className="home-preview-content">
                    <img
                      alt=""
                      className="home-preview-avatar"
                      draggable={false}
                      src={card.avatarUrl}
                    />
                    <div className="home-preview-name">{card.name}</div>
                    <div className="home-preview-handle">{card.handle}</div>
                    <p className="home-preview-bio">{card.bio}</p>
                    <div className="home-preview-socials">
                      {card.socials.map((platform) => {
                        const Icon = getSocialPlatformIcon(platform);
                        return (
                          <span data-social-platform={platform} key={platform}>
                            <Icon aria-hidden="true" size={15} />
                          </span>
                        );
                      })}
                    </div>
                    {card.links.map((link) => (
                      <div className="home-preview-link" key={link}>
                        {link}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="home-hero-copy">
            <h1>Your own free, portable link page.</h1>
            <p>
              Create a hosted handle page online, then use the local editor and
              static export when you want your own domain or static file
              hosting.
            </p>
            <form className="home-handle-form" onSubmit={onGetStarted}>
              <div className="home-handle-field">
                <span>{host || "your-site"}/</span>
                <input
                  aria-label="Handle"
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  name="handle"
                  onChange={(event) => {
                    setHandleDraft(normalizeHandle(event.currentTarget.value));
                    setHandleError(null);
                  }}
                  spellCheck={false}
                  value={handleDraft}
                />
              </div>
              <button className="button-primary" type="submit">
                Get Started
              </button>
              <p
                className="home-handle-error"
                role={handleError ? "alert" : undefined}
              >
                {handleError ?? ""}
              </p>
            </form>
          </div>
        </section>

        <section
          className="home-section"
          aria-labelledby="home-difference-title"
        >
          <div className="home-section-heading">
            <h2 id="home-difference-title">
              Create quickly, host free, stay portable.
            </h2>
          </div>
          <div className="home-feature-grid">
            <article className="home-feature">
              <FaBolt aria-hidden="true" size={20} />
              <h3>Quick to create</h3>
              <p>
                Start from a simple editor, add your links and profile details,
                and get a clean page ready fast.
              </p>
            </article>
            <article className="home-feature">
              <FaServer aria-hidden="true" size={20} />
              <h3>Free hosted pages</h3>
              <p>
                Sign up when you want LinkOutpost to host and publish your
                public handle page for free.
              </p>
            </article>
            <article className="home-feature">
              <FaDownload aria-hidden="true" size={20} />
              <h3>Exportable by design</h3>
              <p>
                Create locally without logging in, then download your profile
                data, images, and page files.
              </p>
            </article>
            <article className="home-feature">
              <FaFileExport aria-hidden="true" size={20} />
              <h3>Ready for self-hosting</h3>
              <p>
                Deploy the rendered static page to your own domain, CDN, object
                storage, or static host.
              </p>
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
            <a className="site-brand" href="/">
              {siteTitle}
            </a>
            <p>
              Free hosted link pages with a static export path for self-hosting.
            </p>
          </div>
          <nav aria-label="Footer">
            <a
              href="https://github.com/longern/linkoutpost"
              rel="noreferrer noopener"
              target="_blank"
            >
              Source
            </a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/license">License</a>
          </nav>
        </footer>
      </main>
    </>
  );
}
