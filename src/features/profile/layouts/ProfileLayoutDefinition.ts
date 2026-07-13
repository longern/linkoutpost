import type { CSSProperties, ComponentType, ReactNode } from "react";
import type { LinkProfile, ProfileLayout } from "../../../profile";
import type { PublicProfileStyleRule } from "../ProfileStyleRules.types";

export type ProfileLayoutRenderContext = {
  avatar: ReactNode;
  backgroundUrl?: string | null;
  bannerMedia?: ReactNode;
  bio: ReactNode;
  cardFields: ReactNode;
  footer: ReactNode;
  infoChips: ReactNode;
  profile: LinkProfile;
  profileActions: ReactNode;
  profileIntro: ReactNode;
  profileTitleBlock: ReactNode;
  shareButton: ReactNode;
  shareDialog: ReactNode;
  style: CSSProperties;
};

export type ProfileLayoutDefinition = {
  description: string;
  designCapabilities: {
    backgroundImage: boolean;
    bannerMedia: boolean;
  };
  id: ProfileLayout;
  label: string;
  Preview: ComponentType;
  render(context: ProfileLayoutRenderContext): ReactNode;
  styleRules: PublicProfileStyleRule[];
};
