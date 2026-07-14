import { profileLayoutStyleRules } from "./layouts/ProfileLayout.styles";
import { profileLayoutRegistry } from "./layouts/registry";
import {
  profileBaseStyleRules,
  profileControlStyleRules,
  profileFooterStyleRules,
} from "./styles/ProfileBase.styles";
import { profileLinkStyleRules } from "./styles/ProfileLinks.styles";
import { profileShareStyleRules } from "./styles/ProfileShare.styles";
import { profileSocialStyleRules } from "./styles/ProfileSocial.styles";
import type { PublicProfileStyleRule } from "./ProfileStyleRules.types";

export type { PublicProfileStyleRule } from "./ProfileStyleRules.types";

export const publicProfileStyleRules: PublicProfileStyleRule[] = [
  ...profileBaseStyleRules,
  ...profileLinkStyleRules,
  ...profileControlStyleRules,
  ...profileShareStyleRules,
  ...profileSocialStyleRules,
  ...profileFooterStyleRules,
  ...profileLayoutStyleRules,
  ...Object.values(profileLayoutRegistry).flatMap(
    (definition) => definition.styleRules,
  ),
];
