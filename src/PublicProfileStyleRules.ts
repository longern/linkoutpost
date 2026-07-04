import type { GlobalStyleRule } from "@vanilla-extract/css";
export type PublicProfileStyleRule = {
  rule: GlobalStyleRule;
  selector: string;
};

export const publicProfileStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".public-page",
    rule: {
      alignItems: "stretch",
      display: "flex",
      justifyContent: "center",
      minHeight: "100vh",
      padding: 0,
      "@supports": {
        "(min-height: 100dvh)": {
          minHeight: "100dvh",
        },
      },
    },
  },
  {
    selector: ".public-profile",
    rule: {
      background:
        "var(--profile-background-color, var(--brand-page-background, #FFF8F3))",
      border: 0,
      borderRadius: 0,
      color: "var(--profile-text-color, var(--brand-text, #172033))",
      fontFamily: "var(--profile-font-family)",
      minHeight: "auto",
      padding: "32px 20px",
      position: "relative",
      width: "100%",
    },
  },
  {
    selector: ".circle-icon-button",
    rule: {
      background: "transparent",
      border: 0,
      borderRadius: 999,
      color: "currentColor",
      display: "inline-grid",
      flex: "0 0 auto",
      height: 40,
      padding: 0,
      placeItems: "center",
      transition: "background-color 160ms ease, color 160ms ease",
      width: 40,
    },
  },
  {
    selector: ".profile-share-button",
    rule: {
      color: "var(--profile-accent-color, var(--brand-accent, #B64222))",
      position: "absolute",
      right: 16,
      top: 16,
    },
  },
  {
    selector: ".profile-avatar, .profile-avatar-placeholder",
    rule: {
      border: "1px solid var(--brand-border, #E7D2C7)",
      borderRadius: 999,
      height: 96,
      margin: "18px auto",
      width: 96,
    },
  },
  {
    selector: ".profile-avatar",
    rule: {
      display: "block",
      objectFit: "cover",
    },
  },
  {
    selector: ".profile-avatar-placeholder",
    rule: {
      alignItems: "center",
      background:
        "color-mix(in srgb, var(--profile-accent-color, var(--brand-accent, #B64222)), transparent 90%)",
      color: "var(--profile-accent-color, var(--brand-accent, #B64222))",
      display: "flex",
      justifyContent: "center",
    },
  },
  {
    selector: ".eyebrow",
    rule: {
      color: "var(--profile-accent-color, var(--brand-accent, #B64222))",
      fontSize: "0.8rem",
      fontWeight: 700,
      letterSpacing: 0,
      margin: "0 0 8px",
      textAlign: "center",
      textTransform: "uppercase",
    },
  },
  {
    selector: ".profile-title",
    rule: {
      color: "inherit",
      fontSize: "1.5rem",
      letterSpacing: 0,
      lineHeight: 1.04,
      margin: "0 auto 8px",
      maxWidth: "13ch",
      textAlign: "center",
    },
  },
  {
    selector: ".handle",
    rule: {
      color: "var(--profile-accent-color, var(--brand-accent, #B64222))",
      fontSize: "0.95rem",
      fontWeight: 700,
      letterSpacing: 0,
      margin: "0 0 16px",
      textAlign: "center",
    },
  },
  {
    selector: ".bio",
    rule: {
      color: "#526070",
      margin: "16px 0 28px",
      maxWidth: "58ch",
    },
  },
  {
    selector: ".public-links",
    rule: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
    },
  },
  {
    selector: ".public-link",
    rule: {
      background:
        "var(--profile-button-background-color, var(--brand-raised-background, #FFFFFF))",
      border: 0,
      borderRadius: 8,
      boxShadow:
        "0 10px 15px -3px rgb(0 0 0 / 10%), 0 4px 6px -4px rgb(0 0 0 / 10%)",
      color: "var(--profile-button-text-color, var(--brand-text, #172033))",
      display: "block",
      overflowWrap: "anywhere",
      padding: "14px 16px",
      textAlign: "center",
      textDecoration: "none",
      transition:
        "background-color 160ms ease, box-shadow 160ms ease, color 160ms ease",
    },
  },
  {
    selector: ".public-link:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          boxShadow:
            "0 20px 25px -5px rgb(0 0 0 / 10%), 0 8px 10px -6px rgb(0 0 0 / 10%)",
        },
      },
    },
  },
  {
    selector: ".circle-icon-button:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background: "rgb(var(--brand-accent-rgb, 182 66 34) / 10%)",
        },
      },
    },
  },
  {
    selector: ".circle-icon-button:active",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background: "rgb(var(--brand-accent-rgb, 182 66 34) / 18%)",
        },
      },
    },
  },
  {
    selector: ".profile-share-button:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background:
            "color-mix(in srgb, var(--profile-accent-color, var(--brand-accent, #B64222)), transparent 88%)",
          color: "var(--profile-accent-color, var(--brand-accent, #B64222))",
        },
      },
    },
  },
  {
    selector: ".profile-share-button:active",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background:
            "color-mix(in srgb, var(--profile-accent-color, var(--brand-accent, #B64222)), transparent 80%)",
        },
      },
    },
  },
  {
    selector: ".profile-share-overlay",
    rule: {
      alignItems: "center",
      background: "rgb(16 24 39 / 0%)",
      display: "flex",
      inset: 0,
      justifyContent: "center",
      opacity: 0,
      padding: 20,
      pointerEvents: "none",
      position: "fixed",
      transition: "background-color 180ms ease, opacity 180ms ease",
      zIndex: 120,
    },
  },
  {
    selector: ".profile-share-overlay.is-open",
    rule: {
      background: "rgb(16 24 39 / 36%)",
      opacity: 1,
      pointerEvents: "auto",
    },
  },
  {
    selector: ".profile-share-panel",
    rule: {
      background: "var(--brand-raised-background, #ffffff)",
      borderRadius: 18,
      boxShadow: "0 24px 70px rgb(16 24 39 / 24%)",
      color: "var(--brand-text, #172033)",
      opacity: 0,
      padding: 18,
      position: "relative",
      touchAction: "none",
      transform: "translateY(12px) scale(0.98)",
      transition:
        "opacity 180ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      width: "min(100%, 360px)",
    },
  },
  {
    selector: ".profile-share-panel.is-dragging",
    rule: {
      transition: "none",
    },
  },
  {
    selector: ".profile-share-panel::before",
    rule: {
      background: "rgb(16 24 39 / 18%)",
      borderRadius: 999,
      content: '""',
      display: "none",
      height: 4,
      left: "50%",
      position: "absolute",
      top: 6,
      transform: "translateX(-50%)",
      width: 36,
    },
  },
  {
    selector: ".profile-share-overlay.is-open .profile-share-panel",
    rule: {
      opacity: 1,
      transform: "translateY(0) scale(1)",
    },
  },
  {
    selector: ".profile-share-header",
    rule: {
      alignItems: "center",
      display: "flex",
      gap: 12,
      justifyContent: "space-between",
      marginBottom: 14,
    },
  },
  {
    selector: ".profile-share-title",
    rule: {
      fontSize: "1rem",
      lineHeight: 1.2,
      margin: 0,
    },
  },
  {
    selector: ".profile-share-url",
    rule: {
      background: "rgb(16 24 39 / 4%)",
      borderRadius: 10,
      color: "#526070",
      fontSize: "0.9rem",
      lineHeight: 1.35,
      marginBottom: 14,
      overflow: "hidden",
      padding: "12px 14px",
    },
  },
  {
    selector: ".profile-share-url-text",
    rule: {
      display: "block",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  },
  {
    selector: ".profile-share-actions",
    rule: {
      display: "flex",
      gap: 10,
    },
  },
  {
    selector: ".profile-share-dialog",
    rule: {
      alignItems: "center",
      border: 0,
      borderRadius: 10,
      display: "inline-flex",
      flex: "1 1 0",
      gap: 8,
      height: 44,
      justifyContent: "center",
      padding: "0 12px",
      transition:
        "background-color 160ms ease, color 160ms ease, opacity 160ms ease",
    },
  },
  {
    selector: ".profile-share-copy-button",
    rule: {
      background: "rgb(16 24 39 / 6%)",
      color: "var(--brand-text, #172033)",
    },
  },
  {
    selector: ".profile-share-system-button",
    rule: {
      background: "var(--profile-accent-color, var(--brand-accent, #B64222))",
      color: "#ffffff",
    },
  },
  {
    selector: ".profile-share-copy-button:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background: "rgb(16 24 39 / 10%)",
          color: "var(--brand-text, #172033)",
        },
      },
    },
  },
  {
    selector: ".profile-share-system-button:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background:
            "color-mix(in srgb, var(--profile-accent-color, var(--brand-accent, #B64222)), black 8%)",
          color: "#ffffff",
        },
      },
    },
  },
  {
    selector: ".profile-share-dialog:disabled",
    rule: {
      background: "rgb(16 24 39 / 6%)",
      color: "#8A94A3",
      cursor: "not-allowed",
      opacity: 1,
    },
  },
  {
    selector:
      ".profile-share-dialog:disabled:hover, .profile-share-dialog:disabled:active",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background: "rgb(16 24 39 / 6%)",
          color: "#8A94A3",
        },
      },
    },
  },
  {
    selector: ".profile-share-overlay",
    rule: {
      "@media": {
        "(max-width: 519px)": {
          alignItems: "flex-end",
          padding: 0,
        },
      },
    },
  },
  {
    selector: ".profile-share-panel",
    rule: {
      "@media": {
        "(max-width: 519px)": {
          borderRadius: "22px 22px 0 0",
          paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
          transform: "translateY(100%)",
          width: "100%",
        },
      },
    },
  },
  {
    selector: ".profile-share-overlay.is-open .profile-share-panel",
    rule: {
      "@media": {
        "(max-width: 519px)": {
          transform: "translateY(var(--profile-share-drag-y, 0px))",
        },
      },
    },
  },
  {
    selector: ".profile-share-panel::before",
    rule: {
      "@media": {
        "(max-width: 519px)": {
          display: "block",
        },
      },
    },
  },
  {
    selector: ".public-page",
    rule: {
      "@media": {
        "(min-width: 520px)": {
          alignItems: "start",
          background: "whitesmoke",
          padding: "40px 0 0",
        },
      },
    },
  },
  {
    selector: ".preview-frame .profile-share-overlay",
    rule: {
      alignItems: "flex-end",
      padding: 0,
    },
  },
  {
    selector: ".preview-frame .profile-share-panel",
    rule: {
      borderRadius: "22px 22px 0 0",
      paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
      paddingTop: 22,
      transform: "translateY(100%)",
      width: "100%",
    },
  },
  {
    selector: ".preview-frame .profile-share-panel::before",
    rule: {
      display: "block",
    },
  },
  {
    selector:
      ".preview-frame .profile-share-overlay.is-open .profile-share-panel",
    rule: {
      transform: "translateY(var(--profile-share-drag-y, 0px))",
    },
  },
  {
    selector: ".public-profile",
    rule: {
      "@media": {
        "(min-width: 520px)": {
          border: 0,
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 24px 70px rgb(var(--brand-shadow-rgb, 79 45 32) / 14%)",
          minHeight: "calc(100vh - 40px)",
          padding: "36px 28px 0",
          width: "min(100%, 430px)",
        },
      },
    },
  },
];
