import { EditorPage } from "./pages/EditorPage";
import { HomePage } from "./pages/HomePage";
import { SignInPage } from "./pages/SignInPage";
import { isReservedPath, normalizeHandle } from "./profile";
import { ProfilePage } from "./PublicProfile";
import type { InitialState } from "./types";

type AppProps = {
  initialState: InitialState;
};

export function App({ initialState }: AppProps) {
  const pathname = initialState.pathname;

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

  return <ProfilePage profile={initialState.profile} />;
}

export type { InitialState, SessionState } from "./types";
