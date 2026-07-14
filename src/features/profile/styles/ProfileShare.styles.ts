import type { PublicProfileStyleRule } from "../ProfileStyleRules.types";

export const profileShareStyleRules: PublicProfileStyleRule[] = [
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
      background: "#ffffff",
      borderRadius: 18,
      boxShadow: "0 24px 70px rgb(16 24 39 / 24%)",
      color: "#172033",
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
      color: "#172033",
    },
  },
  {
    selector: ".profile-share-system-button",
    rule: {
      background: "var(--profile-accent-color, #2563eb)",
      color: "#ffffff",
    },
  },
  {
    selector: ".profile-share-copy-button:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background: "rgb(16 24 39 / 10%)",
          color: "#172033",
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
            "color-mix(in srgb, var(--profile-accent-color, #2563eb), black 8%)",
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
];
