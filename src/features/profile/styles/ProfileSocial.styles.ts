import type { PublicProfileStyleRule } from "../ProfileStyleRules.types";

export const profileSocialStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".profile-actions",
    rule: {
      alignItems: "stretch",
      display: "flex",
      flexDirection: "column",
      width: "100%",
    },
  },
  {
    selector: ".profile-actions.is-top",
    rule: {
      gap: 14,
    },
  },
  {
    selector: ".profile-actions.is-bottom",
    rule: {
      gap: 18,
    },
  },
  {
    selector: ".profile-social-links",
    rule: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4,
      justifyContent: "center",
      margin: "0 auto",
      width: "min(100%, 360px)",
    },
  },
  {
    selector: ".profile-social-link",
    rule: {
      alignItems: "center",
      background: "transparent",
      border: 0,
      borderRadius: 999,
      boxShadow: "none",
      color: "inherit",
      cursor: "pointer",
      display: "inline-flex",
      font: "inherit",
      height: 48,
      justifyContent: "center",
      padding: 8,
      textDecoration: "none",
      transition: "background-color 160ms ease, color 160ms ease",
      width: 48,
    },
  },
  {
    selector: ".profile-social-links.is-links",
    rule: {
      flexDirection: "column",
      gap: 14,
      width: "100%",
    },
  },
  {
    selector: ".profile-social-link-card",
    rule: {
      cursor: "pointer",
      font: "inherit",
      width: "100%",
    },
  },
  {
    selector: ".public-profile .profile-social-link-icon",
    rule: {
      alignItems: "center",
      background: "transparent",
      color: "var(--social-icon-color, currentColor)",
      display: "inline-flex",
      justifyContent: "center",
    },
  },
  {
    selector: ".public-profile .profile-social-link-icon .social-platform-icon",
    rule: {
      color: "var(--social-icon-color, currentColor)",
      filter:
        "drop-shadow(1px 0 0 #ffffff) drop-shadow(-1px 0 0 #ffffff) drop-shadow(0 1px 0 #ffffff) drop-shadow(0 -1px 0 #ffffff)",
    },
  },
  {
    selector: ".wechat-copy-control .wechat-success-icon",
    rule: {
      display: "none",
    },
  },
  {
    selector: ".wechat-copy-control.is-copied .wechat-default-icon",
    rule: {
      display: "none",
    },
  },
  {
    selector: ".wechat-copy-control.is-copied .wechat-success-icon",
    rule: {
      color: "#16a34a",
      display: "block",
    },
  },
  {
    selector: ".profile-social-link:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          backgroundColor: "color-mix(in srgb, currentColor, transparent 92%)",
        },
      },
    },
  },
  {
    selector: ".profile-social-link:active",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          backgroundColor: "color-mix(in srgb, currentColor, transparent 88%)",
        },
      },
    },
  },
];
