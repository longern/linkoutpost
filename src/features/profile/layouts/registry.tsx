import type { ProfileLayout } from "../../../profile";
import { ProfileCardLayout } from "./ProfileCardLayout";
import { profileCardLayoutStyleRules } from "./ProfileCardLayout.styles";
import { ProfileCardLayoutPreview } from "./ProfileCardLayoutPreview";
import { ProfileClassicLayout } from "./ProfileClassicLayout";
import { profileClassicLayoutStyleRules } from "./ProfileClassicLayout.styles";
import { ProfileClassicLayoutPreview } from "./ProfileClassicLayoutPreview";
import { ProfileInfoLayout } from "./ProfileInfoLayout";
import { profileInfoLayoutStyleRules } from "./ProfileInfoLayout.styles";
import { ProfileInfoLayoutPreview } from "./ProfileInfoLayoutPreview";
import type { ProfileLayoutDefinition } from "./ProfileLayoutDefinition";

export const profileLayoutDefinitions: readonly ProfileLayoutDefinition[] = [
  {
    description: "Avatar, bio, social icons, and stacked links.",
    designCapabilities: {
      backgroundImage: false,
      bannerMedia: true,
    },
    id: "classic",
    label: "Classic links",
    Preview: ProfileClassicLayoutPreview,
    render: (context) => (
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
    styleRules: profileClassicLayoutStyleRules,
  },
  {
    description: "Structured visual card with profile details below.",
    designCapabilities: {
      backgroundImage: true,
      bannerMedia: false,
    },
    id: "card",
    label: "Structured card",
    Preview: ProfileCardLayoutPreview,
    render: (context) => (
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
    styleRules: profileCardLayoutStyleRules,
  },
  {
    description: "Banner identity with personal detail chips.",
    designCapabilities: {
      backgroundImage: false,
      bannerMedia: true,
    },
    id: "info",
    label: "Info header",
    Preview: ProfileInfoLayoutPreview,
    render: (context) => (
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
    styleRules: profileInfoLayoutStyleRules,
  },
];

const profileLayoutDefinitionById = new Map(
  profileLayoutDefinitions.map((definition) => [definition.id, definition]),
);

export function getProfileLayoutDefinition(
  layout: ProfileLayout,
): ProfileLayoutDefinition {
  return (
    profileLayoutDefinitionById.get(layout) ?? profileLayoutDefinitions[0]
  );
}
