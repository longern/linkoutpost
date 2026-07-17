import { siteTitle } from "../siteConfig";
import { AppThemeToggle } from "./AppThemeToggle";

export function SiteTopbar({
  currentPath,
  showThemeToggle = true,
  signedIn,
}: {
  currentPath?: string;
  showThemeToggle?: boolean;
  signedIn: boolean;
}) {
  return (
    <header className="site-topbar">
      <a className="site-brand" href="/">{siteTitle}</a>
      <nav className="site-nav" aria-label="Account">
        {showThemeToggle && <AppThemeToggle />}
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
