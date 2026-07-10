import { globalStyle } from "@vanilla-extract/css";
import { publicProfileStyleRules } from "./ProfileStyleRules";

for (const { rule, selector } of publicProfileStyleRules) {
  globalStyle(selector, rule);
}
