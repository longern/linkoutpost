import type { PublicProfileStyleRule } from "../ProfileStyleRules.types";

export const profileLayoutStyleRules: PublicProfileStyleRule[] = [
  {
    selector: ".public-page",
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
    selector: ".public-profile",
    rule: {
      "@container": {
        "(min-width: 520px)": {
          borderRadius: "22px 22px 0 0",
          boxShadow:
            "0 2px 6px rgb(16 24 39 / 12%), 0 16px 40px rgb(16 24 39 / 18%)",
          minHeight: "calc(100vh - 40px)",
          width: "min(100%, 430px)",
        },
      },
    },
  },
];
