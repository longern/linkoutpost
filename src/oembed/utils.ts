export function isHostname(value: string, hostname: string): boolean {
  return value === hostname || value.endsWith(`.${hostname}`);
}

export function isUrlFromHost(
  value: string,
  hostnames: readonly string[],
): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return hostnames.some((host) => isHostname(hostname, host));
  } catch {
    return false;
  }
}

export function isHttpsUrlFromHost(
  value: string,
  hostnames: readonly string[],
): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      hostnames.some((host) => isHostname(hostname, host))
    );
  } catch {
    return false;
  }
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getAttribute(markup: string, name: string): string {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");
  const match = markup.match(pattern);
  return match?.[1] ?? match?.[2] ?? "";
}

export function getDimensionAttribute(markup: string, name: string): string {
  const value = getAttribute(markup, name);
  return /^\d{1,5}$/.test(value) ? value : "";
}

export function resolveJsonp<TPayload>(
  endpoint: URL,
  callbackParam: string,
  callbackPrefix: string,
): Promise<TPayload | null> {
  if (typeof document === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const callbackName = `${callbackPrefix}${Date.now()}${Math.random()
      .toString(36)
      .slice(2)}`;
    const callbacks = window as unknown as Record<string, unknown>;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => cleanup(null), 8000);

    function cleanup(payload: TPayload | null): void {
      window.clearTimeout(timeout);
      script.remove();
      delete callbacks[callbackName];
      resolve(payload);
    }

    callbacks[callbackName] = (payload: TPayload) => cleanup(payload);
    endpoint.searchParams.set(callbackParam, callbackName);

    script.async = true;
    script.onerror = () => cleanup(null);
    script.src = endpoint.toString();
    document.head.appendChild(script);
  });
}
