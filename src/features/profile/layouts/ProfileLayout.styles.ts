import type { PublicProfileStyleRule } from "../ProfileStyleRules.types";

export const profileLayoutStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".public-page-classic, .public-page-card, .public-page-info",
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
    selector: ".public-profile-classic, .public-profile-card, .public-profile-info",
    rule: {
      "@container": {
        "(min-width: 520px)": {
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 24px 70px rgb(16 24 39 / 14%)",
          minHeight: "calc(100vh - 40px)",
          padding: "80px 28px 16px",
          width: "min(100%, 430px)",
        },
      },
    },
  },
];
