import type { LinkProfile } from "./profile";

export type SessionState = {
  authenticated: boolean;
  handle: string | null;
  name?: string | null;
  provider?: "google" | "twitter" | null;
  storage: "backend" | "offline";
};

export type InitialState = {
  pathname: string;
  profile: LinkProfile | null;
  session: SessionState;
};
