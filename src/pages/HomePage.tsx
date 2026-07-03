import { useEffect, useState } from "react";
import { loadSession } from "../apiClient";
import { SiteTopbar } from "../components/SiteTopbar";
import type { SessionState } from "../types";

export function HomePage({ initialSession }: { initialSession: SessionState }) {
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
      <SiteTopbar signedIn={session.authenticated} />
      <main className="home-page">
        <section className="home-card">
          <p className="eyebrow">Link Outpost</p>
          <h1>Personal links, portable by default.</h1>
          <p className="bio">
            Build a link page offline, export it as a static ZIP, or sign in later
            and publish the same data to a handle-backed SSR page.
          </p>
          <a className="primary-link" href="/admin">Open editor</a>
        </section>
      </main>
    </>
  );
}
