import { transformCss } from "@vanilla-extract/css/transformCss";
import { publicProfileStyleRules } from "./PublicProfileStyleRules";

export function getPublicProfileCssText(): string {
  return transformCss({
    composedClassLists: [],
    cssObjs: publicProfileStyleRules.map(({ rule, selector }) => ({
      rule,
      selector,
      type: "global" as const,
    })),
    localClassNames: [],
  }).join("\n");
}
