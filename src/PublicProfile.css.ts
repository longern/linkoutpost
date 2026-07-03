import { globalStyle } from "@vanilla-extract/css";
import { publicProfileClassNames } from "./PublicProfileClasses";

globalStyle(`.${publicProfileClassNames.publicPage}`, {
  alignItems: "stretch",
  display: "grid",
  justifyItems: "center",
  minHeight: "100vh",
  padding: 0,
});

globalStyle(`.${publicProfileClassNames.publicProfile}`, {
  background: "var(--profile-background-color, var(--brand-page-background, #FFF8F3))",
  border: 0,
  borderRadius: 0,
  color: "var(--profile-text-color, var(--brand-text, #172033))",
  fontFamily: "var(--profile-font-family)",
  minHeight: "100vh",
  padding: "32px 20px",
  position: "relative",
  width: "100%",
});

globalStyle(`.${publicProfileClassNames.circleIconButton}`, {
  background: "transparent",
  border: 0,
  borderRadius: 999,
  color: "currentColor",
  display: "inline-grid",
  flex: "0 0 auto",
  height: 40,
  padding: 0,
  placeItems: "center",
  transition:
    "background-color 160ms ease, color 160ms ease",
  width: 40,
});

globalStyle(`.${publicProfileClassNames.profileShareButton}`, {
  color: "var(--profile-accent-color, var(--brand-accent, #B64222))",
  position: "absolute",
  right: 16,
  top: 16,
});

globalStyle(
  `.${publicProfileClassNames.avatar}, .${publicProfileClassNames.avatarPlaceholder}`,
  {
    border: "1px solid var(--brand-border, #E7D2C7)",
    borderRadius: 999,
    height: 96,
    margin: "18px auto",
    width: 96,
  },
);

globalStyle(`.${publicProfileClassNames.avatar}`, {
  display: "block",
  objectFit: "cover",
});

globalStyle(`.${publicProfileClassNames.avatarPlaceholder}`, {
  alignItems: "center",
  background:
    "color-mix(in srgb, var(--profile-accent-color, var(--brand-accent, #B64222)), transparent 90%)",
  color: "var(--profile-accent-color, var(--brand-accent, #B64222))",
  display: "flex",
  justifyContent: "center",
});

globalStyle(`.${publicProfileClassNames.eyebrow}`, {
  color: "var(--profile-accent-color, var(--brand-accent, #B64222))",
  fontSize: "0.8rem",
  fontWeight: 700,
  letterSpacing: 0,
  margin: "0 0 8px",
  textAlign: "center",
  textTransform: "uppercase",
});

globalStyle(`.${publicProfileClassNames.title}`, {
  color: "inherit",
  fontSize: "1.5rem",
  letterSpacing: 0,
  lineHeight: 1.04,
  margin: "0 auto 8px",
  maxWidth: "13ch",
  textAlign: "center",
});

globalStyle(`.${publicProfileClassNames.handle}`, {
  color: "var(--profile-accent-color, var(--brand-accent, #B64222))",
  fontSize: "0.95rem",
  fontWeight: 700,
  letterSpacing: 0,
  margin: "0 0 16px",
  textAlign: "center",
});

globalStyle(`.${publicProfileClassNames.bio}`, {
  color: "#526070",
  margin: "16px 0 28px",
  maxWidth: "58ch",
});

globalStyle(`.${publicProfileClassNames.links}`, {
  display: "grid",
  gap: 10,
});

globalStyle(`.${publicProfileClassNames.link}`, {
  background: "var(--profile-button-background-color, var(--brand-raised-background, #FFFFFF))",
  border: "1px solid var(--profile-accent-color, var(--brand-accent, #B64222))",
  borderRadius: 8,
  color: "var(--profile-button-text-color, var(--brand-text, #172033))",
  display: "block",
  overflowWrap: "anywhere",
  padding: "14px 16px",
  textAlign: "center",
  textDecoration: "none",
  transition: "border-color 160ms ease, transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)",
});

globalStyle(`.${publicProfileClassNames.link}:hover`, {
  borderColor: "var(--profile-accent-color, var(--brand-accent, #B64222))",
});

globalStyle(`.${publicProfileClassNames.circleIconButton}:hover`, {
  "@media": {
    "(hover: hover) and (pointer: fine)": {
      background: "rgb(var(--brand-accent-rgb, 182 66 34) / 10%)",
    },
  },
});

globalStyle(`.${publicProfileClassNames.circleIconButton}:active`, {
  "@media": {
    "(hover: hover) and (pointer: fine)": {
      background: "rgb(var(--brand-accent-rgb, 182 66 34) / 18%)",
    },
  },
});

globalStyle(`.${publicProfileClassNames.profileShareButton}:hover`, {
  "@media": {
    "(hover: hover) and (pointer: fine)": {
      background:
        "color-mix(in srgb, var(--profile-accent-color, var(--brand-accent, #B64222)), transparent 88%)",
      color: "var(--profile-accent-color, var(--brand-accent, #B64222))",
    },
  },
});

globalStyle(`.${publicProfileClassNames.profileShareButton}:active`, {
  "@media": {
    "(hover: hover) and (pointer: fine)": {
      background:
        "color-mix(in srgb, var(--profile-accent-color, var(--brand-accent, #B64222)), transparent 80%)",
    },
  },
});

globalStyle(`.${publicProfileClassNames.publicPage}`, {
  "@media": {
    "(min-width: 520px)": {
      alignItems: "start",
      background: "var(--brand-tint-background, #F7E7DD)",
      padding: "40px 0 0",
    },
  },
});

globalStyle(`.${publicProfileClassNames.publicProfile}`, {
  "@media": {
    "(min-width: 520px)": {
      border: "1px solid var(--brand-border, #E7D2C7)",
      borderBottom: 0,
      borderRadius: "22px 22px 0 0",
      boxShadow: "0 24px 70px rgb(var(--brand-shadow-rgb, 79 45 32) / 12%)",
      minHeight: "calc(100vh - 40px)",
      padding: "36px 28px 0",
      width: "min(100%, 430px)",
    },
  },
});
