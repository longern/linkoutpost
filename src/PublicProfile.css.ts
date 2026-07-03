import { globalStyle } from "@vanilla-extract/css";
import { publicProfileStyleRules } from "./PublicProfileStyleRules";

for (const { rule, selector } of publicProfileStyleRules) {
  globalStyle(selector, rule);
}
