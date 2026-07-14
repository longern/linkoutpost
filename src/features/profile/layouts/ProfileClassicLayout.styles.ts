import type { PublicProfileStyleRule } from "../ProfileStyleRules.types";

export const profileClassicLayoutStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".public-profile-classic",
    rule: {
      padding: "80px 20px 16px",
      "@container": {
        "(min-width: 520px)": {
          padding: "80px 28px 16px",
        },
      },
    },
  },
  {
    selector: ".public-profile-classic.has-banner-image",
    rule: {
      paddingTop: 0,
      overflow: "hidden",
    },
  },
  {
    selector: ".banner-hero-image-wrap",
    rule: {
      aspectRatio: "16 / 9",
      margin: "0 -20px",
      overflow: "hidden",
      position: "relative",
      "@container": {
        "(min-width: 520px)": {
          margin: "0 -28px",
        },
      },
    },
  },
  {
    selector: ".banner-hero-image-wrap::after",
    rule: {
      background:
        "linear-gradient(to bottom, rgb(0 0 0 / 0%) 45%, var(--profile-background-color, #ffffff) 100%)",
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  {
    selector: ".banner-hero-image",
    rule: {
      display: "block",
      height: "100%",
      objectFit: "cover",
      width: "100%",
    },
  },
  {
    selector:
      ".public-profile-classic.has-banner-image .public-profile-content",
    rule: {
      marginTop: -48,
    },
  },
  {
    selector: ".public-profile-classic.has-banner-image .profile-avatar-media",
    rule: {
      boxShadow: "0 14px 36px rgb(16 24 39 / 20%)",
      marginTop: 0,
    },
  },
];
