import type { PublicProfileStyleRule } from "../ProfileStyleRules.types";

export const profileLinkStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".public-links",
    rule: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      width: "100%",
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
          backgroundColor:
            "color-mix(in srgb, var(--profile-button-background-color, #ffffff), var(--profile-button-text-color, #172033) 6%)",
          boxShadow:
            "0 20px 25px -5px rgb(0 0 0 / 10%), 0 8px 10px -6px rgb(0 0 0 / 10%)",
        },
      },
    },
  },
  {
    selector: ".public-link.has-thumbnail",
    rule: {
      alignItems: "center",
      display: "flex",
      justifyContent: "center",
      minHeight: 68,
      padding: "14px 68px",
      position: "relative",
      textAlign: "center",
    },
  },
  {
    selector: ".public-link-surface, .public-link-arrow",
    rule: {
      display: "none",
    },
  },
  {
    selector: ".public-link-content, .public-link-framed-content",
    rule: {
      display: "contents",
    },
  },
  {
    selector: ".public-link-thumbnail",
    rule: {
      alignItems: "center",
      background: "rgb(255 255 255 / 88%)",
      borderRadius: 8,
      display: "flex",
      height: 40,
      justifyContent: "center",
      left: 16,
      overflow: "hidden",
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      width: 40,
    },
  },
  {
    selector: ".public-link-thumbnail img",
    rule: {
      display: "block",
      height: "100%",
      objectFit: "contain",
      width: "100%",
    },
  },
  {
    selector: ".public-link-label",
    rule: {
      minWidth: 0,
      overflowWrap: "anywhere",
    },
  },
  {
    selector: ".public-link:active",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          backgroundColor:
            "color-mix(in srgb, var(--profile-button-background-color, #ffffff), var(--profile-button-text-color, #172033) 10%)",
        },
      },
    },
  },
  {
    selector: ".public-image-card",
    rule: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      overflow: "hidden",
      padding: 0,
    },
  },
  {
    selector: ".public-embed-link",
    rule: {
      display: "block",
      overflow: "hidden",
      padding: 0,
    },
  },
  {
    selector: ".public-embed-link a",
    rule: {
      display: "block",
    },
  },
  {
    selector: ".public-embed-link img, .public-embed-link iframe",
    rule: {
      border: 0,
      display: "block",
      height: "auto",
      maxWidth: "100%",
      width: "100%",
    },
  },
  {
    selector: ".public-image-card-media",
    rule: {
      display: "block",
      height: "auto",
      maxWidth: "100%",
      width: "100%",
    },
  },
  {
    selector: ".public-image-card-placeholder",
    rule: {
      alignItems: "center",
      aspectRatio: "16 / 9",
      color:
        "color-mix(in srgb, var(--profile-button-text-color, #172033), transparent 42%)",
      display: "flex",
      justifyContent: "center",
      padding: 16,
    },
  },
  {
    selector: ".public-image-card-title",
    rule: {
      color: "var(--profile-button-text-color, #172033)",
      overflowWrap: "anywhere",
      padding: "0 16px 14px",
      textAlign: "center",
    },
  },
];
