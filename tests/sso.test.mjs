import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as jose from "jose";

const issuer = "https://auth.example.com";
const origin = "https://link.example.com";
const clientId = origin + "/api/auth/sso/client.json";
const callback = origin + "/api/auth/sso/callback";
const { privateKey, publicKey } = await jose.generateKeyPair("RS256", {
  extractable: true,
});
const edKeys = await jose.generateKeyPair("EdDSA", { extractable: true });
const edJwk = {
  ...(await jose.exportJWK(edKeys.publicKey)),
  kid: "ed-test",
  alg: "EdDSA",
  use: "sig",
};
const jwk = {
  ...(await jose.exportJWK(publicKey)),
  kid: "test",
  alg: "RS256",
  use: "sig",
};

function fixture(options = {}) {
  const requests = [];
  const writes = [];
  let authorization;
  const env = {
    OIDC_ISSUER_URL: issuer,
    AUTH_SECRET: "test-secret",
    DB: {
      prepare(sql) {
        const statement = {
          bind(...args) {
            statement.args = args;
            return statement;
          },
          async first() {
            if (sql.includes("provider = ? AND provider_user_id = ?"))
              return options.ssoAccount && statement.args[0] === "sso"
                ? { user_id: "original-local-user" }
                : null;
            if (sql.includes("WHERE sso_user_id")) {
              assert.equal(options.ssoAccount, undefined, "existing account mapping should win");
              assert.equal(statement.args[0], "existing-sso-user");
              return { id: "original-local-user" };
            }
            return null;
          },
          async run() {
            writes.push({ sql, args: statement.args });
            return {};
          },
        };
        return statement;
      },
    },
  };
  const fakeFetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, init });
    assert.equal(init.redirect, "manual");
    assert.equal(init.headers?.cookie, undefined);
    if (url.endsWith("/.well-known/openid-configuration"))
      return Response.json({
        issuer,
        jwks_uri: issuer + "/jwks",
        authorization_endpoint: issuer + "/authorize",
        token_endpoint: issuer + "/token",
        client_id_metadata_document_supported: true,
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none"],
        id_token_signing_alg_values_supported: ["RS256", "EdDSA"],
        ...options.discovery,
      });
    if (url === issuer + "/jwks") return Response.json({ keys: [jwk, edJwk] });
    if (url === issuer + "/token") {
      const body = new URLSearchParams(init.body);
      assert.equal(body.get("client_id"), clientId);
      assert.equal(body.get("redirect_uri"), callback);
      assert.equal(body.get("grant_type"), "authorization_code");
      assert.equal(body.get("client_secret"), null);
      const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(body.get("code_verifier")),
      );
      assert.equal(
        Buffer.from(hash).toString("base64url"),
        authorization.searchParams.get("code_challenge"),
      );
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        sub: "existing-sso-user",
        iss: issuer,
        aud: clientId,
        exp: now + 600,
        iat: now,
        nonce: authorization.searchParams.get("nonce"),
        name: "Existing user",
        email: "user@example.com",
        ...options.claims,
      };
      if (options.eddsa) {
        const digest = new Uint8Array(
          await crypto.subtle.digest(
            "SHA-512",
            new TextEncoder().encode("access"),
          ),
        );
        claims.at_hash = Buffer.from(
          digest.slice(0, digest.length / 2),
        ).toString("base64url");
      }
      let token = await new jose.SignJWT(claims)
        .setProtectedHeader(
          options.eddsa
            ? { alg: "EdDSA", kid: "ed-test" }
            : { alg: "RS256", kid: "test" },
        )
        .sign(options.eddsa ? edKeys.privateKey : privateKey);
      if (options.badSignature) {
        const parts = token.split(".");
        const signature = Buffer.from(parts[2], "base64url");
        signature[0] ^= 1;
        parts[2] = signature.toString("base64url");
        token = parts.join(".");
      }
      return Response.json({
        access_token: "access",
        token_type: "Bearer",
        id_token: options.missingIdToken ? undefined : token,
      });
    }
    throw new Error("Unexpected URL: " + url);
  };
  const modules = new Map();
  function module(name) {
    if (modules.has(name)) return modules.get(name);
    const exports = {};
    modules.set(name, exports);
    const source = ts.transpileModule(
      readFileSync(
        new URL(`../src/worker/${name}.ts`, import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.CommonJS,
        },
      },
    ).outputText;
    vm.runInNewContext(source, {
      exports,
      require(path) {
        if (path === "jose") return jose;
        if (path === "../siteConfig")
          return { resolveSiteTitle: (value) => value || "LinkOutpost" };
        if (path === "../profile") return { normalizeHandle: (value) => value };
        if (path === "./sso") return module("sso");
        throw new Error(path);
      },
      fetch: fakeFetch,
      crypto,
      Request,
      Response,
      Headers,
      URL,
      URLSearchParams,
      TextEncoder,
      TextDecoder,
      AbortSignal,
      atob,
      btoa,
      Uint8Array,
      Date,
    });
    return exports;
  }
  const api = module("auth");
  return {
    api,
    sso: module("sso"),
    env,
    requests,
    writes,
    async start(redirect = "/admin?create=my-page") {
      const response = await api.startSsoSignIn(
        new Request(
          origin +
            "/api/auth/sso/start?redirect_to=" +
            encodeURIComponent(redirect),
        ),
        env,
      );
      authorization = new URL(response.headers.get("location"));
      return {
        response,
        authorization,
        cookie: response.headers.get("set-cookie").split(";")[0],
      };
    },
    async finish(start, params = {}) {
      const url = new URL(callback);
      url.search = new URLSearchParams({
        code: "test-code",
        state: start.authorization.searchParams.get("state"),
        ...params,
      });
      return api.completeSsoSignIn(
        new Request(url, { headers: { cookie: start.cookie } }),
        env,
      );
    },
  };
}

test("CIMD metadata identifies the app and fixed callback", () => {
  const f = fixture();
  const response = f.sso.ssoClientMetadata(new Request(origin), f.env);
  return response.json().then((metadata) => {
    assert.equal(metadata.client_id, clientId);
    assert.deepEqual(metadata.redirect_uris, [callback]);
    assert.equal(metadata.token_endpoint_auth_method, "none");
    assert.equal(metadata.subject_type, "public");
  });
});

test("PKCE login reuses existing sso_user_id and original local session owner", async () => {
  const f = fixture();
  const start = await f.start();
  assert.equal(start.authorization.searchParams.get("client_id"), clientId);
  assert.equal(
    start.authorization.searchParams.get("code_challenge_method"),
    "S256",
  );
  assert.equal(start.response.headers.get("cache-control"), "no-store");
  const response = await f.finish(start);
  assert.equal(response.headers.get("location"), "/admin?create=my-page");
  const cookies = response.headers.getSetCookie();
  const session = cookies.find((cookie) =>
    cookie.startsWith("linkoutpost_session="),
  );
  const body = decodeURIComponent(session.split(";")[0].split("=")[1]).split(
    ".",
  )[0];
  assert.equal(
    JSON.parse(Buffer.from(body, "base64url")).userId,
    "original-local-user",
  );
  assert.ok(
    cookies.some(
      (cookie) =>
        cookie.startsWith("linkoutpost_sso=") && cookie.includes("Max-Age=0"),
    ),
  );
  assert.ok(
    f.writes.every(
      (write) => !write.sql.includes("INSERT INTO linkoutpost_users"),
    ),
  );
  assert.ok(
    f.requests.every(
      (request) =>
        !request.url.includes("get-session") &&
        !request.url.includes("list-accounts"),
    ),
  );
});

for (const [name, claims] of [
  ["wrong nonce", { nonce: "wrong" }],
  ["wrong issuer", { iss: "https://evil.example" }],
  ["wrong audience", { aud: issuer }],
  ["expired token", { exp: 1 }],
  ["missing subject", { sub: "" }],
  ["wrong authorized party", { azp: "another-client" }],
  ["multiple audiences without azp", { aud: [clientId, "another-client"] }],
  ["future issued time", { iat: Math.floor(Date.now() / 1000) + 3600 }],
  ["wrong token hash", { at_hash: "incorrect" }],
])
  test(`rejects ${name} before database writes`, async () => {
    const f = fixture({ claims });
    const response = await f.finish(await f.start());
    assert.equal(
      response.headers.get("location"),
      "/signin?error=oauth_failed",
    );
    assert.equal(f.writes.length, 0);
  });

test("rejects state tampering and callback issuer mismatch before token exchange", async () => {
  for (const params of [{ state: "wrong" }, { iss: "https://evil.example" }]) {
    const f = fixture();
    const response = await f.finish(await f.start(), params);
    assert.equal(response.headers.get("location"), "/signin?error=oauth_state");
    assert.equal(
      f.requests.filter((request) => request.url.endsWith("/token")).length,
      0,
    );
  }
});

test("rejects missing, tampered and expired login cookies", async () => {
  const f = fixture();
  const start = await f.start();
  for (const cookie of ["", start.cookie + "tampered"]) {
    const response = await f.finish({ ...start, cookie });
    assert.match(response.headers.get("location"), /error=oauth_state/);
  }
  const raw = decodeURIComponent(start.cookie.split("=")[1]);
  const state = JSON.parse(Buffer.from(raw.split(".")[0], "base64url"));
  state.exp = 1;
  const body = Buffer.from(JSON.stringify(state)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(f.env.AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = Buffer.from(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  ).toString("base64url");
  const response = await f.finish({
    ...start,
    cookie: `linkoutpost_sso=${body}.${sig}`,
  });
  assert.match(response.headers.get("location"), /error=oauth_state/);
});

test("rejects absent ID token", async () => {
  const f = fixture({ missingIdToken: true });
  assert.match(
    (await f.finish(await f.start())).headers.get("location"),
    /error=oauth_failed/,
  );
  assert.equal(f.writes.length, 0);
});

test("requires CIMD support and HTTPS metadata hosting", async () => {
  const f = fixture({
    discovery: { client_id_metadata_document_supported: false },
  });
  await assert.rejects(() => f.start());
  assert.throws(() =>
    f.sso.ssoClientMetadata(new Request("http://localhost:8787"), f.env),
  );
});

test("external return URLs fall back to admin", async () => {
  const f = fixture();
  assert.equal(
    (await f.finish(await f.start("//evil.example"))).headers.get("location"),
    "/admin",
  );
});

test("shared SSO cookies no longer silently hydrate a session", async () => {
  const f = fixture();
  const result = await f.api.hydrateSession(
    new Request(origin, {
      headers: { cookie: "better-auth.session_token=opaque" },
    }),
    f.env,
  );
  assert.equal(result.session.authenticated, false);
  assert.equal(f.requests.length, 0);
});

test("logout clears local session and pending authorization", async () => {
  const f = fixture();
  const response = await f.api.logoutResponse(new Request(origin), f.env);
  assert.equal(response.status, 302);
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.ok(
    response.headers
      .getSetCookie()
      .every((cookie) => cookie.includes("Max-Age=0")),
  );
  assert.equal(f.requests.length, 0);
});

test("accepts workers-sso EdDSA tokens and SHA-512 access-token hashes", async () => {
  const f = fixture({ eddsa: true });
  assert.equal(
    (await f.finish(await f.start())).headers.get("location"),
    "/admin?create=my-page",
  );
});

test("rejects invalid signatures before database writes", async () => {
  const f = fixture({ badSignature: true });
  assert.match(
    (await f.finish(await f.start())).headers.get("location"),
    /error=oauth_failed/,
  );
  assert.equal(f.writes.length, 0);
});

test("also reuses an existing provider=sso account mapping", async () => {
  const f = fixture({ ssoAccount: true });
  const response = await f.finish(await f.start());
  assert.equal(response.headers.get("location"), "/admin?create=my-page");
  assert.ok(
    f.writes.every(
      (write) => !write.sql.includes("INSERT INTO linkoutpost_users"),
    ),
  );
});

test("API bearer JWTs still use AUTH_AUDIENCE rather than the OIDC client ID", async () => {
  const f = fixture();
  const now = Math.floor(Date.now() / 1000);
  const token = await new jose.SignJWT({
    sub: "existing-sso-user",
    iss: issuer,
    aud: issuer,
    exp: now + 600,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .sign(privateKey);
  const identity = await f.sso.readIssuerIdentity(
    f.env,
    new Request(origin, {
      headers: { authorization: `Bearer ${token}` },
    }),
  );
  assert.equal(identity.id, "existing-sso-user");
  await assert.rejects(() =>
    f.sso.verifyIssuerJwt({ ...f.env, AUTH_AUDIENCE: clientId }, token),
  );
});
