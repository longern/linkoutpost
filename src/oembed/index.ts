import type { LinkItem } from "../profile";
import { flickrOEmbedProvider } from "./flickr";
import { genericOEmbedProvider } from "./generic";
import type {
  OEmbedProviderDefinition,
  OEmbedRenderData,
  ResolveOEmbedOptions,
  ResolvedOEmbed,
} from "./types";
import { youtubeOEmbedProvider } from "./youtube";

const knownOEmbedProviders: readonly OEmbedProviderDefinition[] = [
  flickrOEmbedProvider,
  youtubeOEmbedProvider,
];

const allOEmbedProviders: readonly OEmbedProviderDefinition[] = [
  ...knownOEmbedProviders,
  genericOEmbedProvider,
];

function getProvider(provider: LinkItem["embedProvider"]) {
  return allOEmbedProviders.find(
    (definition) => definition.provider === provider,
  );
}

export function supportsOEmbed(url: string): boolean {
  return allOEmbedProviders.some((provider) => provider.supportsUrl(url));
}

export async function resolveOEmbed(
  url: string,
  options: ResolveOEmbedOptions = {},
): Promise<ResolvedOEmbed | null> {
  const provider = knownOEmbedProviders.find((definition) =>
    definition.supportsUrl(url),
  );
  const knownResult = await (provider?.resolve(url) ?? null);
  if (knownResult || !options.allowDiscovery) return knownResult;

  if (options.useBackend) {
    try {
      const endpoint = new URL("/api/oembed", window.location.origin);
      endpoint.searchParams.set("url", url);

      const response = await fetch(endpoint);
      if (response.ok) return (await response.json()) as ResolvedOEmbed;
    } catch {
      // Fall back to browser-side discovery below.
    }
  }

  return genericOEmbedProvider.resolve(url);
}

export function getOEmbedRenderData(link: LinkItem): OEmbedRenderData | null {
  if (link.embedMode === "link") return null;

  const provider = getProvider(link.embedProvider);
  if (!provider) return null;

  const html = provider.sanitize(link.embedHtml ?? "");
  return html ? { html, scripts: provider.scripts } : null;
}
