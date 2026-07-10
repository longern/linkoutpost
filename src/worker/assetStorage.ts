import {
  acceptsProfileAssetType,
  getProfileAssetFolder,
  getProfileAssetMaxBytes,
  isProfileAssetKind,
  isProfileMediaKind,
  mediaExtension,
} from "../media/config";
import type { Env } from "./env";

export async function writeProfileAssetUpload(
  request: Request,
  env: Env,
  userId: string,
): Promise<string> {
  if (!env.BUCKET) throw new Error("File storage is not configured");

  const formData = await request.formData();
  const image = formData.get("image");
  const kind = formData.get("kind");

  if (!(image instanceof File)) throw new Error("Image file is required");
  if (!isProfileAssetKind(kind)) {
    throw new Error("Invalid profile asset kind");
  }

  const isProfileMedia = isProfileMediaKind(kind);
  if (!acceptsProfileAssetType(kind, image.type)) {
    throw new Error(
      isProfileMedia
        ? "File must be an image or video"
        : "File must be an image",
    );
  }

  if (image.size > getProfileAssetMaxBytes(kind)) {
    throw new Error(
      isProfileMedia
        ? "Media must be 10 MB or smaller"
        : "Image must be 2 MB or smaller",
    );
  }

  const key = `${getProfileAssetFolder(kind)}/${userId}/${crypto.randomUUID()}.${mediaExtension(image.type)}`;
  await env.BUCKET.put(key, image.stream(), {
    httpMetadata: { contentType: image.type },
  });
  return key;
}

export async function readUserFile(env: Env, key: string): Promise<Response> {
  if (
    !env.BUCKET ||
    (!key.startsWith("avatars/") &&
      !key.startsWith("backgrounds/") &&
      !key.startsWith("links/") &&
      !key.startsWith("profiles/"))
  ) {
    return new Response("Not found", { status: 404 });
  }

  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}
