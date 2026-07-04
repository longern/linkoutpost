import { strToU8, zipSync } from "fflate";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { readLocalAsset } from "./localEditorStore";
import { getPublicProfileCssText } from "./PublicProfileCssText";
import { ProfilePage } from "./PublicProfile";
import { getStaticProfileRuntimeScript } from "./profileShare";
import { getProfileDocumentTitle, type LinkProfile } from "./profile";
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
): Promise<string> {
  const profileMarkup = await renderProfileMarkup(
    profile,
    avatarHref,
    backgroundHref,
  );

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta content="width=device-width, initial-scale=1.0" name="viewport">',
    `<title>${escapeHtml(getProfileDocumentTitle(profile))}</title>`,
    '<link href="./styles.css" rel="stylesheet">',
    "</head>",
    `<body>${profileMarkup}<script src="./profile.js" defer></script></body>`,
    "</html>"
  ].join("");
}

function imageExtension(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
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

export async function buildStaticZip(profile: LinkProfile): Promise<Blob> {
  const files: Record<string, Uint8Array> = {
    "profile.json": strToU8(JSON.stringify(profile, null, 2)),
    "profile.js": strToU8(getStaticProfileRuntimeScript()),
    "styles.css": strToU8(collectStaticCss())
  };
  let avatarHref: string | null = null;
  let backgroundHref: string | null = null;

  if (profile.avatarAssetId) {
    const asset = await readLocalAsset(profile.avatarAssetId);
    if (asset) {
      const extension = imageExtension(asset.type);
      const filename = `assets/avatar.${extension}`;
      files[filename] = new Uint8Array(await asset.blob.arrayBuffer());
      avatarHref = `./${filename}`;
    }
  }

  if (profile.theme.backgroundAssetId) {
    const asset = await readLocalAsset(profile.theme.backgroundAssetId);
    if (asset) {
      const extension = imageExtension(asset.type);
      const filename = `assets/background.${extension}`;
      files[filename] = new Uint8Array(await asset.blob.arrayBuffer());
      backgroundHref = `./${filename}`;
    }
  }

  files["index.html"] = strToU8(
    await renderStaticHtml(profile, avatarHref, backgroundHref),
  );

  const bytes = zipSync({
    ...files
  });

  return new Blob([bytes], { type: "application/zip" });
}
