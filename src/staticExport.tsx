import { strToU8, zipSync } from "fflate";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { readLocalAsset } from "./localEditorStore";
import { ProfilePage } from "./PublicProfile";
import { getStaticProfileRuntimeScript } from "./profileShare";
import type { LinkProfile } from "./profile";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function renderProfileMarkup(profile: LinkProfile, avatarHref: string | null): Promise<string> {
  const container = document.createElement("div");
  let root: Root | null = null;

  try {
    document.body.appendChild(container);
    root = createRoot(container);
    const mountedRoot = root;
    flushSync(() => {
      mountedRoot.render(<ProfilePage avatarUrl={avatarHref} profile={profile} />);
    });
    return container.innerHTML;
  } finally {
    root?.unmount();
    container.remove();
  }
}

export async function renderStaticHtml(profile: LinkProfile, avatarHref: string | null): Promise<string> {
  const profileMarkup = await renderProfileMarkup(profile, avatarHref);

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta content="width=device-width, initial-scale=1.0" name="viewport">',
    `<title>${escapeHtml(profile.title)}</title>`,
    '<link href="./styles.css" rel="stylesheet">',
    "</head>",
    `<body>${profileMarkup}<script src="./profile.js" defer></script></body>`,
    "</html>"
  ].join("");
}

function collectLoadedCss(): string {
  const rules: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      rules.push(...Array.from(sheet.cssRules).map((rule) => rule.cssText));
    } catch {
      // Cross-origin stylesheets cannot be read; app styles are same-origin.
    }
  }

  return rules.join("\n");
}

export async function buildStaticZip(profile: LinkProfile): Promise<Blob> {
  const files: Record<string, Uint8Array> = {
    "profile.json": strToU8(JSON.stringify(profile, null, 2)),
    "profile.js": strToU8(getStaticProfileRuntimeScript()),
    "styles.css": strToU8(collectLoadedCss())
  };
  let avatarHref: string | null = null;

  if (profile.avatarAssetId) {
    const asset = await readLocalAsset(profile.avatarAssetId);
    if (asset) {
      const extension = asset.type === "image/png" ? "png" : "jpg";
      const filename = `assets/avatar.${extension}`;
      files[filename] = new Uint8Array(await asset.blob.arrayBuffer());
      avatarHref = `./${filename}`;
    }
  }

  files["index.html"] = strToU8(await renderStaticHtml(profile, avatarHref));

  const bytes = zipSync({
    ...files
  });

  return new Blob([bytes], { type: "application/zip" });
}
