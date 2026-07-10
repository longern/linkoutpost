import {
  createProfile,
  hostedHandleMinLength,
  isHostedHandleTooShort,
  isReservedPath,
  normalizeHandle,
  type LinkProfile,
} from "../profile";
import type { ProfileSummary } from "../types";
import type { Env } from "./env";

export async function readProfileByHandle(
  env: Env,
  handle: string,
): Promise<LinkProfile | null> {
  if (!env.DB || isReservedPath(handle)) return null;

  const row = await env.DB.prepare(
    "SELECT handle, title, bio, avatar_asset_id, links_json, social_links_json, theme_json, updated_at FROM linkoutpost_profiles WHERE handle = ?",
  )
    .bind(handle)
    .first<{
      avatar_asset_id: string | null;
      handle: string;
      title: string;
      bio: string;
      links_json: string;
      social_links_json: string;
      theme_json: string;
      updated_at: string;
    }>();

  if (!row) return null;

  return createProfile({
    avatarAssetId: row.avatar_asset_id,
    bio: row.bio,
    handle: row.handle,
    links: JSON.parse(row.links_json) as LinkProfile["links"],
    socialLinks: JSON.parse(row.social_links_json) as LinkProfile["socialLinks"],
    theme: JSON.parse(row.theme_json) as LinkProfile["theme"],
    title: row.title,
    updatedAt: row.updated_at,
  });
}

export async function listProfilesByOwner(
  env: Env,
  userId: string,
): Promise<ProfileSummary[]> {
  if (!env.DB) return [];

  const result = await env.DB.prepare(
    `SELECT handle, title, updated_at
     FROM linkoutpost_profiles
     WHERE owner_user_id = ?
     ORDER BY updated_at DESC`,
  )
    .bind(userId)
    .all<{ handle: string; title: string; updated_at: string }>();

  return result.results.map((row) => ({
    handle: row.handle,
    title: row.title,
    updatedAt: row.updated_at,
  }));
}

export async function readProfileByOwner(
  env: Env,
  userId: string,
  handle?: string | null,
): Promise<LinkProfile | null> {
  if (!env.DB) return null;

  const normalizedHandle = handle ? normalizeHandle(handle) : "";
  if (normalizedHandle) {
    const profile = await readProfileByHandle(env, normalizedHandle);
    if (!profile) return null;

    const owner = await env.DB.prepare(
      "SELECT owner_user_id FROM linkoutpost_profiles WHERE handle = ?",
    )
      .bind(normalizedHandle)
      .first<{ owner_user_id: string | null }>();

    return owner?.owner_user_id === userId ? profile : null;
  }

  const first = await env.DB.prepare(
    `SELECT handle
     FROM linkoutpost_profiles
     WHERE owner_user_id = ?
     ORDER BY updated_at DESC
     LIMIT 1`,
  )
    .bind(userId)
    .first<{ handle: string }>();

  return first ? readProfileByHandle(env, first.handle) : null;
}

export async function writeProfile(
  env: Env,
  userId: string,
  profile: LinkProfile,
): Promise<void> {
  if (!env.DB) throw new Error("D1 binding is not configured");

  const handle = normalizeHandle(profile.handle);
  if (!handle || isReservedPath(handle)) throw new Error("Invalid handle");
  if (isHostedHandleTooShort(handle)) {
    throw new Error(
      `Handle must be at least ${hostedHandleMinLength} characters`,
    );
  }

  const existing = await env.DB.prepare(
    "SELECT owner_user_id FROM linkoutpost_profiles WHERE handle = ?",
  )
    .bind(handle)
    .first<{ owner_user_id: string | null }>();

  if (existing && existing.owner_user_id !== userId) {
    throw new Error("Handle is already taken");
  }

  await env.DB.prepare(
    `INSERT INTO linkoutpost_profiles (handle, owner_user_id, title, bio, avatar_asset_id, links_json, social_links_json, theme_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(handle) DO UPDATE SET
       title = excluded.title,
       bio = excluded.bio,
       avatar_asset_id = excluded.avatar_asset_id,
       links_json = excluded.links_json,
       social_links_json = excluded.social_links_json,
       theme_json = excluded.theme_json,
       updated_at = excluded.updated_at`,
  )
    .bind(
      handle,
      userId,
      profile.title,
      profile.bio,
      profile.avatarAssetId,
      JSON.stringify(profile.links),
      JSON.stringify(profile.socialLinks),
      JSON.stringify(profile.theme),
      new Date().toISOString(),
    )
    .run();
}
