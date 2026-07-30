import type { LinkProfile } from "./profile";

export type AuthProvider = "email" | "google" | "twitter" | "shopify";

export type SessionState = {
  authProviders?: {
    email: boolean;
    google: boolean;
    shopify: boolean;
    twitter: boolean;
  };
  authenticated: boolean;
  name?: string | null;
  provider?: AuthProvider | null;
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
  siteTitle: string;
};
