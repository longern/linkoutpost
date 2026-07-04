import { Bell, LayoutTemplate, Palette, Plus, UserCircle } from "lucide-react";
import type { LinkProfile } from "../../profile";
import type { ProfileSummary } from "../../types";

export type EditorPanel = "links" | "layout" | "design" | "profile";

type EditorSidebarProps = {
  accountMenuOpen: boolean;
  activePanel: EditorPanel;
  avatarUrl: string | null;
  mobileOpen: boolean;
  mode: "loading" | "offline" | "backend";
  onAccountMenuOpenChange(open: boolean): void;
  onCreateHandle(): void;
  onMobileOpenChange(open: boolean): void;
  onPanelChange(panel: EditorPanel): void;
  onSelectProfile(handle: string): void;
  profile: LinkProfile;
  profileSummaries: ProfileSummary[];
};

export function EditorSidebar({
  accountMenuOpen,
  activePanel,
  avatarUrl,
  mobileOpen,
  mode,
  onAccountMenuOpenChange,
  onCreateHandle,
  onMobileOpenChange,
  onPanelChange,
  onSelectProfile,
  profile,
  profileSummaries,
}: EditorSidebarProps) {
  function selectPanel(panel: EditorPanel): void {
    onPanelChange(panel);
    onMobileOpenChange(false);
  }

  return (
    <>
      <button
        aria-hidden="true"
        className={`editor-sidebar-backdrop${mobileOpen ? " is-visible" : ""}`}
        onClick={() => onMobileOpenChange(false)}
        tabIndex={-1}
        type="button"
      />

      <aside
        className={`editor-sidebar${mobileOpen ? " is-open" : ""}`}
        id="editor-sidebar"
        aria-label="Editor navigation"
      >
        <div className="sidebar-account">
          <button
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            className="account-menu-trigger"
            onClick={() => onAccountMenuOpenChange(!accountMenuOpen)}
            type="button"
          >
            <span className="account-menu-avatar" aria-hidden="true">
              {avatarUrl ? (
                <img alt="" src={avatarUrl} />
              ) : (
                <UserCircle size={24} />
              )}
            </span>
            <span>@{profile.handle || "your_handle"}</span>
          </button>
          <Bell aria-hidden="true" className="sidebar-bell" size={18} />
          {accountMenuOpen && (
            <>
              <button
                aria-hidden="true"
                className="account-menu-backdrop"
                onClick={() => onAccountMenuOpenChange(false)}
                tabIndex={-1}
                type="button"
              />
              <ul className="account-menu" role="menu">
                {mode === "backend" && (
                  <>
                    {(profileSummaries.length === 0
                      ? [{ handle: profile.handle || "your_handle", title: "" }]
                      : profileSummaries
                    ).map((summary) => (
                      <li key={summary.handle} role="none">
                        <button
                          className={`account-menu-item${summary.handle === profile.handle ? " is-active" : ""}`}
                          onClick={() => {
                            onAccountMenuOpenChange(false);
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
                          onAccountMenuOpenChange(false);
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
                      <a className="account-menu-item" href="/api/logout" role="menuitem">
                        Logout
                      </a>
                    </li>
                  </>
                )}
                {mode !== "backend" && (
                  <li role="none">
                    <span className="account-menu-item" role="menuitem">
                      @{profile.handle || "your_handle"}
                    </span>
                  </li>
                )}
              </ul>
            </>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Editor sections">
          <button
            className={`sidebar-nav-item${activePanel === "profile" ? " active" : ""}`}
            onClick={() => selectPanel("profile")}
            type="button"
          >
            <UserCircle aria-hidden="true" size={16} />
            Profile
          </button>
          <button
            className={`sidebar-nav-item${activePanel === "links" ? " active" : ""}`}
            onClick={() => selectPanel("links")}
            type="button"
          >
            <Plus aria-hidden="true" size={16} />
            Links
          </button>
          <button
            className={`sidebar-nav-item${activePanel === "layout" ? " active" : ""}`}
            onClick={() => selectPanel("layout")}
            type="button"
          >
            <LayoutTemplate aria-hidden="true" size={16} />
            Layout
          </button>
          <button
            className={`sidebar-nav-item${activePanel === "design" ? " active" : ""}`}
            onClick={() => selectPanel("design")}
            type="button"
          >
            <Palette aria-hidden="true" size={16} />
            Design
          </button>
        </nav>
      </aside>
    </>
  );
}
