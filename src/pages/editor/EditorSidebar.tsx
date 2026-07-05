import {
  FaBell,
  FaCircleUser,
  FaLayerGroup,
  FaPalette,
  FaPlus,
} from "react-icons/fa6";
import type { LinkProfile } from "../../profile";
import type { ProfileSummary } from "../../types";
import { AccountHandleMenu } from "./AccountHandleMenu";

export type EditorPanel = "links" | "layout" | "design" | "profile";

type EditorSidebarProps = {
  accountMenuOpen: boolean;
  activePanel: EditorPanel;
  avatarUrl: string | null;
  mobileOpen: boolean;
  mode: "loading" | "offline" | "backend";
  onAccountMenuOpenChange(open: boolean): void;
  onCreateHandle(): void;
  onDeleteProfile(handle: string): void;
  onImportZip(): void;
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
  onDeleteProfile,
  onImportZip,
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
                <FaCircleUser size={24} />
              )}
            </span>
            <span>@{profile.handle || "your_handle"}</span>
          </button>
          <FaBell aria-hidden="true" className="sidebar-bell" size={18} />
          {accountMenuOpen && (
            <>
              <button
                aria-hidden="true"
                className="account-menu-backdrop"
                onClick={() => onAccountMenuOpenChange(false)}
                tabIndex={-1}
                type="button"
              />
              <AccountHandleMenu
                mode={mode}
                onClose={() => onAccountMenuOpenChange(false)}
                onCreateHandle={onCreateHandle}
                onDeleteProfile={onDeleteProfile}
                onImportZip={onImportZip}
                onSelectProfile={onSelectProfile}
                profile={profile}
                profileSummaries={profileSummaries}
              />
            </>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Editor sections">
          <button
            className={`sidebar-nav-item${activePanel === "profile" ? " active" : ""}`}
            onClick={() => selectPanel("profile")}
            type="button"
          >
            <FaCircleUser aria-hidden="true" size={16} />
            Profile
          </button>
          <button
            className={`sidebar-nav-item${activePanel === "links" ? " active" : ""}`}
            onClick={() => selectPanel("links")}
            type="button"
          >
            <FaPlus aria-hidden="true" size={16} />
            Links
          </button>
          <button
            className={`sidebar-nav-item${activePanel === "layout" ? " active" : ""}`}
            onClick={() => selectPanel("layout")}
            type="button"
          >
            <FaLayerGroup aria-hidden="true" size={16} />
            Layout
          </button>
          <button
            className={`sidebar-nav-item${activePanel === "design" ? " active" : ""}`}
            onClick={() => selectPanel("design")}
            type="button"
          >
            <FaPalette aria-hidden="true" size={16} />
            Design
          </button>
        </nav>
      </aside>
    </>
  );
}
