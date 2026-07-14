import { ProfileCardLayout } from "./ProfileCardLayout";
import { profileCardLayoutStyleRules } from "./ProfileCardLayout.styles";
import { ProfileCardLayoutPreview } from "./ProfileCardLayoutPreview";
import { ProfileClassicLayout } from "./ProfileClassicLayout";
import { profileClassicLayoutStyleRules } from "./ProfileClassicLayout.styles";
import { ProfileClassicLayoutPreview } from "./ProfileClassicLayoutPreview";
import { ProfileInfoLayout } from "./ProfileInfoLayout";
import { profileInfoLayoutStyleRules } from "./ProfileInfoLayout.styles";
import { ProfileInfoLayoutPreview } from "./ProfileInfoLayoutPreview";
import { ProfileNeonLayout } from "./ProfileNeonLayout";
import { profileNeonLayoutStyleRules } from "./ProfileNeonLayout.styles";
import { ProfileNeonLayoutPreview } from "./ProfileNeonLayoutPreview";
import type {
  ProfileLayoutDefinition,
  ProfileLayoutRenderContext,
} from "./ProfileLayoutDefinition";

export const profileLayoutRegistry = {
  classic: {
    Component: (context: ProfileLayoutRenderContext) => (
      <ProfileClassicLayout
        avatar={context.avatar}
        bannerMedia={context.bannerMedia}
        footer={context.footer}
        profileActions={context.profileActions}
        profileIntro={context.profileIntro}
        shareButton={context.shareButton}
        shareDialog={context.shareDialog}
        style={context.style}
      />
    ),
    description: "Avatar, bio, social icons, and stacked links.",
    designCapabilities: {
      backgroundImage: false,
      bannerMedia: true,
    },
    label: "Classic links",
    Preview: ProfileClassicLayoutPreview,
    socialLinksPresentation: "icons",
    styleRules: profileClassicLayoutStyleRules,
  },
  card: {
    Component: (context: ProfileLayoutRenderContext) => (
      <ProfileCardLayout
        avatar={context.avatar}
        backgroundUrl={context.backgroundUrl}
        cardFields={context.cardFields}
        footer={context.footer}
        profileActions={context.profileActions}
        profileIntro={context.profileIntro}
        shareButton={context.shareButton}
        shareDialog={context.shareDialog}
        style={context.style}
      />
    ),
    description: "Structured visual card with profile details below.",
    designCapabilities: {
      backgroundImage: true,
      bannerMedia: false,
    },
    label: "Structured card",
    Preview: ProfileCardLayoutPreview,
    socialLinksPresentation: "icons",
    styleRules: profileCardLayoutStyleRules,
  },
  info: {
    Component: (context: ProfileLayoutRenderContext) => (
      <ProfileInfoLayout
        avatar={context.avatar}
        bannerMedia={context.bannerMedia}
        bio={context.bio}
        footer={context.footer}
        infoChips={context.infoChips}
        profileActions={context.profileActions}
        shareButton={context.shareButton}
        shareDialog={context.shareDialog}
        style={context.style}
        titleBlock={context.profileTitleBlock}
      />
    ),
    description: "Banner identity with personal detail chips.",
    designCapabilities: {
      backgroundImage: false,
      bannerMedia: true,
    },
    label: "Info header",
    Preview: ProfileInfoLayoutPreview,
    socialLinksPresentation: "icons",
    styleRules: profileInfoLayoutStyleRules,
  },
];

const profileLayoutDefinitionById = new Map(
  profileLayoutDefinitions.map((definition) => [definition.id, definition]),
);
} satisfies Record<string, ProfileLayoutDefinition>;

export type ProfileLayout = keyof typeof profileLayoutRegistry;

export function getProfileLayoutDefinition(
  layout: ProfileLayout,
): ProfileLayoutDefinition {
  return profileLayoutRegistry[layout];
}
