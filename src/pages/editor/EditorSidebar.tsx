import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaChevronDown,
  FaCircleUser,
  FaLayerGroup,
  FaPalette,
  FaPlus,
  FaTriangleExclamation,
} from "react-icons/fa6";
import type { LinkProfile } from "../../profile";
import type { ProfileSummary } from "../../types";
import { AccountHandleMenu } from "./AccountHandleMenu";
import { useAnimatedMenu } from "./useAnimatedMenu";

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
  const accountTriggerRef = useRef<HTMLButtonElement | null>(null);
  const accountMenuAnimation = useAnimatedMenu(accountMenuOpen);
  const [accountMenuPosition, setAccountMenuPosition] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!accountMenuAnimation.mounted) {
      setAccountMenuPosition(null);
      return;
    }

    function updatePosition(): void {
      const trigger = accountTriggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const width = Math.max(rect.width, 220);
      const left = Math.min(
        Math.max(12, rect.left),
        Math.max(12, window.innerWidth - width - 12),
      );

      setAccountMenuPosition({
        left,
        top: rect.bottom + 8,
        width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [accountMenuAnimation.mounted]);

  function selectPanel(panel: EditorPanel): void {
    onPanelChange(panel);
    onMobileOpenChange(false);
  }

  const accountMenuPortal =
    accountMenuAnimation.mounted && accountMenuPosition
      ? createPortal(
          <>
            <button
              aria-hidden="true"
              className="account-menu-backdrop"
              onClick={() => onAccountMenuOpenChange(false)}
              tabIndex={-1}
              type="button"
            />
            <div
              className="account-menu-layer"
              style={{
                left: accountMenuPosition.left,
                top: accountMenuPosition.top,
                width: accountMenuPosition.width,
              }}
            >
              <AccountHandleMenu
                className={`animated-menu${accountMenuAnimation.visible ? " is-open" : " is-closing"}`}
                mode={mode}
                onClose={() => onAccountMenuOpenChange(false)}
                onCreateHandle={onCreateHandle}
                onDeleteProfile={onDeleteProfile}
                onImportZip={onImportZip}
                onSelectProfile={onSelectProfile}
                profile={profile}
                profileSummaries={profileSummaries}
              />
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        aria-hidden="true"
        className={`editor-sidebar-backdrop${mobileOpen ? " is-visible" : ""}`}
        onClick={() => onMobileOpenChange(false)}
        tabIndex={-1}
        type="button"
      />

      {accountMenuPortal}

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
            ref={accountTriggerRef}
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
            <FaChevronDown
              aria-hidden="true"
              className={`account-menu-chevron${accountMenuOpen ? " is-open" : ""}`}
              size={12}
            />
          </button>
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

        {mode === "offline" && (
          <div className="sidebar-offline-notice" role="status">
            <strong>
              <FaTriangleExclamation aria-hidden="true" size={13} />
              Offline mode
            </strong>
            <p>Changes are saved locally. Export and deploy the static files manually to publish them.</p>
          </div>
        )}
      </aside>
    </>
  );
}
