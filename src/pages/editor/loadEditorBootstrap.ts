import {
  loadMyProfile,
  loadMyProfiles,
  loadSession,
  saveProfile,
} from "../../apiClient";
import {
  readLocalProfile,
  readLocalProfileSummaries,
} from "../../localEditorStore";
import { createProfile, normalizeHandle, type LinkProfile } from "../../profile";
import type { ProfileSummary, SessionState } from "../../types";
import type { EditorMode } from "./useEditorAssetUrls";

export type EditorBootstrap = {
  handleDraft: string;
  handleSetupError: string | null;
  handleSetupOpen: boolean;
  handleSetupRequired: boolean;
  mode: EditorMode;
  profile: LinkProfile;
  profileSummaries: ProfileSummary[];
  session: SessionState;
  status: string;
};

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

async function loadOfflineBootstrap(
  session: SessionState,
  status: string,
): Promise<EditorBootstrap> {
  const profile = await readLocalProfile();
  const summaries = await readLocalProfileSummaries();
  const needsHandle = summaries.length === 0 && !normalizeHandle(profile.handle);

  return {
    handleDraft: needsHandle ? "" : profile.handle,
    handleSetupError: null,
    handleSetupOpen: needsHandle,
    handleSetupRequired: needsHandle,
    mode: "offline",
    profile,
    profileSummaries:
      summaries.length > 0 || needsHandle ? summaries : [profileSummary(profile)],
    session,
    status,
  };
}

export async function loadEditorBootstrap(
  fallbackSession: SessionState,
): Promise<EditorBootstrap> {
  let session: SessionState;
  try {
    session = await loadSession();
  } catch {
    return loadOfflineBootstrap(
      fallbackSession,
      "Backend unavailable, using offline editor",
    );
  }

  if (!session.authenticated || session.storage !== "backend") {
    return loadOfflineBootstrap(session, "Offline editor");
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
  } catch {
    return loadOfflineBootstrap(
      session,
      "Backend unavailable, using offline editor",
    );
  }
}
