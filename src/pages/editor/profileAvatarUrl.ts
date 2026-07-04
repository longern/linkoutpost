import { readLocalAssetAsDataUrl } from "../../localEditorStore";
import { getProfileAvatarUrl, type LinkProfile } from "../../profile";

export async function resolveProfileAvatarUrl(
  profile: LinkProfile,
  allowLocalAsset: boolean,
): Promise<string | null> {
  const profileAvatarUrl = getProfileAvatarUrl(profile);
  if (profileAvatarUrl || !profile.avatarAssetId) return profileAvatarUrl;
  if (!allowLocalAsset) return null;
  return readLocalAssetAsDataUrl(profile.avatarAssetId);
}
