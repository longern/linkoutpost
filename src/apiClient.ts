import type { LinkProfile } from "./profile";
import type { SessionState } from "./types";

export async function loadSession(): Promise<SessionState> {
  const response = await fetch("/api/session");
  if (!response.ok) {
    throw new Error("Backend unavailable");
  }

  return response.json() as Promise<SessionState>;
}

export async function loadMyProfile(): Promise<LinkProfile | null> {
  const response = await fetch("/api/profile");
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
    throw new Error("Backend save failed");
  }
}

export async function updateSessionHandle(handle: string): Promise<SessionState> {
  const response = await fetch("/api/session/handle", {
    body: JSON.stringify({ handle }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PUT"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Handle update failed" })) as {
      error?: string;
    };
    throw new Error(payload.error ?? "Handle update failed");
  }

  return response.json() as Promise<SessionState>;
}
