import type { OEmbedPayload, OEmbedProviderDefinition } from "./types";
import {
  escapeAttribute,
  getAttribute,
  getDimensionAttribute,
  isHttpsUrlFromHost,
  isUrlFromHost,
} from "./utils";

const youtubePageHosts = ["youtube.com", "youtu.be"];
const youtubeEmbedHosts = ["youtube.com", "youtube-nocookie.com"];

function isYouTubeEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      isHttpsUrlFromHost(value, youtubeEmbedHosts) &&
      url.pathname.startsWith("/embed/")
    );
  } catch {
    return false;
  }
}

export const youtubeOEmbedProvider: OEmbedProviderDefinition = {
  provider: "youtube",
  scripts: [],
  supportsUrl(url) {
    return isUrlFromHost(url, youtubePageHosts);
  },
  sanitize(html) {
    const iframeMarkup =
      html.match(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/i)?.[0] ?? "";
    const src = getAttribute(iframeMarkup, "src");

    if (!isYouTubeEmbedUrl(src)) return null;

    const title = getAttribute(iframeMarkup, "title") || "YouTube video";
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
  },
  async resolve(url) {
    if (!this.supportsUrl(url) || typeof fetch === "undefined") return null;

    const endpoint = new URL("https://www.youtube.com/oembed");
    endpoint.searchParams.set("format", "json");
    endpoint.searchParams.set("url", url);

    const response = await fetch(endpoint);
    if (!response.ok) return null;

    const payload = (await response.json()) as OEmbedPayload;
    const html =
      typeof payload.html === "string" ? this.sanitize(payload.html) : null;
    const title = typeof payload.title === "string" ? payload.title : "";

    return payload.type === "video" && html
      ? { html, provider: this.provider, title }
      : null;
  },
};
