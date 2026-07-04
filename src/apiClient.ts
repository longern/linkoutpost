import type { LinkProfile } from "./profile";
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
  const formData = new FormData();
  formData.set("avatar", file);

  const response = await fetch("/api/profile/avatar", {
    body: formData,
    method: "POST"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Avatar upload failed" })) as {
      error?: string;
    };
    throw new Error(payload.error ?? "Avatar upload failed");
  }

  const payload = await response.json() as {
    avatarAssetId: string;
  };
  return payload.avatarAssetId;
}
