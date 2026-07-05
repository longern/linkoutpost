import type { LinkProfile } from "./profile";

export type SessionState = {
  authProviders?: {
    google: boolean;
    twitter: boolean;
  };
  authenticated: boolean;
  name?: string | null;
  provider?: "google" | "twitter" | null;
  storage: "backend" | "offline";
};

export type ProfileSummary = {
  handle: string;
  title: string;
  updatedAt: string;
};

export type InitialState = {
  pathname: string;
  profile: LinkProfile | null;
  session: SessionState;
};
