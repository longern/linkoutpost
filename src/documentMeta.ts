import {
  getProfileDocumentDescription,
  getProfileDocumentTitle,
  type LinkProfile,
} from "./profile";
import { siteTitle as defaultSiteTitle } from "./siteConfig";

export const documentMetaStartMarker = "<!--linkoutpost-document-meta-start-->";
export const documentMetaEndMarker = "<!--linkoutpost-document-meta-end-->";
export const documentFaviconId = "site-favicon";

type DocumentMetaOptions = {
  image?: {
    alt: string;
    url: string;
  } | null;
  profile?: LinkProfile | null;
  siteTitle?: string;
  type?: "profile" | "website";
  url?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderDocumentMeta({
  image = null,
  profile = null,
  siteTitle = defaultSiteTitle,
  type = "website",
  url = null,
}: DocumentMetaOptions = {}): string {
  const title = escapeHtml(getProfileDocumentTitle(profile, siteTitle));
  const description = escapeHtml(
    getProfileDocumentDescription(profile, siteTitle),
  );
  const siteName = escapeHtml(siteTitle);
  const tags = [
    documentMetaStartMarker,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:type" content="${type}" />`,
    url ? `<meta property="og:url" content="${escapeHtml(url)}" />` : null,
    image
      ? `<meta property="og:image" content="${escapeHtml(image.url)}" />`
      : null,
    image
      ? `<meta property="og:image:alt" content="${escapeHtml(image.alt)}" />`
      : null,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    image
      ? `<meta name="twitter:image" content="${escapeHtml(image.url)}" />`
      : null,
    image
      ? `<meta name="twitter:image:alt" content="${escapeHtml(image.alt)}" />`
      : null,
    `<title>${title}</title>`,
    documentMetaEndMarker,
  ];

  return tags.filter(Boolean).join("\n    ");
}

export function replaceDocumentMeta(html: string, meta: string): string {
  const pattern =
    /<!--linkoutpost-document-meta-start-->[\s\S]*?<!--linkoutpost-document-meta-end-->/;

  return pattern.test(html)
    ? html.replace(pattern, meta)
    : html.replace("</head>", `${meta}</head>`);
}

export function replaceDocumentFavicon(
  html: string,
  faviconUrl: string | null,
): string {
  if (!faviconUrl) return html;

  const faviconPattern = new RegExp(
    `<link\\b[^>]*\\bid=["']${documentFaviconId}["'][^>]*>`,
    "i",
  );

  return html.replace(faviconPattern, (faviconTag) =>
    faviconTag.replace(
      /\bhref=(["'])[^"']*\1/i,
      `href="${escapeHtml(faviconUrl)}"`,
    ),
  );
}
