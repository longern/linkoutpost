import type { LinkItem } from "../../../profile";

export function getLinkDisplayTitle(link: LinkItem): string {
  return link.label.trim() || "Untitled link";
}

export function getLinkDisplayUrl(link: LinkItem): string {
  return link.url.trim() || "No URL";
}

export function isVideoMediaUrl(url: string): boolean {
  return (
    /^data:video\//i.test(url) ||
    /\.(mp4|webm|ogv|ogg|mov)(?:[?#].*)?$/i.test(url)
  );
}
