import type { PublicProfileStyleRule } from "../ProfileStyleRules.types";

export const profileBaseStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".public-page",
    rule: {
      alignItems: "stretch",
      containerType: "inline-size",
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
      display: "flex",
      flexDirection: "column",
      fontFamily: "var(--profile-font-family)",
      minHeight: "100vh",
      position: "relative",
      width: "100%",
      "@supports": {
        "(min-height: 100dvh)": {
          minHeight: "100dvh",
        },
      },
    },
  },
  {
    selector: ".public-profile-content",
    rule: {
      color: "var(--profile-text-color, #172033)",
      position: "relative",
      zIndex: 1,
    },
  },
  {
    selector: ".public-profile .circle-icon-button",
    rule: {
      backgroundColor: "transparent",
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
    selector: ".public-profile .profile-share-button",
    rule: {
      backgroundColor:
        "color-mix(in srgb, var(--profile-background-color, #ffffff), transparent 74%)",
      color: "var(--profile-control-color, currentColor)",
      position: "absolute",
      right: 16,
      top: 16,
      zIndex: 3,
    },
  },
  {
    selector: ".profile-avatar-media",
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
      maxWidth: "58ch",
      overflowWrap: "anywhere",
      textAlign: "left",
      whiteSpace: "pre-wrap",
      width: "fit-content",
    },
  },
];

export const profileControlStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".public-profile .circle-icon-button:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          background: "color-mix(in srgb, currentColor, transparent 90%)",
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
          background: "color-mix(in srgb, currentColor, transparent 82%)",
        },
      },
    },
  },
  {
    selector: ".public-profile .profile-share-button:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          backgroundColor:
            "color-mix(in srgb, color-mix(in srgb, var(--profile-background-color, #ffffff), transparent 64%), var(--profile-control-color, currentColor) 5%)",
          color: "var(--profile-control-color, currentColor)",
        },
      },
    },
  },
  {
    selector: ".public-profile .profile-share-button:active",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          backgroundColor:
            "color-mix(in srgb, color-mix(in srgb, var(--profile-background-color, #ffffff), transparent 54%), var(--profile-control-color, currentColor) 8%)",
          color: "var(--profile-control-color, currentColor)",
        },
      },
    },
  },
];

export const profileFooterStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".profile-footer",
    rule: {
      fontSize: "0.75rem",
      lineHeight: 1.4,
      marginTop: "auto",
      paddingTop: 28,
      position: "relative",
      textAlign: "center",
      zIndex: 1,
    },
  },
  {
    selector: ".profile-footer-attribution",
    rule: {
      color:
        "color-mix(in srgb, var(--profile-text-color, #172033), transparent 36%)",
    },
  },
  {
    selector: ".profile-footer a",
    rule: {
      color: "inherit",
      textDecoration: "underline",
      textDecorationThickness: "1px",
      textUnderlineOffset: "3px",
      transition: "color var(--motion-duration) ease",
    },
  },
  {
    selector: ".profile-footer a:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          color: "var(--profile-text-color, #172033)",
        },
      },
    },
  },
  {
    selector: ".profile-footer a:focus-visible",
    rule: {
      color: "var(--profile-text-color, #172033)",
    },
  },
];
