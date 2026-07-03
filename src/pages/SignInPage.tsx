import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { loadSession } from "../apiClient";
import { SiteTopbar } from "../components/SiteTopbar";
import type { SessionState } from "../types";

export function SignInPage({ initialSession }: { initialSession: SessionState }) {
  const [session, setSession] = useState(initialSession);

  useEffect(() => {
    let cancelled = false;

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

  return (
    <>
      <SiteTopbar currentPath="/signin" signedIn={session.authenticated} />
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-kicker">LinkOutpost account</p>
          <h1>Sign in</h1>
          <p>Manage multiple handles, keep your pages synced, and publish them from one account.</p>
          <div className="auth-actions">
            <a className="action-button auth-provider-link" href="/api/auth/google/start">
              <LogIn aria-hidden="true" size={16} />
              Continue with Google
            </a>
            <a className="action-button auth-provider-link" href="/api/auth/twitter/start">
              <LogIn aria-hidden="true" size={16} />
              Continue with Twitter
            </a>
          </div>
          <a className="auth-secondary-link" href="/admin">Continue with local editor</a>
        </section>
      </main>
    </>
  );
}
