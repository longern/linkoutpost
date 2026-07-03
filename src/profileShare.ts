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

type DrawerGestureOptions = {
  onClose?: (overlay: HTMLElement) => void;
};

const PROFILE_SHARE_DRAWER_MEDIA = "(max-width: 519px)";
const PROFILE_SHARE_DRAG_CLOSE_DISTANCE = 86;
const PROFILE_SHARE_DRAG_CLOSE_VELOCITY = 0.75;
const PROFILE_SHARE_DRAG_FLICK_DISTANCE = 44;
const PROFILE_SHARE_DRAG_CLICK_TOLERANCE = 6;

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

function isProfileShareDrawer(overlay: HTMLElement): boolean {
  return Boolean(
    overlay.closest(".preview-frame") ||
      (typeof window !== "undefined" &&
        window.matchMedia(PROFILE_SHARE_DRAWER_MEDIA).matches)
  );
}

function setProfileSharePanelDrag(panel: HTMLElement, y: number): void {
  panel.style.setProperty("--profile-share-drag-y", `${Math.max(0, y)}px`);
}

function resetProfileSharePanelDrag(panel: HTMLElement): void {
  panel.classList.remove("is-dragging");
  panel.style.removeProperty("--profile-share-drag-y");
}

export function attachProfileShareDrawerGesture(
  overlay: HTMLElement,
  options: DrawerGestureOptions = {}
): () => void {
  const panel = overlay.querySelector<HTMLElement>("[data-profile-share-panel]");
  if (!panel) return () => {};
  const sharePanel = panel;

  let pointerId: number | null = null;
  let startY = 0;
  let currentY = 0;
  let startTime = 0;
  let didDrag = false;

  function onPointerDown(event: PointerEvent): void {
    if (!overlay.classList.contains("is-open") || !isProfileShareDrawer(overlay)) return;
    if (event.button !== 0 || !event.isPrimary) return;
    if ((event.target as HTMLElement).closest("button, a, input, textarea, select")) return;

    pointerId = event.pointerId;
    startY = event.clientY;
    currentY = event.clientY;
    startTime = performance.now();
    didDrag = false;
    sharePanel.classList.add("is-dragging");
    sharePanel.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== pointerId) return;

    currentY = event.clientY;
    const deltaY = Math.max(0, currentY - startY);
    if (deltaY > PROFILE_SHARE_DRAG_CLICK_TOLERANCE) didDrag = true;
    setProfileSharePanelDrag(sharePanel, deltaY);
  }

  function finishDrag(event: PointerEvent): void {
    if (event.pointerId !== pointerId) return;

    const deltaY = Math.max(0, currentY - startY);
    const elapsed = Math.max(1, performance.now() - startTime);
    const velocity = deltaY / elapsed;
    const shouldClose =
      deltaY >= PROFILE_SHARE_DRAG_CLOSE_DISTANCE ||
      (deltaY >= PROFILE_SHARE_DRAG_FLICK_DISTANCE &&
        velocity >= PROFILE_SHARE_DRAG_CLOSE_VELOCITY);

    pointerId = null;
    if (sharePanel.hasPointerCapture(event.pointerId)) {
      sharePanel.releasePointerCapture(event.pointerId);
    }

    if (shouldClose) {
      resetProfileSharePanelDrag(sharePanel);
      if (options.onClose) {
        options.onClose(overlay);
      } else {
        closeShareDialog(overlay);
      }
      return;
    }

    resetProfileSharePanelDrag(sharePanel);
  }

  function onClickCapture(event: MouseEvent): void {
    if (!didDrag) return;
    event.preventDefault();
    event.stopPropagation();
    didDrag = false;
  }

  sharePanel.addEventListener("pointerdown", onPointerDown);
  sharePanel.addEventListener("pointermove", onPointerMove);
  sharePanel.addEventListener("pointerup", finishDrag);
  sharePanel.addEventListener("pointercancel", finishDrag);
  sharePanel.addEventListener("click", onClickCapture, true);

  return () => {
    sharePanel.removeEventListener("pointerdown", onPointerDown);
    sharePanel.removeEventListener("pointermove", onPointerMove);
    sharePanel.removeEventListener("pointerup", finishDrag);
    sharePanel.removeEventListener("pointercancel", finishDrag);
    sharePanel.removeEventListener("click", onClickCapture, true);
    resetProfileSharePanelDrag(sharePanel);
  };
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
    attachProfileShareDrawerGesture(overlay);

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
    `const PROFILE_SHARE_DRAWER_MEDIA = ${JSON.stringify(PROFILE_SHARE_DRAWER_MEDIA)};`,
    `const PROFILE_SHARE_DRAG_CLOSE_DISTANCE = ${PROFILE_SHARE_DRAG_CLOSE_DISTANCE};`,
    `const PROFILE_SHARE_DRAG_CLOSE_VELOCITY = ${PROFILE_SHARE_DRAG_CLOSE_VELOCITY};`,
    `const PROFILE_SHARE_DRAG_FLICK_DISTANCE = ${PROFILE_SHARE_DRAG_FLICK_DISTANCE};`,
    `const PROFILE_SHARE_DRAG_CLICK_TOLERANCE = ${PROFILE_SHARE_DRAG_CLICK_TOLERANCE};`,
    getProfileShareCapabilities.toString(),
    shareProfile.toString(),
    copyProfileUrl.toString(),
    getButtonShareData.toString(),
    setShareDialogUrl.toString(),
    openShareDialog.toString(),
    closeShareDialog.toString(),
    isProfileShareDrawer.toString(),
    setProfileSharePanelDrag.toString(),
    resetProfileSharePanelDrag.toString(),
    attachProfileShareDrawerGesture.toString(),
    attachProfileShareButtons.toString(),
    'attachProfileShareButtons(document);'
  ].join("\n\n");
}
