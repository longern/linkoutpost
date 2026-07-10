import type { PublicProfileStyleRule } from "../ProfileStyleRules";

export const profileCardLayoutStyleRules: PublicProfileStyleRule[] = [
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
      "@container": {
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
      flex: "1 0 auto",
      flexDirection: "column",
      gap: 22,
      justifyContent: "flex-start",
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
      "@container": {
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
      gap: 8,
    },
  },
  {
    selector: ".profile-card-meta .bio",
    rule: {
      margin: "0 auto 8px",
    },
  },
  {
    selector: ".profile-card-meta .public-links",
    rule: {
      width: "100%",
    },
  },
];
