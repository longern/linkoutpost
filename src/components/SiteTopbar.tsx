export function SiteTopbar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="site-topbar">
      <a className="site-brand" href="/">LinkOutpost</a>
      <nav className="site-nav" aria-label="Account">
        {signedIn ? (
          <>
            <a href="/admin">Admin</a>
            <a href="/api/logout">Sign out</a>
          </>
        ) : (
          <>
            <a href="/admin">Local editor</a>
            <a href="/signin">Sign in</a>
            <a href="/signin">Sign up</a>
          </>
        )}
      </nav>
    </header>
  );
}
