import { renderToReadableStream } from "react-dom/server.browser";
import { App, type InitialState, type SessionState } from "./App";
import { createProfile, isReservedPath, normalizeHandle, type LinkProfile } from "./profile";

export interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  TWITTER_CLIENT_ID?: string;
  TWITTER_CLIENT_SECRET?: string;
}

const apiHeaders = {
  "X-Linkoutpost-Worker": "api"
};

const ssrHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Linkoutpost-Worker": "ssr"
};

function serializeInitialState(state: InitialState): string {
  return JSON.stringify(state).replace(/</g, "\\u003c");
}

type Provider = "google" | "twitter";

type SessionPayload = {
  exp: number;
  handle: string;
  name: string;
  provider: Provider;
  userId: string;
};

type OAuthState = {
  codeVerifier: string;
  provider: Provider;
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
  const bytes = typeof input === "string"
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
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  );
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
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
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

async function hmacSign(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return base64UrlEncode(signature);
}

async function signCookieValue(secret: string, payload: unknown): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${await hmacSign(secret, body)}`;
}

async function verifyCookieValue<T>(secret: string, value: string | null): Promise<T | null> {
  if (!value) return null;

  const [body, signature] = value.split(".");
  if (!body || !signature) return null;

  const expected = await hmacSign(secret, body);
  if (expected !== signature) return null;

  return JSON.parse(base64UrlDecode(body)) as T;
}

function cookie(request: Request, name: string, value: string, maxAge: number): string {
  const url = new URL(request.url);
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function clearCookie(request: Request, name: string): string {
  const url = new URL(request.url);
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return `${name}=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`;
}

async function getSession(request: Request, env: Env): Promise<SessionState> {
  const secret = getOptionalAuthSecret(env, request);
  if (!secret) {
    return {
      authenticated: false,
      handle: null,
      name: null,
      provider: null,
      storage: "offline"
    };
  }

  const payload = await verifyCookieValue<SessionPayload>(
    secret,
    readCookie(request, "linkoutpost_session")
  );

  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return {
      authenticated: false,
      handle: null,
      name: null,
      provider: null,
      storage: "offline"
    };
  }

  return {
    authenticated: true,
    handle: payload.handle,
    name: payload.name,
    provider: payload.provider,
    storage: "backend"
  };
}

async function getSessionPayload(request: Request, env: Env): Promise<SessionPayload | null> {
  const secret = getOptionalAuthSecret(env, request);
  if (!secret) return null;

  const payload = await verifyCookieValue<SessionPayload>(
    secret,
    readCookie(request, "linkoutpost_session")
  );

  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function readProfileByHandle(env: Env, handle: string): Promise<LinkProfile | null> {
  if (!env.DB || isReservedPath(handle)) return null;

  const row = await env.DB.prepare(
    "SELECT handle, title, bio, avatar_asset_id, links_json, updated_at FROM profiles WHERE handle = ?"
  ).bind(handle).first<{
    avatar_asset_id: string | null;
    handle: string;
    title: string;
    bio: string;
    links_json: string;
    updated_at: string;
  }>();

  if (!row) return null;

  return createProfile({
    avatarAssetId: row.avatar_asset_id,
    bio: row.bio,
    handle: row.handle,
    links: JSON.parse(row.links_json) as LinkProfile["links"],
    title: row.title,
    updatedAt: row.updated_at
  });
}

async function writeProfile(env: Env, userId: string, profile: LinkProfile): Promise<void> {
  if (!env.DB) {
    throw new Error("D1 binding is not configured");
  }

  const handle = normalizeHandle(profile.handle);
  if (!handle || isReservedPath(handle)) {
    throw new Error("Invalid handle");
  }

  await env.DB.prepare(
    `INSERT INTO profiles (handle, owner_user_id, title, bio, avatar_asset_id, links_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(handle) DO UPDATE SET
       owner_user_id = excluded.owner_user_id,
       title = excluded.title,
       bio = excluded.bio,
       avatar_asset_id = excluded.avatar_asset_id,
       links_json = excluded.links_json,
       updated_at = excluded.updated_at`
  ).bind(
    handle,
    userId,
    profile.title,
    profile.bio,
    profile.avatarAssetId,
    JSON.stringify(profile.links),
    new Date().toISOString()
  ).run();
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, {
    headers: apiHeaders,
    status
  });
}

function requireAuthConfig(env: Env, provider: Provider): void {
  if (!env.DB) throw new Error("D1 binding is required for OAuth login");
  if (!env.AUTH_SECRET) throw new Error("AUTH_SECRET is required for OAuth login");

  if (provider === "google" && (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)) {
    throw new Error("Google OAuth credentials are not configured");
  }

  if (provider === "twitter" && (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET)) {
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
      tokenUrl: "https://oauth2.googleapis.com/token"
    };
  }

  return {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    clientId: env.TWITTER_CLIENT_ID ?? "",
    clientSecret: env.TWITTER_CLIENT_SECRET ?? "",
    scope: "users.read tweet.read",
    tokenUrl: "https://api.twitter.com/2/oauth2/token"
  };
}

async function startOAuth(request: Request, env: Env, provider: Provider): Promise<Response> {
  requireAuthConfig(env, provider);

  const url = new URL(request.url);
  const config = providerConfig(env, provider);
  const state: OAuthState = {
    codeVerifier: randomToken(64),
    provider,
    state: randomToken(32)
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
      "Location": authUrl.toString(),
      "Set-Cookie": cookie(request, "linkoutpost_oauth", signedState, 600)
    },
    status: 302
  });
}

async function exchangeOAuthCode(
  request: Request,
  env: Env,
  provider: Provider,
  code: string,
  codeVerifier: string
): Promise<{ access_token: string }> {
  const url = new URL(request.url);
  const config = providerConfig(env, provider);
  const body = new URLSearchParams({
    client_id: config.clientId,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: `${url.origin}/api/auth/${provider}/callback`
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  if (provider === "google") {
    body.set("client_secret", config.clientSecret);
  } else {
    headers.Authorization = `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`;
  }

  const response = await fetch(config.tokenUrl, {
    body,
    headers,
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.status}`);
  }

  return response.json() as Promise<{ access_token: string }>;
}

async function fetchIdentity(provider: Provider, accessToken: string): Promise<OAuthIdentity> {
  if (provider === "google") {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) throw new Error("Google userinfo failed");

    const user = await response.json() as {
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
      username: user.email ? user.email.split("@")[0] : null
    };
  }

  const response = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) throw new Error("Twitter userinfo failed");

  const payload = await response.json() as {
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
    username: payload.data.username ?? null
  };
}

async function ensureUniqueHandle(env: Env, preferred: string): Promise<string> {
  let base = normalizeHandle(preferred);
  if (!base || isReservedPath(base)) base = "user";

  for (let index = 0; index < 100; index += 1) {
    const handle = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await env.DB?.prepare(
      "SELECT id FROM users WHERE handle = ?"
    ).bind(handle).first<{ id: string }>();

    if (!existing) return handle;
  }

  return `${base}-${randomToken(4)}`;
}

async function upsertOAuthUser(env: Env, identity: OAuthIdentity): Promise<{
  handle: string;
  userId: string;
}> {
  if (!env.DB) throw new Error("D1 binding is not configured");

  const now = new Date().toISOString();
  const existingAccount = await env.DB.prepare(
    `SELECT users.id, users.handle
     FROM oauth_accounts
     JOIN users ON users.id = oauth_accounts.user_id
     WHERE oauth_accounts.provider = ? AND oauth_accounts.provider_user_id = ?`
  ).bind(identity.provider, identity.providerUserId).first<{
    handle: string;
    id: string;
  }>();

  if (existingAccount) {
    await env.DB.prepare(
      `UPDATE users
       SET display_name = ?, avatar_url = ?, updated_at = ?
       WHERE id = ?`
    ).bind(identity.displayName, identity.avatarUrl, now, existingAccount.id).run();
    await env.DB.prepare(
      `UPDATE oauth_accounts
       SET email = ?, username = ?, display_name = ?, avatar_url = ?, updated_at = ?
       WHERE provider = ? AND provider_user_id = ?`
    ).bind(
      identity.email,
      identity.username,
      identity.displayName,
      identity.avatarUrl,
      now,
      identity.provider,
      identity.providerUserId
    ).run();

    return {
      handle: existingAccount.handle,
      userId: existingAccount.id
    };
  }

  const userId = crypto.randomUUID();
  const handle = await ensureUniqueHandle(
    env,
    identity.username ?? identity.email?.split("@")[0] ?? identity.displayName
  );

  await env.DB.prepare(
    "INSERT INTO users (id, handle, display_name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(userId, handle, identity.displayName, identity.avatarUrl, now, now).run();
  await env.DB.prepare(
    `INSERT INTO oauth_accounts
       (provider, provider_user_id, user_id, email, username, display_name, avatar_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    identity.provider,
    identity.providerUserId,
    userId,
    identity.email,
    identity.username,
    identity.displayName,
    identity.avatarUrl,
    now,
    now
  ).run();

  return { handle, userId };
}

async function completeOAuth(request: Request, env: Env, provider: Provider): Promise<Response> {
  requireAuthConfig(env, provider);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return jsonError(`OAuth provider returned: ${error}`, 400);
  if (!code || !state) return jsonError("Missing OAuth callback parameters", 400);

  const oauthState = await verifyCookieValue<OAuthState>(
    env.AUTH_SECRET ?? "",
    readCookie(request, "linkoutpost_oauth")
  );

  if (!oauthState || oauthState.provider !== provider || oauthState.state !== state) {
    return jsonError("Invalid OAuth state", 400);
  }

  const token = await exchangeOAuthCode(
    request,
    env,
    provider,
    code,
    oauthState.codeVerifier
  );
  const identity = await fetchIdentity(provider, token.access_token);
  const user = await upsertOAuthUser(env, identity);
  const session: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    handle: user.handle,
    name: identity.displayName,
    provider,
    userId: user.userId
  };
  const signedSession = await signCookieValue(env.AUTH_SECRET ?? "", session);

  const headers = new Headers({
    "Location": "/admin"
  });
  headers.append("Set-Cookie", cookie(
    request,
    "linkoutpost_session",
    signedSession,
    60 * 60 * 24 * 30
  ));
  headers.append("Set-Cookie", clearCookie(request, "linkoutpost_oauth"));

  return new Response(null, {
    headers,
    status: 302
  });
}

async function renderHandlePage(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const handle = normalizeHandle(url.pathname.split("/").filter(Boolean)[0] ?? "");
  const initialState: InitialState = {
    pathname: url.pathname,
    profile: handle ? await readProfileByHandle(env, handle) : null,
    session: await getSession(request, env)
  };
  const stream = await renderToReadableStream(<App initialState={initialState} />);
  const appHtml = await new Response(stream).text();
  const shell = await env.ASSETS.fetch(new URL("/", request.url));

  if (!shell.ok) {
    return new Response("Missing index.html asset", { status: 500 });
  }

  const html = await shell.text();

  return new Response(
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${appHtml}</div><script>window.__LINKOUTPOST_INITIAL_STATE__=${serializeInitialState(initialState)}</script>`
    ),
    {
      headers: ssrHeaders,
      status: initialState.profile ? 200 : 404
    }
  );
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/auth/google/start") {
      try {
        return await startOAuth(request, env, "google");
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : "OAuth is not configured", 500);
      }
    }

    if (url.pathname === "/api/auth/twitter/start") {
      try {
        return await startOAuth(request, env, "twitter");
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : "OAuth is not configured", 500);
      }
    }

    if (url.pathname === "/api/auth/google/callback") {
      try {
        return await completeOAuth(request, env, "google");
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : "OAuth callback failed", 500);
      }
    }

    if (url.pathname === "/api/auth/twitter/callback") {
      try {
        return await completeOAuth(request, env, "twitter");
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : "OAuth callback failed", 500);
      }
    }

    if (url.pathname === "/api/logout") {
      return new Response(null, {
        headers: {
          "Location": "/admin",
          "Set-Cookie": clearCookie(request, "linkoutpost_session")
        },
        status: 302
      });
    }

    if (url.pathname === "/api/health") {
      return Response.json({
        service: "linkoutpost",
        status: "ok",
        timestamp: new Date().toISOString()
      }, {
        headers: apiHeaders
      });
    }

    if (url.pathname === "/api/session") {
      return Response.json(await getSession(request, env), {
        headers: apiHeaders
      });
    }

    if (url.pathname === "/api/profile") {
      const session = await getSession(request, env);
      const sessionPayload = await getSessionPayload(request, env);

      if (!session.authenticated || !session.handle || !sessionPayload || !env.DB) {
        return Response.json({
          authenticated: session.authenticated,
          error: env.DB ? "Unauthorized" : "Backend storage is not configured"
        }, {
          headers: apiHeaders,
          status: session.authenticated ? 503 : 401
        });
      }

      if (request.method === "GET") {
        const profile = await readProfileByHandle(env, session.handle);
        if (!profile) {
          return Response.json({ error: "Not found" }, {
            headers: apiHeaders,
            status: 404
          });
        }

        return Response.json(profile, {
          headers: apiHeaders
        });
      }

      if (request.method === "PUT") {
        const profile = createProfile(await request.json() as Partial<LinkProfile>);
        const normalizedHandle = normalizeHandle(profile.handle);

        if (normalizedHandle !== session.handle) {
          return jsonError("Profile handle must match the authenticated user", 403);
        }

        await writeProfile(env, sessionPayload.userId, profile);
        return Response.json({ ok: true }, {
          headers: apiHeaders
        });
      }

      return jsonError("Method not allowed", 405);
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        {
          error: "Not found"
        },
        {
          headers: apiHeaders,
          status: 404
        }
      );
    }

    return renderHandlePage(request, env);
  }
} satisfies ExportedHandler<Env>;
