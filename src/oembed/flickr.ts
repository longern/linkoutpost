import type { OEmbedPayload, OEmbedProviderDefinition } from "./types";
import {
  escapeAttribute,
  getAttribute,
  getDimensionAttribute,
  isHttpsUrlFromHost,
  isUrlFromHost,
  resolveJsonp,
} from "./utils";

const flickrPageHosts = ["flic.kr", "flickr.com"];

export const flickrOEmbedProvider: OEmbedProviderDefinition = {
  provider: "flickr",
  scripts: ["https://embedr.flickr.com/assets/client-code.js"],
  supportsUrl(url) {
    return isUrlFromHost(url, flickrPageHosts);
  },
  sanitize(html) {
    const anchorMatch = html.match(
      /<a\b[^>]*\sdata-flickr-embed\s*=\s*(?:"true"|'true')[^>]*>[\s\S]*?<\/a>/i,
    );
    const anchorMarkup = anchorMatch?.[0] ?? "";
    const imageMarkup = anchorMarkup.match(/<img\b[^>]*>/i)?.[0] ?? "";
    const href = getAttribute(anchorMarkup, "href");
    const imageUrl = getAttribute(imageMarkup, "src");

    if (
      !isUrlFromHost(href, flickrPageHosts) ||
      !isHttpsUrlFromHost(imageUrl, ["staticflickr.com"])
    ) {
      return null;
    }

    const title = getAttribute(anchorMarkup, "title");
    const alt = getAttribute(imageMarkup, "alt");
    const width = getDimensionAttribute(imageMarkup, "width");
    const height = getDimensionAttribute(imageMarkup, "height");

    return [
      `<a data-flickr-embed="true" href="${escapeAttribute(href)}"`,
      title ? ` title="${escapeAttribute(title)}"` : "",
      ">",
      `<img src="${escapeAttribute(imageUrl)}"`,
      width ? ` width="${width}"` : "",
      height ? ` height="${height}"` : "",
      ` alt="${escapeAttribute(alt)}">`,
      "</a>",
    ].join("");
  },
  async resolve(url) {
    if (!this.supportsUrl(url)) return null;

    const endpoint = new URL("https://www.flickr.com/services/oembed/");
    endpoint.searchParams.set("format", "json");
    endpoint.searchParams.set("url", url);

    const payload = await resolveJsonp<OEmbedPayload>(
      endpoint,
      "jsoncallback",
      "__linkoutpostOEmbed",
    );
    const html =
      typeof payload?.html === "string" ? this.sanitize(payload.html) : null;
    const title = typeof payload?.title === "string" ? payload.title : "";

    return payload?.type === "photo" && html
      ? { html, provider: this.provider, title }
      : null;
  },
};
