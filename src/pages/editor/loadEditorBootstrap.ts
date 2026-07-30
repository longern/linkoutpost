import {
  loadMyProfile,
  loadMyProfiles,
  loadSession,
  saveProfile,
} from "../../apiClient";
import { createProfile, normalizeHandle, type LinkProfile } from "../../profile";
import type { ProfileSummary, SessionState } from "../../types";

export type EditorBootstrap = {
  handleDraft: string;
  handleSetupError: string | null;
  handleSetupOpen: boolean;
  handleSetupRequired: boolean;
  mode: "backend";
  profile: LinkProfile;
  profileSummaries: ProfileSummary[];
  session: SessionState;
  status: string;
};

export class EditorBootstrapError extends Error {
  constructor(
    public readonly code: "auth_required" | "backend_unavailable",
  ) {
    super(code);
    this.name = "EditorBootstrapError";
  }
}

function profileSummary(profile: LinkProfile): ProfileSummary {
  return {
    handle: profile.handle,
    title: profile.title,
    updatedAt: profile.updatedAt,
  };
}

export function handleCreateErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return message === "Handle is already taken"
    ? "That handle is already taken."
    : message || "Handle create failed";
}

export async function loadEditorBootstrap(): Promise<EditorBootstrap> {
  let session: SessionState;
  try {
    session = await loadSession();
  } catch {
    throw new EditorBootstrapError("backend_unavailable");
  }

  if (!session.authenticated || session.storage !== "backend") {
    throw new EditorBootstrapError("auth_required");
  }

  try {
    let summaries = await loadMyProfiles();
    const requestedHandle =
      typeof window === "undefined"
        ? ""
        : normalizeHandle(
            new URLSearchParams(window.location.search).get("create") ?? "",
          );

    if (summaries.length > 0) {
      const firstHandle = summaries[0].handle;
      return {
        handleDraft: firstHandle,
        handleSetupError: null,
        handleSetupOpen: false,
        handleSetupRequired: false,
        mode: "backend",
        profile:
          (await loadMyProfile(firstHandle)) ??
          createProfile({ handle: firstHandle }),
        profileSummaries: summaries,
        session,
        status: "Backend editor",
      };
    }

    const initialHandle = requestedHandle || normalizeHandle(session.name ?? "");
    const profile = createProfile({ handle: initialHandle });
    let handleSetupError: string | null = null;

    if (requestedHandle) {
      try {
        await saveProfile(profile);
        summaries = [profileSummary(profile)];
      } catch (error) {
        handleSetupError = handleCreateErrorMessage(error);
      }
    }

    const needsHandleSetup = !requestedHandle || Boolean(handleSetupError);
    return {
      handleDraft: initialHandle,
      handleSetupError,
      handleSetupOpen: needsHandleSetup,
      handleSetupRequired: needsHandleSetup,
      mode: "backend",
      profile,
      profileSummaries: summaries,
      session,
      status: "Backend editor",
    };
  } catch (error) {
    if (error instanceof EditorBootstrapError) throw error;
    throw new EditorBootstrapError("backend_unavailable");
  }
}
