export type ProfileShareData = {
  text: string;
  title: string;
  url?: string;
};

export type ProfileShareCapabilities = {
  canCopy: boolean;
  canShare: boolean;
};

type ShareNavigator = Navigator & {
  clipboard?: {
    writeText(value: string): Promise<void>;
  };
  share?: (data: { text?: string; title?: string; url?: string }) => Promise<void>;
};

type QueryRoot = {
  querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>;
};

export function getProfileShareCapabilities(): ProfileShareCapabilities {
  const browserNavigator = typeof navigator === "undefined"
    ? null
    : navigator as ShareNavigator;
  const protocol = typeof window === "undefined" ? "" : window.location.protocol;
  const canUseSecureApi = typeof window === "undefined"
    ? false
    : window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  return {
    canCopy: Boolean(browserNavigator?.clipboard?.writeText && canUseSecureApi),
    canShare: Boolean(browserNavigator?.share && canUseSecureApi && protocol !== "file:")
  };
}

export async function shareProfile(data: ProfileShareData): Promise<void> {
  const browserNavigator = typeof navigator === "undefined"
    ? null
    : navigator as ShareNavigator;
  const shareUrl = data.url ?? (typeof window === "undefined" ? "" : window.location.href);
  const capabilities = getProfileShareCapabilities();

  if (capabilities.canShare && browserNavigator?.share) {
    await browserNavigator.share({
      text: data.text,
      title: data.title,
      url: shareUrl
    });
    return;
  }

  if (capabilities.canCopy && browserNavigator?.clipboard && shareUrl) {
    await browserNavigator.clipboard.writeText(shareUrl);
  }
}

export async function copyProfileUrl(url: string): Promise<void> {
  const browserNavigator = typeof navigator === "undefined"
    ? null
    : navigator as ShareNavigator;

  if (getProfileShareCapabilities().canCopy && browserNavigator?.clipboard && url) {
    await browserNavigator.clipboard.writeText(url);
  }
}

function getButtonShareData(button: HTMLElement): ProfileShareData {
  return {
    text: button.dataset.shareText ?? "",
    title: button.dataset.shareTitle ?? document.title,
    url: button.dataset.shareUrl || window.location.href
  };
}

function setShareDialogUrl(root: QueryRoot, url: string): void {
  root.querySelectorAll<HTMLElement>("[data-profile-share-url-text]").forEach((node) => {
    node.textContent = url;
  });
}

function openShareDialog(button: HTMLElement): void {
  const profile = button.closest<HTMLElement>(".public-profile");
  const overlay = profile?.querySelector<HTMLElement>("[data-profile-share-overlay]");
  if (!overlay) return;

  const data = getButtonShareData(button);
  setShareDialogUrl(overlay, data.url ?? window.location.href);
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
}

function closeShareDialog(overlay: HTMLElement): void {
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

export function attachProfileShareButtons(root: QueryRoot = document): void {
  const capabilities = getProfileShareCapabilities();
  const buttons = root.querySelectorAll<HTMLElement>("[data-profile-share-button]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      openShareDialog(button);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-profile-share-overlay]").forEach((overlay) => {
    setShareDialogUrl(overlay, window.location.href);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeShareDialog(overlay);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-profile-share-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const overlay = button.closest<HTMLElement>("[data-profile-share-overlay]");
      if (overlay) closeShareDialog(overlay);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-profile-share-copy]").forEach((button) => {
    if (button instanceof HTMLButtonElement) {
      button.disabled = !capabilities.canCopy;
    }
    button.addEventListener("click", () => {
      if (!getProfileShareCapabilities().canCopy) return;
      const overlay = button.closest<HTMLElement>("[data-profile-share-overlay]");
      const url = overlay?.querySelector<HTMLElement>("[data-profile-share-url-text]")?.textContent ?? window.location.href;
      void copyProfileUrl(url);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-profile-share-system]").forEach((button) => {
    if (button instanceof HTMLButtonElement) {
      button.disabled = !capabilities.canShare;
    }
    button.addEventListener("click", () => {
      if (!getProfileShareCapabilities().canShare) return;
      const profile = button.closest<HTMLElement>(".public-profile");
      const shareButton = profile?.querySelector<HTMLElement>("[data-profile-share-button]");
      if (!shareButton) return;

      void shareProfile(getButtonShareData(shareButton));
    });
  });
}

export function profileShareAttributes(data: ProfileShareData): Record<string, string> {
  return {
    "data-profile-share-button": "",
    "data-share-text": data.text,
    "data-share-title": data.title,
    ...(data.url ? { "data-share-url": data.url } : {})
  };
}

export function getStaticProfileRuntimeScript(): string {
  return [
    getProfileShareCapabilities.toString(),
    shareProfile.toString(),
    copyProfileUrl.toString(),
    getButtonShareData.toString(),
    setShareDialogUrl.toString(),
    openShareDialog.toString(),
    closeShareDialog.toString(),
    attachProfileShareButtons.toString(),
    'attachProfileShareButtons(document);'
  ].join("\n\n");
}
