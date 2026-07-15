import type { PublicProfileStyleRule } from "../ProfileStyleRules.types";

const neonPanelSelector = ".public-profile-neon .public-link-panel";
const neonEmbedCardSelector = ".public-profile-neon .public-embed-link";
const neonInteractiveCardSelector = ".public-profile-neon .public-link";
const neonInteractiveCardHoverSelector = `${neonInteractiveCardSelector}:hover`;
const neonInteractiveCardFocusSelector = `${neonInteractiveCardSelector}:focus-visible`;
const neonInteractiveCardActiveSelector = `${neonInteractiveCardSelector}:active`;
const neonInteractiveCardDimLayerSelector = `${neonInteractiveCardSelector}::before`;
const neonInteractiveCardDimLayerHoverSelector = `${neonInteractiveCardHoverSelector}::before`;
const neonInteractiveCardDimLayerHiddenSelector =
  `${neonInteractiveCardFocusSelector}::before, ` +
  `${neonInteractiveCardActiveSelector}::before`;
const neonFramedCardSelector = ".public-profile-neon .public-link-framed";
const neonFramedCardSurfaceSelector = `${neonFramedCardSelector} > .public-link-surface`;
const neonFramedCardContentSelector = `${neonFramedCardSelector} > .public-link-framed-content`;
const neonOuterCardClipPath =
  "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
const neonInnerCardClipPath =
  "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
const neonCardShadow =
  "0 0 5px color-mix(in srgb, var(--profile-accent-color, #22d3ee), transparent 66%), 0 0 10px rgb(244 63 219 / 14%)";
const neonCardLitShadow =
  "0 0 8px rgb(34 211 238 / 72%), 0 0 18px color-mix(in srgb, var(--profile-accent-color, #22d3ee), transparent 38%), 0 0 26px rgb(244 63 219 / 42%)";
const neonCardActiveShadow =
  "0 0 5px rgb(255 255 255 / 88%), 0 0 14px rgb(34 211 238 / 92%), 0 0 28px color-mix(in srgb, var(--profile-accent-color, #22d3ee), transparent 18%), 0 0 42px rgb(244 63 219 / 66%)";
const neonFooterFadeHeight = 24;
const neonFooterContentGap = 16;

export const profileNeonLayoutStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".public-page-neon",
    rule: {
      "@media": {
        "(max-width: 519px)": {
          background: "#02040c",
        },
      },
    },
  },
  {
    selector: ".public-profile-neon",
    rule: {
      background:
        "radial-gradient(circle at 50% 12%, color-mix(in srgb, var(--profile-accent-color, #22d3ee), transparent 80%), transparent 32%), linear-gradient(180deg, color-mix(in srgb, var(--profile-background-color, #050816), #02040c 78%), #02040c 72%)",
      color:
        "color-mix(in srgb, var(--profile-text-color, #ffffff), #ffffff 76%)",
      isolation: "isolate",
      overflow: "clip",
      padding: "32px 20px 18px",
      "@container": {
        "(min-width: 520px)": {
          padding: "32px 28px 16px",
        },
      },
    },
  },
  {
    selector: ".public-profile-neon.has-background-image::before",
    rule: {
      background:
        "linear-gradient(180deg, rgb(2 4 12 / 62%), rgb(2 4 12 / 92%) 58%, rgb(2 4 12 / 98%))",
      content: '""',
      inset: 0,
      position: "absolute",
      zIndex: 0,
    },
  },
  {
    selector: ".neon-profile-content",
    rule: {
      alignItems: "center",
      display: "flex",
      flex: "1 0 auto",
      flexDirection: "column",
      margin: "0 auto",
      maxWidth: 420,
      paddingBottom: neonFooterFadeHeight + neonFooterContentGap,
      position: "relative",
      width: "100%",
      zIndex: 1,
    },
  },
  {
    selector: ".neon-archive-label",
    rule: {
      color: "#e87174",
      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
      fontSize: "1.5rem",
      fontSynthesis: "weight",
      fontWeight: "bold",
      lineHeight: 1,
      marginBottom: 18,
      textAlign: "center",
      textShadow: "0 0 10px rgb(232 113 116 / 52%)",
      width: "100%",
    },
  },
  {
    selector: ".neon-avatar-frame",
    rule: {
      aspectRatio: "1",
      background:
        "linear-gradient(115deg, #2563eb 0 18%, #22d3ee 42%, #a855f7 70%, #ec4899 100%)",
      boxShadow:
        "0 0 10px rgb(34 211 238 / 46%), 0 0 24px rgb(37 99 235 / 24%)",
      clipPath:
        "polygon(8% 0, 42% 0, 46% 3%, 72% 3%, 76% 0, 92% 0, 100% 8%, 100% 38%, 97% 42%, 97% 72%, 100% 76%, 100% 92%, 92% 100%, 58% 100%, 54% 97%, 28% 97%, 24% 100%, 8% 100%, 0 92%, 0 64%, 3% 60%, 3% 28%, 0 24%, 0 8%)",
      isolation: "isolate",
      marginBottom: 16,
      padding: 14,
      position: "relative",
      width: "224px",
      maxWidth: "100%",
    },
  },
  {
    selector: ".neon-avatar-frame::before",
    rule: {
      background: "rgb(3 7 18 / 96%)",
      clipPath:
        "polygon(7% 0, 41% 0, 45% 3%, 73% 3%, 77% 0, 93% 0, 100% 7%, 100% 39%, 97% 43%, 97% 71%, 100% 75%, 100% 93%, 93% 100%, 57% 100%, 53% 97%, 29% 97%, 25% 100%, 7% 100%, 0 93%, 0 63%, 3% 59%, 3% 29%, 0 25%, 0 7%)",
      content: '""',
      inset: 2,
      position: "absolute",
      zIndex: 0,
    },
  },
  {
    selector: ".neon-avatar-frame::after",
    rule: {
      background:
        "linear-gradient(rgb(3 7 18 / 96%) 0 0) center / 12% 100% no-repeat, linear-gradient(rgb(3 7 18 / 96%) 0 0) center / 100% 10% no-repeat, linear-gradient(105deg, #22d3ee 0 38%, #dbeafe 51%, #a855f7 72%, #f472d0 100%)",
      borderRadius: 12,
      boxShadow:
        "-3px 0 10px rgb(34 211 238 / 74%), 3px 0 12px rgb(217 70 239 / 58%), inset 0 0 4px rgb(255 255 255 / 66%)",
      content: '""',
      inset: 8,
      pointerEvents: "none",
      position: "absolute",
      zIndex: 1,
    },
  },
  {
    selector: ".neon-avatar-frame .profile-avatar-media",
    rule: {
      border: 0,
      borderRadius: 8,
      height: "100%",
      margin: 0,
      position: "relative",
      width: "100%",
      zIndex: 2,
    },
  },
  {
    selector: ".neon-avatar-frame .profile-avatar",
    rule: {
      objectFit: "cover",
    },
  },
  {
    selector: ".neon-avatar-frame .profile-avatar-placeholder",
    rule: {
      background: "linear-gradient(145deg, #0d1730, #060914)",
      color: "var(--profile-accent-color, #22d3ee)",
    },
  },
  {
    selector: ".neon-profile-intro",
    rule: {
      textAlign: "center",
      width: "100%",
    },
  },
  {
    selector: ".public-profile-neon .profile-title",
    rule: {
      color: "#f8fbff",
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1,
      maxWidth: "18ch",
      textShadow:
        "0 0 12px color-mix(in srgb, var(--profile-accent-color, #22d3ee), transparent 42%)",
    },
  },
  {
    selector: ".public-profile-neon .handle",
    rule: {
      color: "var(--profile-accent-color, #22d3ee)",
      marginBottom: 10,
      textShadow: "0 0 10px currentColor",
    },
  },
  {
    selector: ".public-profile-neon .bio",
    rule: {
      color: "rgb(231 238 248 / 82%)",
      margin: "10px auto 24px",
      textAlign: "center",
    },
  },
  {
    selector: ".public-profile-neon .profile-actions",
    rule: {
      width: "100%",
    },
  },
  {
    selector: ".public-profile-neon .profile-social-links",
    rule: {
      marginBottom: 18,
    },
  },
  {
    selector: ".public-profile-neon .profile-social-links.is-links",
    rule: {
      gap: 16,
    },
  },
  {
    selector: ".public-profile-neon .profile-social-link-icon",
    rule: {
      background: "transparent",
      color: "var(--social-icon-color, currentColor)",
    },
  },
  {
    selector: ".public-profile-neon .public-links",
    rule: {
      gap: 16,
    },
  },
  {
    selector: neonPanelSelector,
    rule: {
      alignItems: "center",
      border: 0,
      borderRadius: 0,
      clipPath: neonOuterCardClipPath,
      color: "#f8fbff",
      display: "flex",
      fontWeight: 650,
      justifyContent: "center",
      minHeight: 70,
      padding: 0,
      position: "relative",
      textAlign: "center",
    },
  },
  {
    selector: `${neonPanelSelector} > .public-link-surface`,
    rule: {
      background:
        "linear-gradient(100deg, rgb(7 13 29 / 94%), rgb(3 7 18 / 88%))",
      clipPath: neonInnerCardClipPath,
      display: "block",
      inset: 1,
      pointerEvents: "none",
      position: "absolute",
      zIndex: 1,
    },
  },
  {
    selector: `${neonPanelSelector} > .public-link-content`,
    rule: {
      alignItems: "center",
      display: "flex",
      justifyContent: "center",
      padding: "14px 54px",
      position: "relative",
      width: "100%",
      zIndex: 2,
    },
  },
  {
    selector: `${neonPanelSelector} > .public-link-arrow`,
    rule: {
      color: "#f8fbff",
      display: "block",
      fontSize: "2rem",
      fontWeight: 300,
      lineHeight: 1,
      pointerEvents: "none",
      position: "absolute",
      right: 18,
      textShadow: "0 0 10px currentColor",
      top: "50%",
      transform: "translateY(-52%)",
      zIndex: 2,
    },
  },
  {
    selector: ".public-profile-neon .public-link.has-thumbnail",
    rule: {
      padding: 0,
      textAlign: "center",
    },
  },
  {
    selector: ".public-profile-neon .public-link-media-thumbnail",
    rule: {
      background: "rgb(255 255 255 / 94%)",
      borderRadius: 8,
      left: 18,
      zIndex: 1,
    },
  },
  {
    selector: neonFramedCardSelector,
    rule: {
      border: 0,
      borderRadius: 0,
      clipPath: neonOuterCardClipPath,
      display: "block",
      minHeight: 0,
      padding: 0,
      position: "relative",
    },
  },
  {
    selector: neonFramedCardSurfaceSelector,
    rule: {
      background: "rgb(5 9 22 / 96%)",
      clipPath: neonInnerCardClipPath,
      display: "block",
      inset: 1,
      pointerEvents: "none",
      position: "absolute",
      zIndex: 1,
    },
  },
  {
    selector: neonFramedCardContentSelector,
    rule: {
      background: "rgb(5 9 22 / 92%)",
      clipPath: neonInnerCardClipPath,
      margin: 1,
      overflow: "hidden",
      position: "relative",
      width: "calc(100% - 2px)",
      zIndex: 2,
    },
  },
  {
    selector:
      ".public-profile-neon .public-link-framed > .public-image-content",
    rule: {
      alignItems: "stretch",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },
  },
  {
    selector: ".public-profile-neon .public-image-card-title",
    rule: {
      color: "#f8fbff",
    },
  },
  {
    selector: neonEmbedCardSelector,
    rule: {
      borderRadius: 0,
      overflow: "clip",
    },
  },
  {
    selector:
      ".public-profile-neon .public-link-framed > .public-embed-content",
    rule: {
      display: "block",
    },
  },
  {
    selector: ".public-profile-neon .public-embed-content > *",
    rule: {
      borderRadius: 0,
    },
  },
  {
    selector: neonInteractiveCardSelector,
    rule: {
      background:
        "linear-gradient(105deg, #22d3ee 0%, var(--profile-accent-color, #22d3ee) 34%, #8b5cf6 68%, #f43fdb 100%)",
      boxShadow: neonCardShadow,
      isolation: "isolate",
      transition: "box-shadow var(--motion-duration) ease-out",
    },
  },
  {
    selector: neonInteractiveCardDimLayerSelector,
    rule: {
      background: "rgb(2 4 12 / 62%)",
      clipPath: "inherit",
      content: '""',
      inset: 0,
      opacity: 1,
      pointerEvents: "none",
      position: "absolute",
      transition: "opacity var(--motion-duration) ease-out",
      zIndex: 0,
    },
  },
  {
    selector: neonInteractiveCardHoverSelector,
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          boxShadow: neonCardLitShadow,
          transitionTimingFunction: "ease-in",
        },
      },
    },
  },
  {
    selector: neonInteractiveCardFocusSelector,
    rule: {
      boxShadow: neonCardLitShadow,
      transitionTimingFunction: "ease-in",
    },
  },
  {
    selector: neonInteractiveCardDimLayerHoverSelector,
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          opacity: 0,
          transitionTimingFunction: "ease-in",
        },
      },
    },
  },
  {
    selector: neonInteractiveCardDimLayerHiddenSelector,
    rule: {
      opacity: 0,
      transitionTimingFunction: "ease-in",
    },
  },
  {
    selector: neonInteractiveCardActiveSelector,
    rule: {
      boxShadow: neonCardActiveShadow,
      transitionDuration: "var(--motion-duration-fast)",
    },
  },
  {
    selector: ".public-profile-neon .profile-footer",
    rule: {
      background: "#02040c",
      bottom: 0,
      flex: "0 0 auto",
      margin: "auto -20px -18px",
      padding: "12px 20px 18px",
      position: "sticky",
      zIndex: 3,
      "@container": {
        "(min-width: 520px)": {
          margin: "auto -28px -16px",
          padding: "12px 28px 16px",
        },
      },
    },
  },
  {
    selector: ".public-profile-neon .profile-footer-attribution",
    rule: {
      color: "rgb(231 238 248 / 72%)",
      alignItems: "center",
      display: "flex",
      height: 64,
      justifyContent: "center",
      margin: "-8px auto",
      overflow: "hidden",
      width: 64,
    },
  },
  {
    selector: ".public-profile-neon .profile-footer-brand-link",
    rule: {
      display: "block",
      flex: "0 0 auto",
      height: 100,
      width: 100,
    },
  },
  {
    selector: ".public-profile-neon .profile-footer-brand-image",
    rule: {
      display: "block",
      marginTop: 4,
      maxWidth: "none",
      objectFit: "contain",
    },
  },
  {
    selector: ".public-profile-neon .profile-footer a:hover",
    rule: {
      "@media": {
        "(hover: hover) and (pointer: fine)": {
          color: "#f8fbff",
        },
      },
    },
  },
  {
    selector: ".public-profile-neon .profile-footer a:focus-visible",
    rule: {
      color: "#f8fbff",
    },
  },
  {
    selector: ".public-profile-neon .profile-footer::before",
    rule: {
      background: "linear-gradient(180deg, rgb(2 4 12 / 0%), #02040c)",
      content: '""',
      height: neonFooterFadeHeight,
      left: 0,
      pointerEvents: "none",
      position: "absolute",
      right: 0,
      top: -neonFooterFadeHeight,
    },
  },
];
