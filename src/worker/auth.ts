import { normalizeHandle } from "../profile";
import type { SessionState } from "../types";
import type { Env } from "./env";

function safeLocalRedirect(value: string | null): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return undefined;

  try {
    const url = new URL(value, "https://local.invalid");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}

export type Provider = "google" | "twitter";
type OAuthErrorCode =
  | "oauth_callback"
  | "oauth_failed"
  | "oauth_provider"
  | "oauth_state"
  | "oauth_unavailable";

type SessionPayload = {
  exp: number;
  name: string;
  provider: Provider;
  userId: string;
};

type OAuthState = {
  codeVerifier: string;
  provider: Provider;
  redirectTo?: string;
  state: string;
};

type OAuthIdentity = {
  avatarUrl: string | null;
  displayName: string;
  email: string | null;
  provider: Provider;
  providerUserId: string;
  username: string | null;
};

const textEncoder = new TextEncoder();

function base64UrlEncode(input: ArrayBuffer | Uint8Array | string): string {
  const bytes =
    typeof input === "string"
      ? textEncoder.encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function randomToken(bytes = 32): string {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return base64UrlEncode(data);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(value),
  );
  return base64UrlEncode(digest);
}

function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getAuthSecret(env: Env, request: Request): string {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;

  const hostname = new URL(request.url).hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "linkoutpost-local-dev-secret";
  }

  throw new Error("AUTH_SECRET is required");
}

function getOptionalAuthSecret(env: Env, request: Request): string | null {
  try {
    return getAuthSecret(env, request);
  } catch {
    return null;
  }
}

function getAuthProviders(env: Env): SessionState["authProviders"] {
  return {
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    twitter: Boolean(env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET),
  };
}

async function hmacSign(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(value),
  );
  return base64UrlEncode(signature);
}

async function signCookieValue(
  secret: string,
  payload: unknown,
): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${await hmacSign(secret, body)}`;
}

async function verifyCookieValue<T>(
  secret: string,
  value: string | null,
): Promise<T | null> {
  if (!value) return null;

  const [body, signature] = value.split(".");
  if (!body || !signature) return null;

  const expected = await hmacSign(secret, body);
  if (expected !== signature) return null;

  return JSON.parse(base64UrlDecode(body)) as T;
}

function cookie(
  request: Request,
  name: string,
  value: string,
  maxAge: number,
): string {
  const url = new URL(request.url);
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearCookie(request: Request, name: string): string {
  const url = new URL(request.url);
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return `${name}=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`;
}

export function signInErrorRedirect(
  request: Request,
  error: OAuthErrorCode,
  clearOAuthCookie = true,
): Response {
  const requestUrl = new URL(request.url);
  const redirectTo = safeLocalRedirect(requestUrl.searchParams.get("redirect_to"));
  const signinUrl = new URL("/signin", requestUrl.origin);

  signinUrl.searchParams.set("error", error);

  if (redirectTo) {
    const redirectUrl = new URL(redirectTo, requestUrl.origin);
    const requestedHandle = normalizeHandle(redirectUrl.searchParams.get("create") ?? "");
    if (redirectUrl.pathname === "/admin" && requestedHandle) {
      signinUrl.searchParams.set("create", requestedHandle);
    }
  }

  const headers = new Headers({
    Location: `${signinUrl.pathname}${signinUrl.search}`,
  });

  if (clearOAuthCookie) {
    headers.append("Set-Cookie", clearCookie(request, "linkoutpost_oauth"));
  }

  return new Response(null, {
    headers,
    status: 302,
  });
}

export async function getSession(request: Request, env: Env): Promise<SessionState> {
  const secret = getOptionalAuthSecret(env, request);
  if (!secret) {
    return {
      authProviders: getAuthProviders(env),
      authenticated: false,
      name: null,
      provider: null,
      storage: "offline",
    };
  }

  const payload = await verifyCookieValue<SessionPayload>(
    secret,
    readCookie(request, "linkoutpost_session"),
  );

  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return {
      authProviders: getAuthProviders(env),
      authenticated: false,
      name: null,
      provider: null,
      storage: "offline",
    };
  }

  return {
    authProviders: getAuthProviders(env),
    authenticated: true,
    name: payload.name,
    provider: payload.provider,
    storage: "backend",
  };
}

export async function getSessionPayload(
  request: Request,
  env: Env,
): Promise<SessionPayload | null> {
  const secret = getOptionalAuthSecret(env, request);
  if (!secret) return null;

  const payload = await verifyCookieValue<SessionPayload>(
    secret,
    readCookie(request, "linkoutpost_session"),
  );

  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function requireAuthConfig(env: Env, provider: Provider): void {
  if (!env.DB) throw new Error("D1 binding is required for OAuth login");
  if (!env.AUTH_SECRET)
    throw new Error("AUTH_SECRET is required for OAuth login");

  if (
    provider === "google" &&
    (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
  ) {
    throw new Error("Google OAuth credentials are not configured");
  }

  if (
    provider === "twitter" &&
    (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET)
  ) {
    throw new Error("Twitter OAuth credentials are not configured");
  }
}

function providerConfig(env: Env, provider: Provider) {
  if (provider === "google") {
    return {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
      scope: "openid email profile",
      tokenUrl: "https://oauth2.googleapis.com/token",
    };
  }

  return {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    clientId: env.TWITTER_CLIENT_ID ?? "",
    clientSecret: env.TWITTER_CLIENT_SECRET ?? "",
    scope: "users.read tweet.read",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
  };
}

export async function startOAuth(
  request: Request,
  env: Env,
  provider: Provider,
): Promise<Response> {
  requireAuthConfig(env, provider);

  const url = new URL(request.url);
  const config = providerConfig(env, provider);
  const state: OAuthState = {
    codeVerifier: randomToken(64),
    provider,
    redirectTo: safeLocalRedirect(url.searchParams.get("redirect_to")),
    state: randomToken(32),
  };
  const signedState = await signCookieValue(env.AUTH_SECRET ?? "", state);
  const redirectUri = `${url.origin}/api/auth/${provider}/callback`;
  const authUrl = new URL(config.authUrl);

  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scope);
  authUrl.searchParams.set("state", state.state);
  authUrl.searchParams.set("code_challenge", await sha256(state.codeVerifier));
  authUrl.searchParams.set("code_challenge_method", "S256");

  if (provider === "google") {
    authUrl.searchParams.set("prompt", "select_account");
  }

  return new Response(null, {
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie": cookie(request, "linkoutpost_oauth", signedState, 600),
    },
    status: 302,
  });
}

async function exchangeOAuthCode(
  request: Request,
  env: Env,
  provider: Provider,
  code: string,
  codeVerifier: string,
): Promise<{ access_token: string }> {
  const url = new URL(request.url);
  const config = providerConfig(env, provider);
  const body = new URLSearchParams({
    client_id: config.clientId,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: `${url.origin}/api/auth/${provider}/callback`,
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (provider === "google") {
    body.set("client_secret", config.clientSecret);
  } else {
    headers.Authorization = `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`;
  }

  const response = await fetch(config.tokenUrl, {
    body,
    headers,
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.status}`);
  }

  return response.json() as Promise<{ access_token: string }>;
}

async function fetchIdentity(
  provider: Provider,
  accessToken: string,
): Promise<OAuthIdentity> {
  if (provider === "google") {
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) throw new Error("Google userinfo failed");

    const user = (await response.json()) as {
      email?: string;
      name?: string;
      picture?: string;
      sub: string;
    };

    return {
      avatarUrl: user.picture ?? null,
      displayName: user.name ?? user.email ?? "Google user",
      email: user.email ?? null,
      provider,
      providerUserId: user.sub,
      username: user.email ? user.email.split("@")[0] : null,
    };
  }

  const response = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) throw new Error("Twitter userinfo failed");

  const payload = (await response.json()) as {
    data: {
      id: string;
      name: string;
      profile_image_url?: string;
      username?: string;
    };
  };

  return {
    avatarUrl: payload.data.profile_image_url ?? null,
    displayName: payload.data.name,
    email: null,
    provider,
    providerUserId: payload.data.id,
    username: payload.data.username ?? null,
  };
}

async function upsertOAuthUser(
  env: Env,
  identity: OAuthIdentity,
): Promise<{
  created: boolean;
  userId: string;
}> {
  if (!env.DB) throw new Error("D1 binding is not configured");

  const now = new Date().toISOString();
  const existingAccount = await env.DB.prepare(
    `SELECT linkoutpost_users.id
     FROM linkoutpost_oauth_accounts
     JOIN linkoutpost_users ON linkoutpost_users.id = linkoutpost_oauth_accounts.user_id
     WHERE linkoutpost_oauth_accounts.provider = ? AND linkoutpost_oauth_accounts.provider_user_id = ?`,
  )
    .bind(identity.provider, identity.providerUserId)
    .first<{
      id: string;
    }>();

  if (existingAccount) {
    await env.DB.prepare(
      `UPDATE linkoutpost_users
       SET display_name = ?, avatar_url = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(identity.displayName, identity.avatarUrl, now, existingAccount.id)
      .run();
    await env.DB.prepare(
      `UPDATE linkoutpost_oauth_accounts
       SET email = ?, username = ?, display_name = ?, avatar_url = ?, updated_at = ?
       WHERE provider = ? AND provider_user_id = ?`,
    )
      .bind(
        identity.email,
        identity.username,
        identity.displayName,
        identity.avatarUrl,
        now,
        identity.provider,
        identity.providerUserId,
      )
      .run();

    return {
      created: false,
      userId: existingAccount.id,
    };
  }

  const userId = crypto.randomUUID();

  await env.DB.prepare(
    "INSERT INTO linkoutpost_users (id, display_name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(userId, identity.displayName, identity.avatarUrl, now, now)
    .run();
  await env.DB.prepare(
    `INSERT INTO linkoutpost_oauth_accounts
       (provider, provider_user_id, user_id, email, username, display_name, avatar_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      identity.provider,
      identity.providerUserId,
      userId,
      identity.email,
      identity.username,
      identity.displayName,
      identity.avatarUrl,
      now,
      now,
    )
    .run();

  return { created: true, userId };
}

export async function completeOAuth(
  request: Request,
  env: Env,
  provider: Provider,
): Promise<Response> {
  requireAuthConfig(env, provider);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return signInErrorRedirect(request, "oauth_provider");
  if (!code || !state) return signInErrorRedirect(request, "oauth_callback");

  const oauthState = await verifyCookieValue<OAuthState>(
    env.AUTH_SECRET ?? "",
    readCookie(request, "linkoutpost_oauth"),
  );

  if (
    !oauthState ||
    oauthState.provider !== provider ||
    oauthState.state !== state
  ) {
    return signInErrorRedirect(request, "oauth_state");
  }

  const token = await exchangeOAuthCode(
    request,
    env,
    provider,
    code,
    oauthState.codeVerifier,
  );
  const identity = await fetchIdentity(provider, token.access_token);
  const user = await upsertOAuthUser(env, identity);
  const session: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    name: identity.displayName,
    provider,
    userId: user.userId,
  };
  const signedSession = await signCookieValue(
    getAuthSecret(env, request),
    session,
  );

  const headers = new Headers({
    Location:
      oauthState.redirectTo ??
      "/admin",
  });
  headers.append(
    "Set-Cookie",
    cookie(request, "linkoutpost_session", signedSession, 60 * 60 * 24 * 30),
  );
  headers.append("Set-Cookie", clearCookie(request, "linkoutpost_oauth"));

  return new Response(null, {
    headers,
    status: 302,
  });
}
