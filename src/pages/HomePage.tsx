import { useEffect, useState, type FormEvent } from "react";
import { loadSession } from "../apiClient";
import { AppLanguageSelect } from "../components/AppLanguageSelect";
import { SiteTopbar } from "../components/SiteTopbar";
import { useTranslation } from "../i18n";
import {
  hostedHandleMinLength,
  isHostedHandleTooShort,
  isReservedPath,
  normalizeHandle,
} from "../profile";
import { siteTitle } from "../siteConfig";
import type { SessionState } from "../types";

const previewCards = [
  {
    imageUrl: "/assets/canine-preview-tg.jpg",
    key: "tg",
  },
  {
    imageUrl: "/assets/canine-preview-kurotakeshi.jpg",
    key: "kurotakeshi",
  },
];
const previewLoopCards = [
  { ...previewCards[0], copy: false },
  { ...previewCards[1], copy: false },
  { ...previewCards[0], copy: true },
  { ...previewCards[1], copy: true },
];

export function HomePage({ initialSession }: { initialSession: SessionState }) {
  const { t } = useTranslation();
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
      setHandleError(t("validation.invalidHandle"));
      return;
    }

    if (isHostedHandleTooShort(handle)) {
      setHandleError(
        t("validation.minimumHandle", { count: hostedHandleMinLength }),
      );
      return;
    }

    window.location.href = session.authenticated
      ? `/admin?create=${encodeURIComponent(handle)}`
      : `/signin?create=${encodeURIComponent(handle)}`;
  }

  return (
    <div className="app-theme-dark home-theme-dark">
      <SiteTopbar
        showThemeToggle={false}
        signedIn={session.authenticated}
      />
      <main className="home-page">
        <section className="home-hero">
          <div className="home-hero-scene" aria-hidden="true">
            <div className="home-preview-shell">
              {previewLoopCards.map((card) => (
                <div
                  className={`home-preview-card home-preview-card-${card.key}${card.copy ? " is-copy" : ""}`}
                  key={`${card.key}-${card.copy ? "copy" : "original"}`}
                >
                  <img
                    alt=""
                    className="home-preview-card-image"
                    draggable={false}
                    src={card.imageUrl}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="home-hero-copy">
            <h1>
              {t("home.hero.titleLine1")}
              <br />
              {t("home.hero.titleLine2")}
            </h1>
            <p>
              {t("home.hero.descriptionLine1")}
              <br />
              {t("home.hero.descriptionLine2")}
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
                {t("home.hero.getStarted")}
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

        <footer className="home-footer">
          <div>
            <a className="site-brand" href="/">
              {siteTitle}
            </a>
            <p>{t("home.footer.description")}</p>
          </div>
          <nav aria-label={t("home.footer.label")}>
            <a href="/privacy">{t("home.footer.privacy")}</a>
            <a href="/terms">{t("home.footer.terms")}</a>
            <AppLanguageSelect className="home-language-select" />
          </nav>
          <p className="home-footer-copyright">
            Created by 龙忍 · © 2026 CanineTeeth. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
