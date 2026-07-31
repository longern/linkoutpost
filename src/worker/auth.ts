import { normalizeHandle } from "../profile";
import { resolveSiteTitle } from "../siteConfig";
import type { AuthProvider, SessionState } from "../types";
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

export type Provider = Exclude<AuthProvider, "email">;
type SignInErrorCode =
  | "email_expired"
  | "email_failed"
  | "email_invalid"
  | "oauth_callback"
  | "oauth_failed"
  | "oauth_provider"
  | "oauth_state"
  | "oauth_unavailable";

type SessionPayload = {
  exp: number;
  name: string;
  provider: AuthProvider;
  userId: string;
};

type EmailAuthToken = {
  email: string;
  exp: number;
  redirectTo?: string;
};

type OAuthState = {
  codeVerifier?: string;
  provider: Provider;
  redirectTo?: string;
  state: string;
};

type AuthIdentity = {
  avatarUrl: string | null;
  displayName: string;
  email: string | null;
  provider: AuthProvider;
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
    email: Boolean(
      env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.AUTH_SECRET && env.DB,
    ),
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    shopify: Boolean(
      env.SHOPIFY_STOREFRONT_DOMAIN &&
      env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID &&
      env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET,
    ),
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

function preserveRequestedHandle(
  signinUrl: URL,
  redirectTo: string | undefined,
): void {
  if (!redirectTo) return;

  const redirectUrl = new URL(redirectTo, signinUrl.origin);
  const requestedHandle = normalizeHandle(
    redirectUrl.searchParams.get("create") ?? "",
  );
  if (redirectUrl.pathname === "/admin" && requestedHandle) {
    signinUrl.searchParams.set("create", requestedHandle);
  }
}

export function signInErrorRedirect(
  request: Request,
  error: SignInErrorCode,
  clearOAuthCookie = true,
): Response {
  const requestUrl = new URL(request.url);
  const redirectTo = safeLocalRedirect(
    requestUrl.searchParams.get("redirect_to"),
  );
  const signinUrl = new URL("/signin", requestUrl.origin);

  signinUrl.searchParams.set("error", error);
  preserveRequestedHandle(signinUrl, redirectTo);

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

export async function getSession(
  request: Request,
  env: Env,
): Promise<SessionState> {
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

function normalizeEmail(
  value: FormDataEntryValue | string | null,
): string | null {
  if (typeof value !== "string") return null;

  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : null;
}

function requireEmailAuthConfig(env: Env): void {
  if (!env.DB) throw new Error("D1 binding is required for email login");
  if (!env.AUTH_SECRET)
    throw new Error("AUTH_SECRET is required for email login");
  if (!env.RESEND_API_KEY)
    throw new Error("RESEND_API_KEY is required for email login");
  if (!env.RESEND_FROM_EMAIL)
    throw new Error("RESEND_FROM_EMAIL is required for email login");
}

function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type EmailLanguage = "en" | "zh";

function normalizeEmailLanguage(
  value: FormDataEntryValue | string | null,
): EmailLanguage | null {
  if (typeof value !== "string") return null;

  const language = value.trim().toLowerCase().split("-")[0];
  return language === "en" || language === "zh" ? language : null;
}

function resolveEmailLanguage(
  request: Request,
  selectedLanguage: FormDataEntryValue | null,
): EmailLanguage {
  const selected = normalizeEmailLanguage(selectedLanguage);
  if (selected) return selected;

  const acceptedLanguages = (request.headers.get("Accept-Language") ?? "")
    .split(",")
    .map((value) => value.split(";")[0]);
  for (const acceptedLanguage of acceptedLanguages) {
    const language = normalizeEmailLanguage(acceptedLanguage);
    if (language) return language;
  }

  return "en";
}

function createEmailSignInContent({
  callbackUrl,
  language,
  siteTitle,
}: {
  callbackUrl: string;
  language: EmailLanguage;
  siteTitle: string;
}): {
  html: string;
  subject: string;
  text: string;
} {
  const copy =
    language === "zh"
      ? {
          button: "继续登录",
          expiry: "此链接将在 10 分钟后过期。",
          fallback: "如果按钮无法跳转，请复制以下链接并粘贴到浏览器中：",
          heading: `登录 ${siteTitle}`,
          intro: "点击下方按钮继续登录。",
          lang: "zh-CN",
          notice: "如果这不是你的操作，可以忽略此邮件。",
          subject: `登录 ${siteTitle}`,
        }
      : {
          button: "Continue",
          expiry: "This link expires in 10 minutes.",
          fallback:
            "If the button does not work, copy and paste this link into your browser:",
          heading: `Sign in to ${siteTitle}`,
          intro: "Use the button below to continue signing in.",
          lang: "en",
          notice:
            "If you did not request this email, you can safely ignore it.",
          subject: `Sign in to ${siteTitle}`,
        };
  const escapedCallbackUrl = escapeEmailHtml(callbackUrl);
  const escapedHeading = escapeEmailHtml(copy.heading);
  const escapedSiteTitle = escapeEmailHtml(siteTitle);

  return {
    html:
      `<!doctype html><html lang="${copy.lang}"><body style="margin:0;background:#101010;color:#f2f2f2;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">` +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#101010;">' +
      '<tr><td align="center" style="padding:32px 16px;">' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#181818;border:1px solid #343434;border-radius:12px;">' +
      '<tr><td style="padding:32px;">' +
      `<p style="margin:0 0 12px;color:#ff9bb2;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${escapedSiteTitle}</p>` +
      `<h1 style="margin:0 0 12px;color:#ffffff;font-size:28px;line-height:1.2;">${escapedHeading}</h1>` +
      `<p style="margin:0 0 24px;color:#c3c3c3;font-size:16px;line-height:1.6;">${copy.intro}</p>` +
      `<p style="margin:0 0 24px;text-align:center;"><a href="${escapedCallbackUrl}" style="display:inline-block;background:#81021f;border-radius:8px;color:#ffffff!important;font-size:16px;font-weight:700;line-height:1;text-decoration:none;padding:14px 22px;">${copy.button}</a></p>` +
      `<p style="margin:0 0 8px;color:#c3c3c3;font-size:13px;line-height:1.5;">${copy.expiry}</p>` +
      `<p style="margin:0 0 24px;color:#949494;font-size:13px;line-height:1.5;">${copy.notice}</p>` +
      '<div style="border-top:1px solid #343434;padding-top:18px;">' +
      `<p style="margin:0 0 8px;color:#949494;font-size:12px;line-height:1.5;">${copy.fallback}</p>` +
      `<p style="margin:0;color:#ff9bb2;font-size:11px;line-height:1.5;overflow-wrap:anywhere;word-break:break-all;"><a href="${escapedCallbackUrl}" style="color:#ff9bb2;text-decoration:underline;">${escapedCallbackUrl}</a></p>` +
      "</div></td></tr></table></td></tr></table></body></html>",
    subject: copy.subject,
    text:
      `${copy.heading}\n\n${copy.intro}\n\n${callbackUrl}\n\n` +
      `${copy.expiry}\n${copy.notice}\n\n${copy.fallback}\n${callbackUrl}`,
  };
}

export async function startEmailSignIn(
  request: Request,
  env: Env,
): Promise<Response> {
  requireEmailAuthConfig(env);

  const requestUrl = new URL(request.url);
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin && requestOrigin !== requestUrl.origin) {
    throw new Error("Cross-origin email login is not allowed");
  }

  const redirectTo = safeLocalRedirect(
    requestUrl.searchParams.get("redirect_to"),
  );
  const formData = await request.formData();
  const email = normalizeEmail(formData.get("email"));
  const language = resolveEmailLanguage(request, formData.get("language"));
  if (!email) {
    return signInErrorRedirect(request, "email_invalid", false);
  }

  const token = await signCookieValue(env.AUTH_SECRET ?? "", {
    email,
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
    redirectTo,
  } satisfies EmailAuthToken);
  const callbackUrl = new URL("/api/auth/email/callback", requestUrl.origin);
  callbackUrl.searchParams.set("token", token);

  const siteTitle = resolveSiteTitle(env.VITE_SITE_TITLE);
  const emailContent = createEmailSignInContent({
    callbackUrl: callbackUrl.toString(),
    language,
    siteTitle,
  });
  const resendResponse = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      html: emailContent.html,
      subject: emailContent.subject,
      text: emailContent.text,
      to: [email],
    }),
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `email-login-${randomToken(16)}`,
    },
    method: "POST",
  });

  if (!resendResponse.ok) {
    const resendError = await resendResponse.text();
    console.error("Resend email failed", {
      error: resendError.slice(0, 1_000),
      status: resendResponse.status,
      statusText: resendResponse.statusText,
    });
    throw new Error(`Resend email failed: ${resendResponse.status}`);
  }

  const signinUrl = new URL("/signin", requestUrl.origin);
  signinUrl.searchParams.set("email_sent", "1");
  preserveRequestedHandle(signinUrl, redirectTo);

  return new Response(null, {
    headers: {
      Location: `${signinUrl.pathname}${signinUrl.search}`,
    },
    status: 302,
  });
}

export async function completeEmailSignIn(
  request: Request,
  env: Env,
): Promise<Response> {
  requireEmailAuthConfig(env);

  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");
  const payload = await verifyCookieValue<EmailAuthToken>(
    env.AUTH_SECRET ?? "",
    token,
  );
  const email = normalizeEmail(payload?.email ?? null);

  if (!payload || !email || payload.exp < Math.floor(Date.now() / 1000)) {
    return signInErrorRedirect(request, "email_expired", false);
  }

  const displayName = email.split("@")[0] || email;
  const user = await upsertAuthUser(env, {
    avatarUrl: null,
    displayName,
    email,
    provider: "email",
    providerUserId: email,
    username: displayName,
  });
  const session: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    name: displayName,
    provider: "email",
    userId: user.userId,
  };
  const signedSession = await signCookieValue(
    getAuthSecret(env, request),
    session,
  );

  return new Response(null, {
    headers: {
      Location: payload.redirectTo ?? "/admin",
      "Set-Cookie": cookie(
        request,
        "linkoutpost_session",
        signedSession,
        60 * 60 * 24 * 30,
      ),
    },
    status: 302,
  });
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

  if (
    provider === "shopify" &&
    (!env.SHOPIFY_STOREFRONT_DOMAIN ||
      !env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID ||
      !env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET)
  ) {
    throw new Error("Shopify Customer Account credentials are not configured");
  }
}

type ProviderConfig = {
  authUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  tokenAuth: "basic" | "body";
  tokenUrl: string;
  usesPkce: boolean;
};

function shopifyStorefrontOrigin(env: Env): string {
  const value = env.SHOPIFY_STOREFRONT_DOMAIN?.trim();
  if (!value) throw new Error("Shopify storefront domain is not configured");

  const url = new URL(value.includes("://") ? value : `https://${value}`);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Shopify storefront domain must be an HTTPS origin");
  }

  return url.origin;
}

function requireHttpsEndpoint(value: unknown, name: string): string {
  if (typeof value !== "string") {
    throw new Error(`Shopify discovery response is missing ${name}`);
  }

  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error(`Shopify ${name} must use HTTPS`);
  }

  return url.toString();
}

async function fetchShopifyDiscovery<T>(
  env: Env,
  pathname: string,
): Promise<T> {
  const response = await fetch(`${shopifyStorefrontOrigin(env)}${pathname}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Shopify discovery failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function providerConfig(
  env: Env,
  provider: Provider,
): Promise<ProviderConfig> {
  if (provider === "google") {
    return {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
      scope: "openid email profile",
      tokenAuth: "body",
      tokenUrl: "https://oauth2.googleapis.com/token",
      usesPkce: true,
    };
  }

  if (provider === "twitter") {
    return {
      authUrl: "https://twitter.com/i/oauth2/authorize",
      clientId: env.TWITTER_CLIENT_ID ?? "",
      clientSecret: env.TWITTER_CLIENT_SECRET ?? "",
      scope: "users.read tweet.read",
      tokenAuth: "basic",
      tokenUrl: "https://api.twitter.com/2/oauth2/token",
      usesPkce: true,
    };
  }

  const discovery = await fetchShopifyDiscovery<{
    authorization_endpoint?: unknown;
    token_endpoint?: unknown;
  }>(env, "/.well-known/openid-configuration");

  return {
    authUrl: requireHttpsEndpoint(
      discovery.authorization_endpoint,
      "authorization_endpoint",
    ),
    clientId: env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID ?? "",
    clientSecret: env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET ?? "",
    scope: "openid email customer-account-api:full",
    tokenAuth: "basic",
    tokenUrl: requireHttpsEndpoint(discovery.token_endpoint, "token_endpoint"),
    usesPkce: false,
  };
}

export async function startOAuth(
  request: Request,
  env: Env,
  provider: Provider,
): Promise<Response> {
  requireAuthConfig(env, provider);

  const url = new URL(request.url);
  const config = await providerConfig(env, provider);
  const state: OAuthState = {
    provider,
    redirectTo: safeLocalRedirect(url.searchParams.get("redirect_to")),
    state: randomToken(32),
  };
  if (config.usesPkce) state.codeVerifier = randomToken(64);
  const signedState = await signCookieValue(env.AUTH_SECRET ?? "", state);
  const redirectUri = `${url.origin}/api/auth/${provider}/callback`;
  const authUrl = new URL(config.authUrl);

  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scope);
  authUrl.searchParams.set("state", state.state);
  if (state.codeVerifier) {
    authUrl.searchParams.set(
      "code_challenge",
      await sha256(state.codeVerifier),
    );
    authUrl.searchParams.set("code_challenge_method", "S256");
  }

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
  codeVerifier?: string,
): Promise<{ access_token: string }> {
  const url = new URL(request.url);
  const config = await providerConfig(env, provider);
  const body = new URLSearchParams({
    client_id: config.clientId,
    code,
    grant_type: "authorization_code",
    redirect_uri: `${url.origin}/api/auth/${provider}/callback`,
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (codeVerifier) body.set("code_verifier", codeVerifier);

  if (config.tokenAuth === "body") {
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
  env: Env,
  provider: Provider,
  accessToken: string,
): Promise<AuthIdentity> {
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

  if (provider === "twitter") {
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

  const discovery = await fetchShopifyDiscovery<{ graphql_api?: unknown }>(
    env,
    "/.well-known/customer-account-api",
  );
  const response = await fetch(
    requireHttpsEndpoint(discovery.graphql_api, "graphql_api"),
    {
      body: JSON.stringify({
        query: `query CustomerIdentity {
          customer {
            id
            displayName
            emailAddress { emailAddress }
            imageUrl
          }
        }`,
      }),
      headers: {
        Accept: "application/json",
        Authorization: accessToken,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`Shopify customer query failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      customer?: {
        displayName?: string;
        emailAddress?: { emailAddress?: string } | null;
        id?: string;
        imageUrl?: string | null;
      } | null;
    };
    errors?: unknown[];
  };
  const customer = payload.data?.customer;
  if (payload.errors?.length || !customer?.id) {
    throw new Error("Shopify customer identity is unavailable");
  }

  const email = customer.emailAddress?.emailAddress ?? null;
  return {
    avatarUrl: customer.imageUrl ?? null,
    displayName: customer.displayName || email || "Shopify customer",
    email,
    provider,
    providerUserId: customer.id,
    username: email ? email.split("@")[0] : null,
  };
}

async function upsertAuthUser(
  env: Env,
  identity: AuthIdentity,
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
  const identity = await fetchIdentity(env, provider, token.access_token);
  const user = await upsertAuthUser(env, identity);
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
    Location: oauthState.redirectTo ?? "/admin",
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
