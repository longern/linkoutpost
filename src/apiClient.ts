import type { LinkProfile } from "./profile";
import type { ProfileAssetKind } from "./media/config";
import type { ProfileSummary, SessionState } from "./types";

export async function loadSession(): Promise<SessionState> {
  const response = await fetch("/api/session");
  if (!response.ok) {
    throw new Error("Backend unavailable");
  }

  return response.json() as Promise<SessionState>;
}

export async function loadMyProfiles(): Promise<ProfileSummary[]> {
  const response = await fetch("/api/profiles");
  if (!response.ok) throw new Error("Profiles API unavailable");
  return response.json() as Promise<ProfileSummary[]>;
}

export async function loadMyProfile(handle?: string): Promise<LinkProfile | null> {
  const url = handle ? `/api/profile?handle=${encodeURIComponent(handle)}` : "/api/profile";
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Profile API unavailable");
  return response.json() as Promise<LinkProfile>;
}

export async function saveProfile(profile: LinkProfile): Promise<void> {
  const response = await fetch("/api/profile", {
    body: JSON.stringify(profile),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PUT"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Backend save failed" })) as {
      error?: string;
    };
    throw new Error(payload.error ?? "Backend save failed");
  }
}

export async function uploadAvatar(file: File): Promise<string> {
  return uploadProfileAsset(file, "avatar");
}

export async function uploadProfileAsset(
  file: File,
  kind: ProfileAssetKind,
): Promise<string> {
  const formData = new FormData();
  formData.set("image", file);
  formData.set("kind", kind);

  const response = await fetch("/api/profile/image", {
    body: formData,
    method: "POST"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Image upload failed" })) as {
      error?: string;
    };
    throw new Error(payload.error ?? "Image upload failed");
  }

  const payload = await response.json() as {
    assetId: string;
  };
  return payload.assetId;
}
