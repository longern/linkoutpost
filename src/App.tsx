import { EditorPage } from "./pages/EditorPage";
import { HomePage } from "./pages/HomePage";
import { SignInPage } from "./pages/SignInPage";
import { useEffect } from "react";
import {
  getProfileAvatarUrl,
  getProfileAssetUrl,
  getProfileDocumentTitle,
  isReservedPath,
  normalizeHandle
} from "./profile";
import { ProfilePage } from "./PublicProfile";
import type { InitialState } from "./types";

type AppProps = {
  initialState: InitialState;
};

export function App({ initialState }: AppProps) {
  const pathname = initialState.pathname;

  useEffect(() => {
    document.title = getProfileDocumentTitle(initialState.profile);
  }, [initialState.profile]);

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <EditorPage initialSession={initialState.session} />;
  }

  if (pathname === "/") {
    return <HomePage initialSession={initialState.session} />;
  }

  if (pathname === "/signin" || pathname.startsWith("/signin/")) {
    return <SignInPage initialSession={initialState.session} />;
  }

  const handle = normalizeHandle(pathname.split("/").filter(Boolean)[0] ?? "");
  if (!handle || isReservedPath(handle)) {
    return <ProfilePage profile={null} />;
  }

  return (
    <ProfilePage
      avatarUrl={getProfileAvatarUrl(initialState.profile)}
      backgroundUrl={getProfileAssetUrl(
        initialState.profile?.theme.backgroundAssetId ?? null,
      )}
      profileImageUrl={getProfileAssetUrl(
        initialState.profile?.theme.profileImageAssetId ?? null,
      )}
      profile={initialState.profile}
    />
  );
}

export type { InitialState, ProfileSummary, SessionState } from "./types";
