import { useEffect, useState } from "react";
import { FaRightToBracket } from "react-icons/fa6";
import { loadSession } from "../apiClient";
import { SiteTopbar } from "../components/SiteTopbar";
import { normalizeHandle } from "../profile";
import { siteTitle } from "../siteConfig";
import type { SessionState } from "../types";

export function SignInPage({ initialSession }: { initialSession: SessionState }) {
  const [session, setSession] = useState(initialSession);
  const [requestedHandle, setRequestedHandle] = useState(() =>
    typeof window === "undefined"
      ? ""
      : normalizeHandle(new URLSearchParams(window.location.search).get("handle") ?? ""),
  );

  useEffect(() => {
    let cancelled = false;
    setRequestedHandle(
      normalizeHandle(new URLSearchParams(window.location.search).get("handle") ?? ""),
    );

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
      ? `/admin?setup=handle&handle=${encodeURIComponent(requestedHandle)}`
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
