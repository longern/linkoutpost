import { strToU8, zipSync } from "fflate";
import type { LinkProfile } from "./profile";
import { ProfilePage } from "./PublicProfile";
import { readLocalAsset } from "./localEditorStore";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function renderStaticHtml(profile: LinkProfile, avatarHref: string | null): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server.browser");
  const appHtml = renderToStaticMarkup(
    <ProfilePage avatarUrl={avatarHref} profile={profile} />
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(profile.title)}</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    ${appHtml}
  </body>
</html>`;
}

const staticCss = `:root {
  color: #1c2433;
  background: #f4f6ef;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
body { min-width: 320px; min-height: 100vh; margin: 0; }
.public-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 16px;
}
.public-profile {
  width: min(100%, 520px);
  border: 1px solid #d9dfd2;
  border-radius: 8px;
  background: #fff;
  padding: 32px;
  box-shadow: 0 24px 70px rgb(35 43 31 / 10%);
}
.profile-avatar {
  width: 96px;
  height: 96px;
  display: block;
  border-radius: 999px;
  object-fit: cover;
  margin: 0 auto 18px;
}
.eyebrow,
.handle {
  margin: 0 0 10px;
  color: #286552;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  font-size: 2.5rem;
  line-height: 1.05;
  letter-spacing: 0;
}
.bio,
.public-profile > p:not(.eyebrow, .handle) {
  margin: 16px 0 28px;
  color: #526070;
  line-height: 1.6;
}
.public-links {
  display: grid;
  gap: 10px;
}
.public-links a {
  display: block;
  border: 1px solid #cfd8c8;
  border-radius: 8px;
  color: #1d352f;
  padding: 14px 16px;
  text-align: center;
  text-decoration: none;
}
.public-links a:hover {
  border-color: #286552;
}`;

export async function buildStaticZip(profile: LinkProfile): Promise<Blob> {
  const files: Record<string, Uint8Array> = {
    "profile.json": strToU8(JSON.stringify(profile, null, 2)),
    "styles.css": strToU8(staticCss)
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
