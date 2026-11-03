import {
  createRemoteJWKSet,
  customFetch,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
} from "jose";
import { resolveSiteTitle } from "../siteConfig";
import type { Env } from "./env";

const CLIENT_PATH = "/api/auth/sso/client.json";
const CALLBACK_PATH = "/api/auth/sso/callback";
const PLACEHOLDER_EMAIL_SUFFIX = "@twitter.placeholder.invalid";
const ALGORITHMS = ["RS256", "ES256", "EdDSA", "Ed25519"];

type DiscoveryDocument = {
  issuer: string;
  jwks_uri: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  client_id_metadata_document_supported?: boolean;
  code_challenge_methods_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
};

export type IssuerIdentity = {
  accounts: { accountId: string; providerId: string }[];
  email: string | null;
  id: string;
  image: string | null;
  name: string;
};

export type SsoLoginState = {
  state: string;
  nonce: string;
  codeVerifier: string;
  issuer: string;
  clientId: string;
  redirectUri: string;
  redirectTo: string;
  exp: number;
};

let discoveryCache:
  { issuer: string; expiresAt: number; value: DiscoveryDocument } | undefined;
let keyCache:
  { uri: string; keys: ReturnType<typeof createRemoteJWKSet> } | undefined;

function endpoint(value: string): URL {
  const url = new URL(value);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(loopback && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error(
      "SSO endpoints require HTTPS without credentials or fragments",
    );
  }
  return url;
}

export function getAuthIssuer(env: Env): string {
  const value = String(env.OIDC_ISSUER_URL || "")
    .trim()
    .replace(/\/+$/, "");
  if (!value) return "";
  try {
    if (endpoint(value).search) return "";
    return value;
  } catch {
    return "";
  }
}

export function getAuthAudience(env: Env): string {
  return (
    String(env.AUTH_AUDIENCE || "")
      .trim()
      .replace(/\/+$/, "") || getAuthIssuer(env)
  );
}

export function hasIssuerSessionHint(request: Request): boolean {
  return /^Bearer\s+/i.test(request.headers.get("authorization") || "");
}

async function issuerFetch(
  url: string | URL,
  init?: RequestInit,
): Promise<Response> {
  endpoint(String(url));
  return fetch(url, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
}

async function getDiscovery(issuer: string): Promise<DiscoveryDocument> {
  if (
    discoveryCache?.issuer === issuer &&
    discoveryCache.expiresAt > Date.now()
  ) {
    return discoveryCache.value;
  }
  const response = await issuerFetch(
    issuer + "/.well-known/openid-configuration",
    {
      headers: { accept: "application/json" },
    },
  );
  if (!response.ok) throw new Error("Failed to load SSO discovery");
  const value = (await response.json()) as DiscoveryDocument;
  if (value.issuer !== issuer || !value.jwks_uri)
    throw new Error("Invalid SSO discovery");
  endpoint(value.jwks_uri);
  discoveryCache = { issuer, value, expiresAt: Date.now() + 3_600_000 };
  return value;
}

export function ssoClientConfiguration(request: Request, env: Env) {
  const issuer = getAuthIssuer(env);
  if (!issuer) throw new Error("OIDC_ISSUER_URL is required");
  const origin = new URL(request.url).origin;
  // The issuer must be able to fetch the document over public HTTPS.
  if (new URL(origin).protocol !== "https:")
    throw new Error("CIMD requires public HTTPS");
  return {
    issuer,
    clientId: new URL(CLIENT_PATH, origin).href,
    redirectUri: new URL(CALLBACK_PATH, origin).href,
  };
}

export function ssoClientMetadata(request: Request, env: Env): Response {
  const config = ssoClientConfiguration(request, env);
  return Response.json(
    {
      client_id: config.clientId,
      client_name: resolveSiteTitle(env.VITE_SITE_TITLE),
      client_uri: new URL("/", request.url).href,
      redirect_uris: [config.redirectUri],
      grant_types: ["authorization_code"],
      response_types: ["code"],
      scope: "openid profile email",
      subject_type: "public",
      token_endpoint_auth_method: "none",
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}

export async function ssoAuthorizationUrl(
  state: SsoLoginState,
  challenge: string,
): Promise<string> {
  const discovery = await getDiscovery(state.issuer);
  if (
    discovery.client_id_metadata_document_supported !== true ||
    !discovery.authorization_endpoint ||
    !discovery.token_endpoint ||
    (discovery.code_challenge_methods_supported &&
      !discovery.code_challenge_methods_supported.includes("S256")) ||
    (discovery.token_endpoint_auth_methods_supported &&
      !discovery.token_endpoint_auth_methods_supported.includes("none"))
  ) {
    throw new Error("SSO issuer does not support CIMD with S256 PKCE");
  }
  endpoint(discovery.token_endpoint);
  const url = endpoint(discovery.authorization_endpoint);
  url.search = new URLSearchParams({
    client_id: state.clientId,
    redirect_uri: state.redirectUri,
    response_type: "code",
    scope: "openid profile email",
    state: state.state,
    nonce: state.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  return url.href;
}

async function verifyToken(
  issuer: string,
  audience: string,
  token: string,
  idToken = false,
): Promise<JWTPayload> {
  const discovery = await getDiscovery(issuer);
  if (keyCache?.uri !== discovery.jwks_uri) {
    keyCache = {
      uri: discovery.jwks_uri,
      keys: createRemoteJWKSet(endpoint(discovery.jwks_uri), {
        [customFetch]: (url, init) => issuerFetch(url, init),
      }),
    };
  }
  const algorithms =
    idToken && discovery.id_token_signing_alg_values_supported
      ? ALGORITHMS.filter((alg) =>
          discovery.id_token_signing_alg_values_supported!.includes(alg),
        )
      : ALGORITHMS;
  const { payload } = await jwtVerify(token, keyCache.keys, {
    issuer,
    audience,
    algorithms,
    requiredClaims: idToken ? ["sub", "exp", "iat", "nonce"] : ["sub", "exp"],
  });
  if (!payload.sub) throw new Error("SSO token missing subject");
  return payload;
}

export async function verifyIssuerJwt(
  env: Env,
  token: string,
): Promise<Record<string, unknown>> {
  return verifyToken(getAuthIssuer(env), getAuthAudience(env), token);
}

function identityFromClaims(claims: JWTPayload): IssuerIdentity {
  const email = typeof claims.email === "string" ? claims.email.trim() : "";
  return {
    accounts: [],
    id: claims.sub!,
    email:
      email.includes("@") &&
      !email.toLowerCase().endsWith(PLACEHOLDER_EMAIL_SUFFIX)
        ? email
        : null,
    name:
      typeof claims.name === "string" && claims.name.trim()
        ? claims.name.trim()
        : claims.sub!,
    image: typeof claims.picture === "string" ? claims.picture : null,
  };
}

export async function exchangeSsoCode(
  state: SsoLoginState,
  code: string,
): Promise<IssuerIdentity> {
  const discovery = await getDiscovery(state.issuer);
  if (!discovery.token_endpoint) throw new Error("SSO token endpoint missing");
  const response = await issuerFetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: state.clientId,
      redirect_uri: state.redirectUri,
      code_verifier: state.codeVerifier,
      code,
    }).toString(),
  });
  if (!response.ok) throw new Error("SSO code exchange failed");
  const tokens = (await response.json()) as {
    id_token?: string;
    access_token?: string;
    token_type?: string;
  };
  if (
    typeof tokens.id_token !== "string" ||
    typeof tokens.access_token !== "string" ||
    tokens.token_type?.toLowerCase() !== "bearer"
  )
    throw new Error("Invalid SSO token response");
  const claims = await verifyToken(
    state.issuer,
    state.clientId,
    tokens.id_token,
    true,
  );
  if (
    claims.nonce !== state.nonce ||
    (Array.isArray(claims.aud) &&
      claims.aud.length > 1 &&
      claims.azp !== state.clientId) ||
    (claims.azp !== undefined && claims.azp !== state.clientId) ||
    typeof claims.iat !== "number" ||
    claims.iat > Math.floor(Date.now() / 1000) + 60
  ) {
    throw new Error("SSO ID token does not match login");
  }
  // Ed25519 uses SHA-512 for OIDC hash claims; RS256 and ES256 use SHA-256.
  const alg = decodeProtectedHeader(tokens.id_token).alg;
  const hashAlgorithm =
    alg === "EdDSA" || alg === "Ed25519" ? "SHA-512" : "SHA-256";
  for (const [claim, value] of [
    [claims.at_hash, tokens.access_token],
    [claims.c_hash, code],
  ] as const) {
    if (claim === undefined) continue;
    const digest = new Uint8Array(
      await crypto.subtle.digest(
        hashAlgorithm,
        new TextEncoder().encode(value),
      ),
    );
    const expected = btoa(
      String.fromCharCode(...digest.slice(0, digest.length / 2)),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    if (claim !== expected) throw new Error("SSO ID token hash mismatch");
  }
  return identityFromClaims(claims);
}

export async function readIssuerIdentity(
  env: Env,
  request: Request,
): Promise<IssuerIdentity | null> {
  const match = (request.headers.get("authorization") || "").match(
    /^Bearer\s+(.+)$/i,
  );
  if (!getAuthIssuer(env) || !match) return null;
  return identityFromClaims(await verifyIssuerJwt(env, match[1].trim()));
}
