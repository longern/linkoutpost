import type { LinkProfile } from "../../profile";
import type { ProfileSummary } from "../../types";

type AccountHandleMenuProps = {
  className?: string;
  mode: "loading" | "offline" | "backend";
  onClose(): void;
  onCreateHandle(): void;
  onDeleteProfile(handle: string): void;
  onImportZip(): void;
  onSelectProfile(handle: string): void;
  profile: LinkProfile;
  profileSummaries: ProfileSummary[];
};

export function AccountHandleMenu({
  className,
  mode,
  onClose,
  onCreateHandle,
  onDeleteProfile,
  onImportZip,
  onSelectProfile,
  profile,
  profileSummaries,
}: AccountHandleMenuProps) {
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
              Create new handle
            </button>
          </li>
          <li aria-hidden="true" className="account-menu-divider" role="separator" />
          <li role="none">
            <button
              className="account-menu-item"
              onClick={() => {
                onClose();
                onImportZip();
              }}
              role="menuitem"
              type="button"
            >
              Import ZIP
            </button>
          </li>
          {mode === "backend" && (
            <li role="none">
              <a className="account-menu-item" href="/api/logout" role="menuitem">
                Logout
              </a>
            </li>
          )}
          {mode === "offline" && profile.handle && (
            <li role="none">
              <button
                className="account-menu-item"
                onClick={() => {
                  onClose();
                  onDeleteProfile(profile.handle);
                }}
                role="menuitem"
                type="button"
              >
                Delete @{profile.handle}
              </button>
            </li>
          )}
        </>
      )}
      {mode === "loading" && (
        <li role="none">
          <span className="account-menu-item" role="menuitem">
            {profile.handle ? `@${profile.handle}` : "No handle"}
          </span>
        </li>
      )}
    </ul>
  );
}
