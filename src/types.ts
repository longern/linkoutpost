import type { LinkProfile } from "./profile";

export type AuthProvider = "email" | "google" | "twitter" | "shopify" | "sso";

export type SessionState = {
  authIssuer?: string | null;
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
