import type { CSSProperties, ComponentType, ReactNode } from "react";
import type { PublicProfileStyleRule } from "../ProfileStyleRules.types";

export type SocialLinksPresentation = "icons" | "links";

export type ProfileLayoutRenderContext = {
  avatar: ReactNode;
  backgroundUrl?: string | null;
  bannerMedia?: ReactNode;
  bio: ReactNode;
  cardFields: ReactNode;
  footer: ReactNode;
  infoChips: ReactNode;
  profileActions: ReactNode;
  profileIntro: ReactNode;
  profileTitleBlock: ReactNode;
  shareButton: ReactNode;
  shareDialog: ReactNode;
  style: CSSProperties;
};

export type ProfileLayoutDefinition = {
  Component: ComponentType<ProfileLayoutRenderContext>;
  description: string;
  designCapabilities: {
    backgroundImage: boolean;
    bannerMedia: boolean;
  };
  footerContent?: ReactNode;
  label: string;
  Preview: ComponentType;
  socialLinksPresentation: SocialLinksPresentation;
  styleRules: PublicProfileStyleRule[];
};
