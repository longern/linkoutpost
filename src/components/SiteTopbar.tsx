import { siteTitle } from "../siteConfig";

export function SiteTopbar({
  currentPath,
  signedIn
}: {
  currentPath?: string;
  signedIn: boolean;
}) {
  return (
    <header className="site-topbar">
      <a className="site-brand" href="/">{siteTitle}</a>
      <nav className="site-nav" aria-label="Account">
        {signedIn ? (
          <>
            <a className="button-primary button-pill site-nav-primary" href="/admin">Admin</a>
            <a href="/api/logout">Log out</a>
          </>
        ) : (
          <>
            <a href="/admin">Local editor</a>
            {currentPath !== "/signin" && <a href="/signin">Sign in</a>}
            <a className="button-primary button-pill site-nav-primary" href="/signin">Sign up</a>
          </>
        )}
      </nav>
    </header>
  );
}
