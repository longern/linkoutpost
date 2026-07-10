import type {
  OEmbedPayload,
  OEmbedProviderDefinition,
  ResolvedOEmbed,
} from "./types";
import {
  escapeAttribute,
  getAttribute,
  getDimensionAttribute,
  isHttpsUrl,
} from "./utils";

function isSupportedLinkUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getRelAttribute(markup: string): string {
  return getAttribute(markup, "rel").toLowerCase();
}

function getTypeAttribute(markup: string): string {
  return getAttribute(markup, "type").toLowerCase();
}

export function findOEmbedJsonEndpoint(html: string, pageUrl: string): string | null {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const tag = linkTags.find((candidate) => {
    const rel = getRelAttribute(candidate).split(/\s+/);
    return (
      rel.includes("alternate") &&
      getTypeAttribute(candidate) === "application/json+oembed" &&
      getAttribute(candidate, "href")
    );
  });
  const href = tag
    ? getAttribute(tag, "href").replace(/&amp;/gi, "&")
    : "";
  if (!href) return null;

  try {
    const endpoint = new URL(href, pageUrl);
    return isSupportedLinkUrl(endpoint.toString()) ? endpoint.toString() : null;
  } catch {
    return null;
  }
}

export function sanitizeGenericOEmbedHtml(html: string): string | null {
  const iframeMarkup =
    html.match(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/i)?.[0] ?? "";
  const src = getAttribute(iframeMarkup, "src");

  if (!isHttpsUrl(src)) return null;

  const title = getAttribute(iframeMarkup, "title") || "Embedded content";
  const width = getDimensionAttribute(iframeMarkup, "width");
  const height = getDimensionAttribute(iframeMarkup, "height");
  const aspectRatio = width && height ? `${width} / ${height}` : "";
  const allow = getAttribute(iframeMarkup, "allow");
  const referrerPolicy =
    getAttribute(iframeMarkup, "referrerpolicy") ||
    "strict-origin-when-cross-origin";
  const allowFullscreen = /\sallowfullscreen(?:\s|=|>)/i.test(iframeMarkup);

  return [
    "<iframe",
    width ? ` width="${width}"` : "",
    height ? ` height="${height}"` : "",
    ` src="${escapeAttribute(src)}"`,
    ` title="${escapeAttribute(title)}"`,
    allow ? ` allow="${escapeAttribute(allow)}"` : "",
    ` referrerpolicy="${escapeAttribute(referrerPolicy)}"`,
    allowFullscreen ? " allowfullscreen" : "",
    ` loading="lazy"`,
    aspectRatio ? ` style="aspect-ratio: ${aspectRatio};"` : "",
    "></iframe>",
  ].join("");
}

async function fetchOEmbed(endpoint: string): Promise<OEmbedPayload | null> {
  const response = await fetch(endpoint);
  if (!response.ok) return null;
  return (await response.json()) as OEmbedPayload;
}

export async function resolveGenericOEmbed(
  url: string,
): Promise<ResolvedOEmbed | null> {
  if (!isSupportedLinkUrl(url) || typeof fetch === "undefined") return null;

  const pageResponse = await fetch(url);
  if (!pageResponse.ok) return null;

  const endpoint = findOEmbedJsonEndpoint(await pageResponse.text(), url);
  if (!endpoint) return null;

  const payload = await fetchOEmbed(endpoint);
  const html =
    typeof payload?.html === "string"
      ? sanitizeGenericOEmbedHtml(payload.html)
      : null;
  const title = typeof payload?.title === "string" ? payload.title : "";

  return html ? { html, provider: "generic", title } : null;
}

export const genericOEmbedProvider: OEmbedProviderDefinition = {
  provider: "generic",
  scripts: [],
  supportsUrl: isSupportedLinkUrl,
  sanitize: sanitizeGenericOEmbedHtml,
  resolve: resolveGenericOEmbed,
};
