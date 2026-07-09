import type { LinkItem } from "../profile";

export type OEmbedProvider = NonNullable<LinkItem["embedProvider"]>;

export type OEmbedPayload = {
  html?: unknown;
  title?: unknown;
  type?: unknown;
};

export type ResolvedOEmbed = {
  html: string;
  provider: OEmbedProvider;
  title: string;
};

export type OEmbedRenderData = {
  html: string;
  scripts: readonly string[];
};

export type OEmbedProviderDefinition = {
  provider: OEmbedProvider;
  scripts: readonly string[];
  resolve(url: string): Promise<ResolvedOEmbed | null>;
  sanitize(html: string): string | null;
  supportsUrl(url: string): boolean;
};

export type ResolveOEmbedOptions = {
  allowDiscovery?: boolean;
  useBackend?: boolean;
};
