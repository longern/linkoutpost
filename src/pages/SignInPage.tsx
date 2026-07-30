import { useEffect, useState } from "react";
import { FaRightToBracket } from "react-icons/fa6";
import { loadSession } from "../apiClient";
import { SiteTopbar } from "../components/SiteTopbar";
import { useTranslation } from "../i18n";
import { normalizeHandle } from "../profile";
import { siteTitle } from "../siteConfig";
import type { AuthProvider, SessionState } from "../types";

function authErrorKey(searchParams: URLSearchParams): string | null {
  switch (searchParams.get("error")) {
    case "email_expired":
      return "signIn.errors.emailExpired";
    case "email_failed":
      return "signIn.errors.emailFailed";
    case "email_invalid":
      return "signIn.errors.emailInvalid";
    case "oauth_state":
      return "signIn.errors.oauthState";
    case "oauth_provider":
      return "signIn.errors.oauthProvider";
    case "oauth_callback":
      return "signIn.errors.oauthCallback";
    case "oauth_unavailable":
      return "signIn.errors.oauthUnavailable";
    case "oauth_failed":
      return "signIn.errors.oauthFailed";
    default:
      return null;
  }
}

export function SignInPage({ initialSession }: { initialSession: SessionState }) {
  const { t } = useTranslation();
  const [session, setSession] = useState(initialSession);
  const [emailSent, setEmailSent] = useState(() =>
    typeof window === "undefined"
      ? false
      : new URLSearchParams(window.location.search).get("email_sent") === "1",
  );
  const [requestedHandle, setRequestedHandle] = useState(() =>
    typeof window === "undefined"
      ? ""
      : normalizeHandle(new URLSearchParams(window.location.search).get("create") ?? ""),
  );
  const [authError, setAuthError] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : authErrorKey(new URLSearchParams(window.location.search)),
  );

  useEffect(() => {
    let cancelled = false;
    const searchParams = new URLSearchParams(window.location.search);
    setEmailSent(searchParams.get("email_sent") === "1");
    setRequestedHandle(normalizeHandle(searchParams.get("create") ?? ""));
    setAuthError(authErrorKey(searchParams));

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

  function redirectToEditor(): string {
    return requestedHandle
      ? `/admin?create=${encodeURIComponent(requestedHandle)}`
      : "/admin";
  }

  function authStartHref(provider: Exclude<AuthProvider, "email">): string {
    const redirectTo = redirectToEditor();
    return `/api/auth/${provider}/start?redirect_to=${encodeURIComponent(redirectTo)}`;
  }

  function authProviderAction(
    provider: Exclude<AuthProvider, "email">,
    label: string,
  ) {
    const enabled = session.authProviders?.[provider] ?? false;
    if (!enabled) return null;

    return (
      <a className="button-secondary auth-provider-link" href={authStartHref(provider)}>
        <FaRightToBracket aria-hidden="true" size={16} />
        {label}
      </a>
    );
  }

  return (
    <>
      <SiteTopbar currentPath="/signin" signedIn={session.authenticated} />
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-kicker">
            {t("signIn.account", { siteTitle })}
          </p>
          <h1>{t("signIn.title")}</h1>
          <p>{t("signIn.description")}</p>
          {authError ? (
            <p className="auth-error" role="alert">
              {t(authError)}
            </p>
          ) : null}
          {emailSent ? (
            <p className="auth-notice" role="status">
              {t("signIn.emailSent")}
            </p>
          ) : null}
          {session.authProviders?.email ? (
            <form
              action={`/api/auth/email/start?redirect_to=${encodeURIComponent(redirectToEditor())}`}
              className="auth-email-form"
              method="post"
            >
              <label className="visually-hidden" htmlFor="signin-email">
                {t("signIn.emailAddress")}
              </label>
              <input
                autoComplete="email"
                className="auth-email-input"
                id="signin-email"
                inputMode="email"
                name="email"
                placeholder={t("signIn.emailAddress")}
                required
                type="email"
              />
              <button className="button-primary auth-email-submit" type="submit">
                {t("signIn.continue")}
              </button>
            </form>
          ) : null}
          <div className="auth-actions">
            {authProviderAction("google", t("signIn.continueWithGoogle"))}
            {authProviderAction("twitter", t("signIn.continueWithTwitter"))}
            {authProviderAction("shopify", t("signIn.continueWithShopify"))}
          </div>
          <a className="auth-secondary-link" href="/admin">
            {t("signIn.continueWithLocalEditor")}
          </a>
        </section>
      </main>
    </>
  );
}
