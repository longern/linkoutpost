import type { PublicProfileStyleRule } from "../ProfileStyleRules";

export const profileInfoLayoutStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".public-profile-info",
    rule: {
      overflow: "hidden",
      padding: "0 20px 16px",
      "@container": {
        "(min-width: 520px)": {
          minHeight: "calc(100vh - 40px)",
          padding: "0 28px 16px",
          width: "min(100%, 430px)",
        },
      },
    },
  },
  {
    selector: ".profile-info-hero",
    rule: {
      alignItems: "flex-end",
      background:
        "color-mix(in srgb, var(--profile-accent-color, #2563eb), transparent 84%)",
      display: "flex",
      minHeight: 188,
      margin: "0 -20px",
      overflow: "hidden",
      padding: "96px 20px 22px",
      position: "relative",
      "@container": {
        "(min-width: 520px)": {
          margin: "0 -28px",
          minHeight: 210,
          padding: "104px 28px 24px",
        },
      },
    },
  },
  {
    selector: ".profile-info-hero .banner-hero-image-wrap",
    rule: {
      aspectRatio: "auto",
      inset: 0,
      margin: 0,
      position: "absolute",
    },
  },
  {
    selector: ".profile-info-hero .banner-hero-image-wrap::after",
    rule: {
      background:
        "linear-gradient(to bottom, rgb(0 0 0 / 4%) 0%, rgb(0 0 0 / 38%) 100%)",
    },
  },
  {
    selector: ".profile-info-identity",
    rule: {
      alignItems: "center",
      color: "#ffffff",
      display: "grid",
      gap: 14,
      gridTemplateColumns: "76px minmax(0, 1fr)",
      position: "relative",
      textShadow: "0 1px 18px rgb(0 0 0 / 32%)",
      width: "100%",
      zIndex: 1,
    },
  },
  {
    selector:
      ".profile-info-identity .profile-avatar, .profile-info-identity .profile-avatar-placeholder",
    rule: {
      border: "2px solid rgb(255 255 255 / 82%)",
      boxShadow: "0 14px 34px rgb(16 24 39 / 24%)",
      height: 76,
      margin: 0,
      width: 76,
    },
  },
  {
    selector: ".profile-info-identity .profile-avatar-placeholder",
    rule: {
      background: "rgb(255 255 255 / 24%)",
      color: "#ffffff",
    },
  },
  {
    selector: ".profile-info-title-block",
    rule: {
      minWidth: 0,
    },
  },
  {
    selector: ".profile-info-title-block .profile-title",
    rule: {
      color: "inherit",
      margin: "0 0 6px",
      maxWidth: "none",
      textAlign: "left",
    },
  },
  {
    selector: ".profile-info-title-block .handle",
    rule: {
      color: "inherit",
      margin: 0,
      opacity: 0.88,
      textAlign: "left",
    },
  },
  {
    selector: ".profile-info-body",
    rule: {
      color: "var(--profile-text-color, #172033)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      padding: "22px 0 0",
      position: "relative",
      zIndex: 1,
    },
  },
  {
    selector: ".profile-info-body .bio",
    rule: {
      margin: 0,
      width: "100%",
    },
  },
  {
    selector: ".profile-info-chips",
    rule: {
      alignItems: "center",
      display: "flex",
      flexWrap: "wrap",
      gap: 5,
      minHeight: 30,
    },
  },
  {
    selector: ".profile-info-chip",
    rule: {
      background: "var(--profile-button-background-color, #ffffff)",
      border:
        "1px solid color-mix(in srgb, var(--profile-button-background-color, #ffffff), var(--profile-button-text-color, #172033) 12%)",
      borderRadius: 4,
      color: "var(--profile-button-text-color, #172033)",
      display: "inline-flex",
      fontSize: "0.84rem",
      fontWeight: 650,
      lineHeight: 1.2,
      maxWidth: "100%",
      overflowWrap: "anywhere",
      padding: "4px 7px",
    },
  },
];
