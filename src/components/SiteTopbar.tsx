import { useTranslation } from "../i18n";
import { siteTitle } from "../siteConfig";

export function SiteTopbar({
  currentPath,
  signedIn
}: {
  currentPath?: string;
  signedIn: boolean;
}) {
  const { t } = useTranslation();

  return (
    <header className="site-topbar">
      <a className="site-brand" href="/">{siteTitle}</a>
      <nav className="site-nav" aria-label={t("navigation.account")}>
        {signedIn ? (
          <>
            <a className="button-primary button-pill site-nav-primary" href="/admin">
              {t("navigation.admin")}
            </a>
            <a href="/api/logout">{t("navigation.logOut")}</a>
          </>
        ) : (
          <>
            <a href="/admin">{t("navigation.localEditor")}</a>
            {currentPath !== "/signin" && (
              <a href="/signin">{t("navigation.signIn")}</a>
            )}
            <a className="button-primary button-pill site-nav-primary" href="/signin">
              {t("navigation.signUp")}
            </a>
          </>
        )}
      </nav>
    </header>
  );
}
