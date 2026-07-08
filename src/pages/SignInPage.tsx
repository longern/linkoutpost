import { useEffect, useState } from "react";
import { FaRightToBracket } from "react-icons/fa6";
import { loadSession } from "../apiClient";
import { SiteTopbar } from "../components/SiteTopbar";
import { normalizeHandle } from "../profile";
import { siteTitle } from "../siteConfig";
import type { SessionState } from "../types";

function authErrorMessage(searchParams: URLSearchParams): string | null {
  switch (searchParams.get("error")) {
    case "oauth_state":
      return "Sign-in session expired.";
    case "oauth_provider":
      return "Sign-in was cancelled or denied.";
    case "oauth_callback":
      return "The sign-in callback was incomplete. Please start again.";
    case "oauth_unavailable":
      return "This sign-in method is currently unavailable.";
    case "oauth_failed":
      return "Sign-in could not be completed right now.";
    default:
      return null;
  }
}

export function SignInPage({ initialSession }: { initialSession: SessionState }) {
  const [session, setSession] = useState(initialSession);
  const [requestedHandle, setRequestedHandle] = useState(() =>
    typeof window === "undefined"
      ? ""
      : normalizeHandle(new URLSearchParams(window.location.search).get("create") ?? ""),
  );
  const [authError, setAuthError] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : authErrorMessage(new URLSearchParams(window.location.search)),
  );

  useEffect(() => {
    let cancelled = false;
    const searchParams = new URLSearchParams(window.location.search);
    setRequestedHandle(normalizeHandle(searchParams.get("create") ?? ""));
    setAuthError(authErrorMessage(searchParams));

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

  function authStartHref(provider: "google" | "twitter"): string {
    const redirectTo = requestedHandle
      ? `/admin?create=${encodeURIComponent(requestedHandle)}`
      : "/admin";
    return `/api/auth/${provider}/start?redirect_to=${encodeURIComponent(redirectTo)}`;
  }

  function authProviderAction(provider: "google" | "twitter", label: string) {
    const enabled = session.authProviders?.[provider] ?? false;
    const content = (
      <>
        <FaRightToBracket aria-hidden="true" size={16} />
        {label}
      </>
    );

    return enabled ? (
      <a className="button-secondary auth-provider-link" href={authStartHref(provider)}>
        {content}
      </a>
    ) : (
      <button className="button-secondary auth-provider-link" disabled type="button">
        {content}
      </button>
    );
  }

  return (
    <>
      <SiteTopbar currentPath="/signin" signedIn={session.authenticated} />
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-kicker">{siteTitle} account</p>
          <h1>Sign in</h1>
          <p>Manage multiple handles, keep your pages synced, and publish them from one account.</p>
          {authError ? (
            <p className="auth-error" role="alert">
              {authError}
            </p>
          ) : null}
          <div className="auth-actions">
            {authProviderAction("google", "Continue with Google")}
            {authProviderAction("twitter", "Continue with Twitter")}
          </div>
          <a className="auth-secondary-link" href="/admin">Continue with local editor</a>
        </section>
      </main>
    </>
  );
}
