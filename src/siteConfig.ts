const env = import.meta.env ?? {};

export const siteTitle = env.VITE_SITE_TITLE || "LinkOutpost";

function readPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const hostedHandleMinLength = readPositiveInteger(
  env.VITE_HOSTED_HANDLE_MIN_LENGTH,
  5,
);
