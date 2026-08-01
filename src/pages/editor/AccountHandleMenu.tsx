import type { LinkProfile } from "../../profile";
import type { ProfileSummary } from "../../types";
import { useTranslation } from "../../i18n";

type AccountHandleMenuProps = {
  className?: string;
  mode: "loading" | "offline" | "backend";
  onClose(): void;
  onCreateHandle(): void;
  onSelectProfile(handle: string): void;
  profile: LinkProfile;
  profileSummaries: ProfileSummary[];
};

export function AccountHandleMenu({
  className,
  mode,
  onClose,
  onCreateHandle,
  onSelectProfile,
  profile,
  profileSummaries,
}: AccountHandleMenuProps) {
  const { t } = useTranslation();
  const summaries = profileSummaries;

  return (
    <ul className={`account-menu${className ? ` ${className}` : ""}`} role="menu">
      {mode !== "loading" && (
        <>
          {summaries.map((summary) => (
            <li key={summary.handle} role="none">
              <button
                className={`account-menu-item${summary.handle === profile.handle ? " is-active" : ""}`}
                onClick={() => {
                  onClose();
                  onSelectProfile(summary.handle);
                }}
                role="menuitem"
                type="button"
              >
                @{summary.handle}
              </button>
            </li>
          ))}
          <li role="none">
            <button
              className="account-menu-item"
              onClick={() => {
                onClose();
                onCreateHandle();
              }}
              role="menuitem"
              type="button"
            >
              {t("editor.forms.createHandle")}
            </button>
          </li>
          {mode === "backend" && (
            <>
              <li
                aria-hidden="true"
                className="account-menu-divider"
                role="separator"
              />
              <li role="none">
                <a
                  className="account-menu-item danger"
                  href="/api/logout"
                  role="menuitem"
                >
                  {t("navigation.logOut")}
                </a>
              </li>
            </>
          )}
        </>
      )}
      {mode === "loading" && (
        <li role="none">
          <span className="account-menu-item" role="menuitem">
            {profile.handle
              ? `@${profile.handle}`
              : t("editor.forms.noHandle")}
          </span>
        </li>
      )}
    </ul>
  );
}
