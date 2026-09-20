import type { Env } from "./env";

const PLACEHOLDER_EMAIL_SUFFIX = "@twitter.placeholder.invalid";
const DISCOVERY_TTL_MS = 60 * 60 * 1000;
const JWKS_TTL_MS = 60 * 60 * 1000;

type DiscoveryDocument = {
  issuer?: string;
  jwks_uri?: string;
};

type JsonWebKeyLike = JsonWebKey & {
  alg?: string;
  crv?: string;
  kid?: string;
  kty?: string;
  x?: string;
};

type IssuerAccount = {
  accountId: string;
  providerId: string;
};

export type IssuerIdentity = {
  accounts: IssuerAccount[];
  email: string | null;
  id: string;
  image: string | null;
  name: string;
};

let discoveryCache: {
  expiresAt: number;
  issuer: string;
  value: DiscoveryDocument;
} | null = null;
let jwksCache: { expiresAt: number; keys: JsonWebKeyLike[]; uri: string } | null =
  null;

export function getAuthIssuer(env: Env): string {
  const raw = String(env.AUTH_ISSUER || "")
    .trim()
    .replace(/\/+$/, "");
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return raw;
  } catch {
    return "";
  }
}

export function getAuthAudience(env: Env): string {
  const issuer = getAuthIssuer(env);
  const audience = String(env.AUTH_AUDIENCE || "")
    .trim()
    .replace(/\/+$/, "");
  return audience || issuer;
}

export function getIssuerLoginOrigin(issuer: string): string {
  return new URL(issuer).origin;
}

export function hasIssuerSessionHint(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  const authorization = request.headers.get("authorization") || "";
  return /better-auth/i.test(cookie) || /^Bearer\s+/i.test(authorization);
}

function getBearerToken(request: Request): string {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function isUsableEmail(value: unknown): value is string {
  const email = String(value || "").trim();
  if (!email || !email.includes("@")) return false;
  if (email.toLowerCase().endsWith(PLACEHOLDER_EMAIL_SUFFIX)) return false;
  return true;
}

async function getDiscovery(issuer: string): Promise<DiscoveryDocument> {
  if (
    discoveryCache &&
    discoveryCache.issuer === issuer &&
    discoveryCache.expiresAt > Date.now()
  ) {
    return discoveryCache.value;
  }

  const response = await fetch(issuer + "/.well-known/openid-configuration", {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to load AUTH_ISSUER discovery document");
  }
  const value = (await response.json()) as DiscoveryDocument;
  if (!value.jwks_uri || value.issuer !== issuer) {
    throw new Error("AUTH_ISSUER discovery document is invalid");
  }
  discoveryCache = {
    expiresAt: Date.now() + DISCOVERY_TTL_MS,
    issuer,
    value,
  };
  return value;
}

async function getJwks(jwksUri: string): Promise<JsonWebKeyLike[]> {
  if (
    jwksCache &&
    jwksCache.uri === jwksUri &&
    jwksCache.expiresAt > Date.now()
  ) {
    return jwksCache.keys;
  }

  const response = await fetch(jwksUri, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to load AUTH_ISSUER JWKS");
  }
  const payload = (await response.json()) as { keys?: JsonWebKeyLike[] };
  const keys = Array.isArray(payload.keys) ? payload.keys : [];
  jwksCache = {
    expiresAt: Date.now() + JWKS_TTL_MS,
    keys,
    uri: jwksUri,
  };
  return keys;
}

function decodeJwtSegment(segment: string): Record<string, unknown> {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const base64 = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
}

function base64UrlToUint8Array(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const base64 = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(base64);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }
  return output;
}

async function verifyJwtSignature(
  token: string,
  jwk: JsonWebKeyLike,
  alg: unknown,
): Promise<boolean> {
  const [rawHeader, rawPayload, rawSignature] = token.split(".");
  const signedContent = new TextEncoder().encode(rawHeader + "." + rawPayload);
  const signature = base64UrlToUint8Array(rawSignature);

  if (alg === "EdDSA" || jwk.kty === "OKP") {
    const key = await crypto.subtle.importKey(
      "jwk",
      {
        alg: jwk.alg || "EdDSA",
        crv: jwk.crv || "Ed25519",
        kty: "OKP",
        x: jwk.x,
      },
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      signature as BufferSource,
      signedContent,
    );
  }

  if (alg === "RS256" || jwk.kty === "RSA") {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      signature as BufferSource,
      signedContent,
    );
  }

  throw new Error("Unsupported AUTH_ISSUER token alg: " + String(alg));
}

export async function verifyIssuerJwt(
  env: Env,
  token: string,
): Promise<Record<string, unknown>> {
  const issuer = getAuthIssuer(env);
  const audience = getAuthAudience(env);
  if (!issuer || !token) {
    throw new Error("AUTH_ISSUER token is missing");
  }

  const [rawHeader, rawPayload, rawSignature] = token.split(".");
  if (!rawHeader || !rawPayload || !rawSignature) {
    throw new Error("Invalid AUTH_ISSUER token format");
  }

  const header = decodeJwtSegment(rawHeader);
  const payload = decodeJwtSegment(rawPayload);
  const discovery = await getDiscovery(issuer);
  const keys = await getJwks(discovery.jwks_uri || "");
  const jwk =
    keys.find((entry) => entry.kid && entry.kid === header.kid) || keys[0];
  if (!jwk) {
    throw new Error("Unable to find matching AUTH_ISSUER signing key");
  }

  const verified = await verifyJwtSignature(token, jwk, header.alg);
  if (!verified) {
    throw new Error("AUTH_ISSUER token signature verification failed");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.iss !== issuer) {
    throw new Error("AUTH_ISSUER token issuer mismatch");
  }
  const tokenAudience = payload.aud;
  const audienceMatches = Array.isArray(tokenAudience)
    ? tokenAudience.includes(audience)
    : tokenAudience === audience;
  if (!audienceMatches) {
    throw new Error("AUTH_ISSUER token audience mismatch");
  }
  if (typeof payload.exp !== "number" || payload.exp <= nowSeconds) {
    throw new Error("AUTH_ISSUER token is expired");
  }
  if (typeof payload.nbf === "number" && payload.nbf > nowSeconds + 60) {
    throw new Error("AUTH_ISSUER token is not yet valid");
  }
  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("AUTH_ISSUER token missing subject");
  }

  return payload;
}

async function fetchIssuerJson(
  url: string,
  cookieHeader: string,
): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      cookie: cookieHeader,
    },
    redirect: "manual",
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

function readSessionUser(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: { user?: unknown }; user?: unknown };
  if (record.user && typeof record.user === "object") {
    return record.user as Record<string, unknown>;
  }
  if (record.data?.user && typeof record.data.user === "object") {
    return record.data.user as Record<string, unknown>;
  }
  return null;
}

function readAccounts(payload: unknown): IssuerAccount[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] } | null)?.data)
      ? (payload as { data: unknown[] }).data
      : [];
  return rows
    .map((row) => {
      const record = (row || {}) as Record<string, unknown>;
      return {
        accountId: String(record.accountId || record.account_id || "").trim(),
        providerId: String(record.providerId || record.provider || "").trim(),
      };
    })
    .filter(
      (row) =>
        row.providerId &&
        row.accountId &&
        row.providerId !== "credential",
    );
}

export async function readIssuerIdentity(
  env: Env,
  request: Request,
): Promise<IssuerIdentity | null> {
  const issuer = getAuthIssuer(env);
  if (!issuer) return null;

  const cookieHeader = request.headers.get("Cookie") || "";
  const bearer = getBearerToken(request);
  let claims: Record<string, unknown> | null = null;
  if (bearer) {
    claims = await verifyIssuerJwt(env, bearer);
  }

  let sessionUser: Record<string, unknown> | null = null;
  let accounts: IssuerAccount[] = [];
  if (cookieHeader) {
    sessionUser = readSessionUser(
      await fetchIssuerJson(issuer + "/get-session", cookieHeader),
    );
    if (sessionUser) {
      accounts = readAccounts(
        await fetchIssuerJson(issuer + "/list-accounts", cookieHeader),
      );
    }
  }

  const id = String(claims?.sub || sessionUser?.id || "").trim();
  if (!id) return null;

  const email = claims?.email || sessionUser?.email || null;
  return {
    accounts,
    email: isUsableEmail(email) ? String(email).trim() : null,
    id,
    image:
      (typeof claims?.picture === "string" && claims.picture) ||
      (typeof claims?.image === "string" && claims.image) ||
      (typeof sessionUser?.image === "string" && sessionUser.image) ||
      null,
    name: String(claims?.name || sessionUser?.name || "").trim() || id,
  };
}

