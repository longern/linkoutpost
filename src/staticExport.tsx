import { strToU8, zipSync } from "fflate";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { renderDocumentMeta } from "./documentMeta";
import { readLocalAsset } from "./localEditorStore";
import { getPublicProfileCssText } from "./PublicProfileCssText";
import { ProfilePage } from "./PublicProfile";
import { getProfileAssetUrl, type LinkProfile } from "./profile";
import authAndOverlaysCss from "./styles/auth-and-overlays.css?inline";
import editorPanelsCss from "./styles/editor-panels.css?inline";
import editorPreviewCss from "./styles/editor-preview.css?inline";
import editorShellCss from "./styles/editor-shell.css?inline";
import foundationsCss from "./styles/foundations.css?inline";
import marketingCss from "./styles/marketing.css?inline";
import responsiveCss from "./styles/responsive.css?inline";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function renderProfileMarkup(
  profile: LinkProfile,
  avatarHref: string | null,
  backgroundHref: string | null,
  bannerImageHref: string | null,
  linkImageHrefs: Record<string, string | null>,
): Promise<string> {
  const container = document.createElement("div");
  let root: Root | null = null;

  try {
    document.body.appendChild(container);
    root = createRoot(container);
    const mountedRoot = root;
    flushSync(() => {
      mountedRoot.render(
        <ProfilePage
          avatarUrl={avatarHref}
          backgroundUrl={backgroundHref}
          bannerImageUrl={bannerImageHref}
          linkImageUrls={linkImageHrefs}
          profile={profile}
        />,
      );
    });
    return container.innerHTML;
  } finally {
    root?.unmount();
    container.remove();
  }
}

export async function renderStaticHtml(
  profile: LinkProfile,
  avatarHref: string | null,
  backgroundHref: string | null,
  bannerImageHref: string | null,
  linkImageHrefs: Record<string, string | null> = {},
): Promise<string> {
  const profileMarkup = await renderProfileMarkup(
    profile,
    avatarHref,
    backgroundHref,
    bannerImageHref,
    linkImageHrefs,
  );
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta content="width=device-width, initial-scale=1.0" name="viewport">',
    renderDocumentMeta({ profile, type: "profile" }),
    '<link href="./styles.css" rel="stylesheet">',
    "</head>",
    `<body>${profileMarkup}<script src="./profile.js" type="module"></script></body>`,
    "</html>",
  ].join("");
}

type StaticExportAssetSource = "backend" | "local";

type StaticExportAsset = {
  blob: Blob;
  type: string;
};

type StaticExportAssetResult = {
  href: string | null;
  path: string | null;
};

function mediaExtension(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "video/mp4") return "mp4";
  if (type === "video/webm") return "webm";
  if (type === "video/ogg") return "ogv";
  if (type === "video/quicktime") return "mov";
  return "jpg";
}

async function readStaticExportAsset(
  assetId: string | null,
  source: StaticExportAssetSource,
): Promise<StaticExportAsset | null> {
  if (!assetId) return null;

  if (source === "local") {
    const asset = await readLocalAsset(assetId);
    if (!asset) return null;
    return { blob: asset.blob, type: asset.type };
  }

  const assetUrl = getProfileAssetUrl(assetId);
  if (!assetUrl) return null;

  const response = await fetch(assetUrl);
  if (!response.ok) return null;

  const blob = await response.blob();
  return {
    blob,
    type:
      blob.type ||
      response.headers.get("content-type") ||
      "application/octet-stream",
  };
}

async function addStaticExportAsset(
  files: Record<string, Uint8Array>,
  assetId: string | null,
  name: string,
  source: StaticExportAssetSource,
): Promise<StaticExportAssetResult> {
  const asset = await readStaticExportAsset(assetId, source);
  if (!asset) return { href: null, path: null };

  const filename = `assets/${name}.${mediaExtension(asset.type)}`;
  files[filename] = new Uint8Array(await asset.blob.arrayBuffer());

  return {
    href: `./${filename}`,
    path: filename,
  };
}

function collectStaticCss(): string {
  return [
    getPublicProfileCssText(),
    foundationsCss,
    marketingCss,
    authAndOverlaysCss,
    editorShellCss,
    editorPanelsCss,
    editorPreviewCss,
    responsiveCss,
  ].join("\n");
}

async function readProfileRuntimeScript(): Promise<string> {
  const response = await fetch("/assets/profile-runtime.js");
  if (!response.ok) {
    throw new Error("Profile runtime asset is missing");
  }

  return response.text();
}

export async function buildStaticZip(
  profile: LinkProfile,
  assetSource: StaticExportAssetSource,
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {
    "profile.js": strToU8(await readProfileRuntimeScript()),
    "styles.css": strToU8(collectStaticCss()),
  };
  const avatar = await addStaticExportAsset(
    files,
    profile.avatarAssetId,
    "avatar",
    assetSource,
  );
  const background = await addStaticExportAsset(
    files,
    profile.theme.backgroundAssetId,
    "background",
    assetSource,
  );
  const bannerImage = await addStaticExportAsset(
    files,
    profile.theme.bannerImageAssetId,
    "banner",
    assetSource,
  );
  const linkImages = Object.fromEntries(
    await Promise.all(
      profile.links
        .filter((link) => link.type === "image" && link.imageAssetId)
        .map(async (link) => {
          const asset = await addStaticExportAsset(
            files,
            link.imageAssetId ?? null,
            `link-${link.id}`,
            assetSource,
          );
          return [link.id, asset] as const;
        }),
    ),
  );
  const linkImageHrefs = Object.fromEntries(
    Object.entries(linkImages).map(([id, asset]) => [id, asset.href]),
  );

  files["linkoutpost-export.json"] = strToU8(
    JSON.stringify(
      {
        app: "linkoutpost",
        version: 1,
        profile,
        assets: {
          avatar: avatar.path,
          background: background.path,
          bannerImage: bannerImage.path,
          linkImages: Object.fromEntries(
            Object.entries(linkImages).map(([id, asset]) => [id, asset.path]),
          ),
        },
      },
      null,
      2,
    ),
  );

  files["index.html"] = strToU8(
    await renderStaticHtml(
      profile,
      avatar.href,
      background.href,
      bannerImage.href,
      linkImageHrefs,
    ),
  );

  const bytes = zipSync({
    ...files,
  });

  return new Blob([bytes], { type: "application/zip" });
}
