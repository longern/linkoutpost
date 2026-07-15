import { renderToReadableStream } from "react-dom/server.browser";
import {
  App,
  type InitialState,
} from "./App";
import { renderDocumentMeta, replaceDocumentMeta } from "./documentMeta";
import {
  findDocumentTitle,
  findFaviconUrl,
} from "./linkMetadata";
import {
  findOEmbedJsonEndpoint,
  sanitizeGenericOEmbedHtml,
} from "./oembed/generic";
import {
  createProfile,
  hostedHandleMinLength,
  isHostedHandleTooShort,
  isReservedPath,
  normalizeHandle,
  type LinkProfile,
} from "./profile";
import { readUserFile, writeProfileAssetUpload } from "./worker/assetStorage";
import {
  clearCookie,
  completeOAuth,
  getSession,
  getSessionPayload,
  signInErrorRedirect,
  startOAuth,
} from "./worker/auth";
import type { Env } from "./worker/env";
import { apiHeaders, jsonError, ssrHeaders } from "./worker/http";
import {
  listProfilesByOwner,
  readProfileByHandle,
  readProfileByOwner,
  writeProfile,
} from "./worker/profileRepository";

export type { Env } from "./worker/env";

let cachedProfileRuntimeScript: string | null = null;

function serializeInitialState(state: InitialState): string {
  return JSON.stringify(state).replace(/</g, "\\u003c");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScript(value: string): string {
  return value.replace(/<\/script/gi, "<\\/script");
}

function isClientAppRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/signin" ||
    pathname.startsWith("/signin/") ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/license" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

function removeClientEntrypoints(html: string): string {
  return html
    .replace(/<script\b[^>]*\btype=["']module["'][^>]*><\/script>\s*/gi, "")
    .replace(/<link\b[^>]*\brel=["']modulepreload["'][^>]*>\s*/gi, "");
}

function isSupportedOEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function resolveGenericOEmbed(url: string): Promise<Response> {
  if (!isSupportedOEmbedUrl(url)) {
    return jsonError("Unsupported URL", 400);
  }

  const pageResponse = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "LinkOutpost oEmbed resolver",
    },
  });

  if (!pageResponse.ok) {
    return jsonError("Unable to fetch URL", 404);
  }

  const endpoint = findOEmbedJsonEndpoint(await pageResponse.text(), url);
  if (!endpoint) {
    return jsonError("No oEmbed endpoint found", 404);
  }

  const oembedResponse = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "LinkOutpost oEmbed resolver",
    },
  });

  if (!oembedResponse.ok) {
    return jsonError("oEmbed fetch failed", 404);
  }

  const payload = (await oembedResponse.json()) as {
    html?: unknown;
    title?: unknown;
  };
  const html =
    typeof payload.html === "string"
      ? sanitizeGenericOEmbedHtml(payload.html)
      : null;

  if (!html) {
    return jsonError("Unsupported oEmbed HTML", 422);
  }

  return Response.json(
    {
      html,
      provider: "generic",
      title: typeof payload.title === "string" ? payload.title : "",
    },
    {
      headers: apiHeaders,
    },
  );
}

async function resolveLinkMetadataResponse(url: string): Promise<Response> {
  if (!isSupportedOEmbedUrl(url)) {
    return jsonError("Unsupported URL", 400);
  }

  const pageResponse = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "LinkOutpost metadata resolver",
    },
  });
  if (!pageResponse.ok) return jsonError("Unable to fetch URL", 404);

  const pageHtml = await pageResponse.text();
  const endpoint = findOEmbedJsonEndpoint(pageHtml, url);

  return Response.json(
    {
      embedAvailable: Boolean(endpoint),
      faviconUrl: findFaviconUrl(pageHtml, url),
      title: findDocumentTitle(pageHtml),
    },
    { headers: apiHeaders },
  );
}

async function readProfileRuntimeScript(
  env: Env,
  request: Request,
): Promise<string> {
  if (cachedProfileRuntimeScript) return cachedProfileRuntimeScript;

  const response = await env.ASSETS.fetch(
    new URL("/assets/profile-runtime.js", request.url),
  );

  if (!response.ok) {
    throw new Error("Missing profile runtime asset");
  }

  cachedProfileRuntimeScript = await response.text();
  return cachedProfileRuntimeScript;
}

async function renderHandlePage(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const handle = normalizeHandle(
    url.pathname.split("/").filter(Boolean)[0] ?? "",
  );
  const initialState: InitialState = {
    pathname: url.pathname,
    profile: handle ? await readProfileByHandle(env, handle) : null,
    session: await getSession(request, env),
  };
  const stream = await renderToReadableStream(
    <App initialState={initialState} />,
  );
  const appHtml = await new Response(stream).text();
  const shell = await env.ASSETS.fetch(new URL("/", request.url));

  if (!shell.ok) {
    return new Response("Missing index.html asset", { status: 500 });
  }

  const html = await shell.text();

  const isPublicProfileRoute = !isClientAppRoute(url.pathname);
  const documentMeta = renderDocumentMeta({
    profile: initialState.profile,
    type: isPublicProfileRoute ? "profile" : "website",
    url: `${url.origin}${url.pathname}`,
  });
  const profileRuntimeScript = isPublicProfileRoute
    ? `<script>${escapeScript(await readProfileRuntimeScript(env, request))}</script>`
    : "";
  const renderedHtml = replaceDocumentMeta(
    isPublicProfileRoute ? removeClientEntrypoints(html) : html,
    documentMeta,
  )
    .replace(
      '<div id="app"></div>',
      isPublicProfileRoute
        ? `<div id="app">${appHtml}</div>`
        : `<div id="app">${appHtml}</div><script>window.__LINKOUTPOST_INITIAL_STATE__=${serializeInitialState(initialState)}</script>`,
    )
    .replace(
      "</body>",
      isPublicProfileRoute ? `${profileRuntimeScript}</body>` : "</body>",
    );

  return new Response(renderedHtml, {
    headers: ssrHeaders,
    status: initialState.profile ? 200 : 404,
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/auth/google/start") {
      try {
        return await startOAuth(request, env, "google");
      } catch {
        return signInErrorRedirect(request, "oauth_unavailable", false);
      }
    }

    if (url.pathname === "/api/auth/twitter/start") {
      try {
        return await startOAuth(request, env, "twitter");
      } catch {
        return signInErrorRedirect(request, "oauth_unavailable", false);
      }
    }

    if (url.pathname === "/api/auth/shopify/start") {
      try {
        return await startOAuth(request, env, "shopify");
      } catch {
        return signInErrorRedirect(request, "oauth_unavailable", false);
      }
    }

    if (url.pathname === "/api/auth/google/callback") {
      try {
        return await completeOAuth(request, env, "google");
      } catch {
        return signInErrorRedirect(request, "oauth_failed");
      }
    }

    if (url.pathname === "/api/auth/twitter/callback") {
      try {
        return await completeOAuth(request, env, "twitter");
      } catch {
        return signInErrorRedirect(request, "oauth_failed");
      }
    }

    if (url.pathname === "/api/auth/shopify/callback") {
      try {
        return await completeOAuth(request, env, "shopify");
      } catch {
        return signInErrorRedirect(request, "oauth_failed");
      }
    }

    if (url.pathname === "/api/logout") {
      return new Response(null, {
        headers: {
          Location: "/",
          "Set-Cookie": clearCookie(request, "linkoutpost_session"),
        },
        status: 302,
      });
    }

    if (url.pathname === "/api/health") {
      return Response.json(
        {
          service: "linkoutpost",
          status: "ok",
          timestamp: new Date().toISOString(),
        },
        {
          headers: apiHeaders,
        },
      );
    }

    if (url.pathname === "/api/session") {
      return Response.json(await getSession(request, env), {
        headers: apiHeaders,
      });
    }

    if (url.pathname === "/api/oembed") {
      if (request.method !== "GET") return jsonError("Method not allowed", 405);
      return resolveGenericOEmbed(url.searchParams.get("url") ?? "");
    }

    if (url.pathname === "/api/link-metadata") {
      if (request.method !== "GET") return jsonError("Method not allowed", 405);
      return resolveLinkMetadataResponse(url.searchParams.get("url") ?? "");
    }

    if (url.pathname.startsWith("/api/files/")) {
      const key = decodeURIComponent(url.pathname.slice("/api/files/".length));
      return readUserFile(env, key);
    }

    if (url.pathname === "/api/profiles") {
      const session = await getSession(request, env);
      const sessionPayload = await getSessionPayload(request, env);

      if (!session.authenticated || !sessionPayload || !env.DB) {
        return Response.json(
          {
            authenticated: session.authenticated,
            error: env.DB
              ? "Unauthorized"
              : "Backend storage is not configured",
          },
          {
            headers: apiHeaders,
            status: session.authenticated ? 503 : 401,
          },
        );
      }

      if (request.method === "GET") {
        return Response.json(
          await listProfilesByOwner(env, sessionPayload.userId),
          {
            headers: apiHeaders,
          },
        );
      }

      return jsonError("Method not allowed", 405);
    }

    if (
      url.pathname === "/api/profile/image" ||
      url.pathname === "/api/profile/avatar"
    ) {
      const session = await getSession(request, env);
      const sessionPayload = await getSessionPayload(request, env);

      if (!session.authenticated || !sessionPayload || !env.DB) {
        return Response.json(
          {
            authenticated: session.authenticated,
            error: env.DB
              ? "Unauthorized"
              : "Backend storage is not configured",
          },
          {
            headers: apiHeaders,
            status: session.authenticated ? 503 : 401,
          },
        );
      }

      if (request.method === "POST") {
        try {
          return Response.json(
            {
              assetId: await writeProfileAssetUpload(
                request,
                env,
                sessionPayload.userId,
              ),
            },
            {
              headers: apiHeaders,
            },
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Avatar upload failed";
          return jsonError(message, 400);
        }
      }

      return jsonError("Method not allowed", 405);
    }

    if (url.pathname === "/api/profile") {
      const session = await getSession(request, env);
      const sessionPayload = await getSessionPayload(request, env);

      if (!session.authenticated || !sessionPayload || !env.DB) {
        return Response.json(
          {
            authenticated: session.authenticated,
            error: env.DB
              ? "Unauthorized"
              : "Backend storage is not configured",
          },
          {
            headers: apiHeaders,
            status: session.authenticated ? 503 : 401,
          },
        );
      }

      if (request.method === "GET") {
        const profile = await readProfileByOwner(
          env,
          sessionPayload.userId,
          url.searchParams.get("handle"),
        );
        if (!profile) {
          return Response.json(
            { error: "Not found" },
            {
              headers: apiHeaders,
              status: 404,
            },
          );
        }

        return Response.json(profile, {
          headers: apiHeaders,
        });
      }

      if (request.method === "PUT") {
        const profile = createProfile(
          (await request.json()) as Partial<LinkProfile>,
        );
        try {
          await writeProfile(env, sessionPayload.userId, profile);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Profile save failed";
          return jsonError(
            message,
            message === "Handle is already taken" ? 409 : 400,
          );
        }
        return Response.json(
          { ok: true },
          {
            headers: apiHeaders,
          },
        );
      }

      return jsonError("Method not allowed", 405);
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        {
          error: "Not found",
        },
        {
          headers: apiHeaders,
          status: 404,
        },
      );
    }

    return renderHandlePage(request, env);
  },
} satisfies ExportedHandler<Env>;
