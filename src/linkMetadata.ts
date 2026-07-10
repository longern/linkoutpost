import { supportsOEmbed } from "./oembed";
import { getAttribute, normalizeHttpUrl } from "./oembed/utils";

export type ResolvedLinkMetadata = {
  embedAvailable: boolean;
  faviconUrl: string | null;
  title: string;
};

function decodeHtmlText(value: string): string {
  const decodeCodePoint = (code: number): string =>
    Number.isInteger(code) && code >= 0 && code <= 0x10ffff
      ? String.fromCodePoint(code)
      : "";

  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      decodeCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      decodeCodePoint(Number.parseInt(code, 16)),
    )
    .trim();
}

export function findDocumentTitle(html: string): string {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return decodeHtmlText(title).slice(0, 240);
}

export function getDefaultFaviconUrl(pageUrl: string): string | null {
  try {
    return new URL("/favicon.ico", pageUrl).toString();
  } catch {
    return null;
  }
}

export function findFaviconUrl(html: string, pageUrl: string): string | null {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const iconTag = linkTags.find((tag) => {
    const rel = getAttribute(tag, "rel").toLowerCase().split(/\s+/);
    return rel.includes("icon") && getAttribute(tag, "href");
  });
  const href = iconTag ? getAttribute(iconTag, "href") : "";

  if (href) {
    try {
      return normalizeHttpUrl(new URL(href, pageUrl).toString());
    } catch {
      // Fall through to the conventional favicon path.
    }
  }

  return getDefaultFaviconUrl(pageUrl);
}

export async function resolveLinkMetadata(
  url: string,
): Promise<ResolvedLinkMetadata | null> {
  const fallbackFaviconUrl = getDefaultFaviconUrl(url);
  try {
    const endpoint = new URL("/api/link-metadata", window.location.origin);
    endpoint.searchParams.set("url", url);
    const response = await fetch(endpoint);
    if (response.ok) {
      const metadata = (await response.json()) as ResolvedLinkMetadata;
      return {
        ...metadata,
        embedAvailable: metadata.embedAvailable || supportsOEmbed(url),
      };
    }
  } catch {
    // Static/offline deployments can still use the local provider fallback.
  }

  return {
    embedAvailable: supportsOEmbed(url),
    faviconUrl: fallbackFaviconUrl,
    title: "",
  };
}
