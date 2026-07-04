import { readLocalAssetAsDataUrl } from "../../localEditorStore";
import { getProfileAssetUrl, getProfileAvatarUrl, type LinkProfile } from "../../profile";

export async function resolveProfileAssetUrl(
  assetId: string | null,
  allowLocalAsset: boolean,
): Promise<string | null> {
  const assetUrl = getProfileAssetUrl(assetId);
  if (assetUrl || !assetId) return assetUrl;
  if (!allowLocalAsset) return null;
  return readLocalAssetAsDataUrl(assetId);
}

export async function resolveProfileAvatarUrl(
  profile: LinkProfile,
  allowLocalAsset: boolean,
): Promise<string | null> {
  const profileAvatarUrl = getProfileAvatarUrl(profile);
  if (profileAvatarUrl || !profile.avatarAssetId) return profileAvatarUrl;
  return resolveProfileAssetUrl(profile.avatarAssetId, allowLocalAsset);
}
