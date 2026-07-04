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
      background: "var(--profile-background-color, #ffffff)",
      border: 0,
      borderRadius: 0,
      fontFamily: "var(--profile-font-family)",
      minHeight: "auto",
      padding: "32px 20px",
      position: "relative",
      width: "100%",
    },
  },
  {
    selector: ".public-profile-content",
    rule: {
      color: "var(--profile-text-color, #172033)",
    },
  },
  {
    selector: ".public-profile .circle-icon-button",
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
      position: "absolute",
      right: 16,
      top: 16,
    },
  },
  {
    selector: ".profile-avatar, .profile-avatar-placeholder",
    rule: {
      border: "1px solid #e5e7eb",
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
        "color-mix(in srgb, var(--profile-accent-color, #2563eb), transparent 90%)",
      color: "var(--profile-accent-color, #2563eb)",
      display: "flex",
      justifyContent: "center",
    },
  },
  {
    selector: ".eyebrow",
    rule: {
      color: "var(--profile-accent-color, #2563eb)",
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
      color: "var(--profile-accent-color, #2563eb)",
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
      margin: "16px auto 28px",
      width: "fit-content",
      maxWidth: "58ch",
      overflowWrap: "anywhere",
      textAlign: "left",
      whiteSpace: "pre-wrap",
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
      background: "var(--profile-button-background-color, #ffffff)",
      border: 0,
      borderRadius: 8,
      boxShadow:
        "0 10px 15px -3px rgb(0 0 0 / 10%), 0 4px 6px -4px rgb(0 0 0 / 10%)",
      color: "var(--profile-button-text-color, #172033)",
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
    selector: ".public-profile .circle-icon-button:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background:
            "color-mix(in srgb, var(--profile-accent-color, #2563eb), transparent 90%)",
          color: "currentColor",
        },
      },
    },
  },
  {
    selector: ".public-profile .circle-icon-button:active",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background:
            "color-mix(in srgb, var(--profile-accent-color, #2563eb), transparent 82%)",
        },
      },
    },
  },
  {
    selector: ".public-profile .profile-share-button:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background: "rgb(16 24 39 / 8%)",
        },
      },
    },
  },
  {
    selector: ".public-profile .profile-share-button:active",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background: "rgb(16 24 39 / 12%)",
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
  {
    selector: ".public-page-classic, .public-page-card",
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
    selector: ".public-profile-classic, .public-profile-card",
    rule: {
      "@media": {
        "(min-width: 520px)": {
          border: 0,
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 24px 70px rgb(16 24 39 / 14%)",
          minHeight: "calc(100vh - 40px)",
          padding: "36px 28px 0",
          width: "min(100%, 430px)",
        },
      },
    },
  },
  {
    selector: ".profile-card-page",
    rule: {
      backgroundColor: "var(--profile-background-color, #ffffff)",
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      overflow: "auto",
      padding: "64px 20px 28px",
      "@supports": {
        "(min-height: 100dvh)": {
          minHeight: "100dvh",
        },
      },
      "@media": {
        "(min-width: 520px)": {
          padding: "64px 28px 28px",
        },
      },
    },
  },
  {
    selector: ".profile-card-layout",
    rule: {
      alignItems: "center",
      display: "flex",
      flex: "1 1 auto",
      flexDirection: "column",
      gap: 22,
      justifyContent: "flex-start",
      minHeight: 0,
      width: "100%",
    },
  },
  {
    selector: ".profile-structured-card",
    rule: {
      aspectRatio: "54 / 86",
      background: "rgb(255 255 255 / 88%)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      border: "1px solid rgb(255 255 255 / 58%)",
      borderRadius: 24,
      boxShadow: "0 24px 70px rgb(16 24 39 / 22%)",
      color: "var(--profile-text-color, #172033)",
      display: "flex",
      flex: "0 0 auto",
      flexDirection: "column",
      overflow: "hidden",
      padding: "24px 22px",
      position: "relative",
      width: "100%",
      "@media": {
        "(min-width: 520px)": {
          width: "min(100%, 340px)",
        },
      },
    },
  },
  {
    selector:
      ".profile-structured-card .profile-avatar, .profile-structured-card .profile-avatar-placeholder",
    rule: {
      border: 0,
      borderRadius: 0,
      height: "48%",
      left: "32%",
      margin: 0,
      position: "absolute",
      top: "7.5%",
      transform: "none",
      width: "60%",
      zIndex: 1,
    },
  },
  {
    selector: ".profile-structured-card .profile-avatar",
    rule: {
      objectFit: "cover",
    },
  },
  {
    selector: ".profile-structured-card .profile-avatar-placeholder",
    rule: {
      background: "rgb(16 24 39 / 12%)",
      color: "var(--profile-accent-color, #2563eb)",
    },
  },
  {
    selector: ".profile-card-name",
    rule: {
      color: "inherit",
      fontSize: "1.45rem",
      fontWeight: 800,
      left: "45%",
      letterSpacing: 0,
      lineHeight: 1.05,
      margin: 0,
      overflow: "hidden",
      overflowWrap: "anywhere",
      position: "absolute",
      right: "10%",
      textAlign: "left",
      top: "61%",
      zIndex: 1,
    },
  },
  {
    selector: ".profile-card-fields",
    rule: {
      display: "flex",
      flexDirection: "column",
      gap: 18,
      position: "absolute",
      left: "30%",
      margin: 0,
      right: "10%",
      top: "60%",
      zIndex: 1,
    },
  },
  {
    selector: ".profile-card-field",
    rule: {
      minHeight: 40,
      alignItems: "end",
      borderBottom: "2px solid var(--profile-text-color, #172033)",
      display: "flex",
      gap: 8,
      justifyContent: "space-between",
    },
  },
  {
    selector: ".profile-card-field dt",
    rule: {
      minWidth: "25%",
      color: "var(--profile-text-color, #172033)",
      flex: "0 0 auto",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: "uppercase",
    },
  },
  {
    selector: ".profile-card-field dd",
    rule: {
      flex: "1 1 auto",
      fontSize: "1.5rem",
      fontWeight: 650,
      margin: 0,
      overflowWrap: "anywhere",
    },
  },
  {
    selector: ".profile-card-meta",
    rule: {
      color: "var(--profile-text-color, #172033)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "min(100%, 360px)",
    },
  },
  {
    selector: ".profile-card-meta .handle",
    rule: {
      margin: "0 0 10px",
    },
  },
  {
    selector: ".profile-card-meta .bio",
    rule: {
      margin: "0 auto 18px",
    },
  },
  {
    selector: ".profile-card-meta .public-links",
    rule: {
      marginTop: 20,
      width: "100%",
    },
  },
  {
    selector: ".profile-social-links",
    rule: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "center",
      width: "min(100%, 360px)",
    },
  },
  {
    selector: ".public-profile-content .profile-social-links",
    rule: {
      margin: "-10px auto 24px",
    },
  },
  {
    selector: ".profile-social-link",
    rule: {
      alignItems: "center",
      background: "rgb(255 255 255 / 86%)",
      border: "1px solid rgb(255 255 255 / 58%)",
      borderRadius: 999,
      boxShadow: "0 12px 28px rgb(16 24 39 / 16%)",
      color: "var(--profile-accent-color, #2563eb)",
      display: "inline-flex",
      height: 44,
      justifyContent: "center",
      textDecoration: "none",
      transition:
        "background-color 160ms ease, color 160ms ease, transform 160ms ease",
      width: 44,
    },
  },
  {
    selector: ".profile-social-link:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background: "#ffffff",
          transform: "translateY(-1px)",
        },
      },
    },
  },
];
