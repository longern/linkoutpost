import {
  getProfileDocumentDescription,
  getProfileDocumentTitle,
  type LinkProfile,
} from "./profile";
import { siteTitle } from "./siteConfig";

export const documentMetaStartMarker = "<!--linkoutpost-document-meta-start-->";
export const documentMetaEndMarker = "<!--linkoutpost-document-meta-end-->";

type DocumentMetaOptions = {
  profile?: LinkProfile | null;
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
  profile = null,
  type = "website",
  url = null,
}: DocumentMetaOptions = {}): string {
  const title = escapeHtml(getProfileDocumentTitle(profile));
  const description = escapeHtml(getProfileDocumentDescription(profile));
  const siteName = escapeHtml(siteTitle);
  const tags = [
    documentMetaStartMarker,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:type" content="${type}" />`,
    url ? `<meta property="og:url" content="${escapeHtml(url)}" />` : null,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:title" content="${title}" />`,
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
