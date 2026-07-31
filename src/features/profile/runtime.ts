type ShareNavigator = Navigator & {
  clipboard?: {
    writeText(value: string): Promise<void>;
  };
  share?: (data: { text?: string; title?: string; url?: string }) => Promise<void>;
};

type QueryRoot = {
  querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>;
};

const shareCopyResetTimers = new WeakMap<HTMLButtonElement, number>();

function getCapabilities() {
  const browserNavigator = navigator as ShareNavigator;
  const canUseSecureApi =
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return {
    canCopy: Boolean(
      "clipboard" in browserNavigator &&
        typeof browserNavigator.clipboard?.writeText === "function" &&
        canUseSecureApi,
    ),
    canShare: Boolean(
      "share" in browserNavigator &&
        typeof browserNavigator.share === "function" &&
        canUseSecureApi &&
        window.location.protocol !== "file:",
    ),
  };
}

function getButtonShareData(button: HTMLElement) {
  return {
    text: button.dataset.shareText ?? "",
    title: button.dataset.shareTitle ?? document.title,
    url: button.dataset.shareUrl || window.location.href,
  };
}

function setShareDialogUrl(root: QueryRoot, url: string): void {
  root.querySelectorAll<HTMLElement>("[data-profile-share-url-text]").forEach((node) => {
    node.textContent = url;
  });
}

function closeShareDialog(overlay: HTMLElement): void {
  overlay.querySelectorAll<HTMLButtonElement>("[data-profile-share-copy]").forEach((button) => {
    const resetTimer = shareCopyResetTimers.get(button);
    if (resetTimer !== undefined) window.clearTimeout(resetTimer);
    shareCopyResetTimers.delete(button);
    button.classList.remove("is-copied");
    button.setAttribute("aria-label", "Copy link");
    const label = button.querySelector<HTMLElement>("[data-profile-share-copy-label]");
    if (label) label.textContent = "Copy link";
  });
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function openShareDialog(button: HTMLElement): void {
  const profile = button.closest<HTMLElement>(".public-profile");
  const overlay = profile?.querySelector<HTMLElement>("[data-profile-share-overlay]");
  if (!overlay) return;

  const data = getButtonShareData(button);
  setShareDialogUrl(overlay, data.url);
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
}

function attachProfileRuntime(root: QueryRoot = document): void {
  const capabilities = getCapabilities();

  root.querySelectorAll<HTMLElement>("[data-profile-share-button]").forEach((button) => {
    button.addEventListener("click", () => openShareDialog(button));
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

  root.querySelectorAll<HTMLButtonElement>("[data-profile-share-copy]").forEach((button) => {
    button.disabled = !capabilities.canCopy;
    button.addEventListener("click", () => {
      const browserNavigator = navigator as ShareNavigator;
      if (!getCapabilities().canCopy || !browserNavigator.clipboard) return;

      const overlay = button.closest<HTMLElement>("[data-profile-share-overlay]");
      const url =
        overlay?.querySelector<HTMLElement>("[data-profile-share-url-text]")?.textContent ??
        window.location.href;
      void browserNavigator.clipboard
        .writeText(url)
        .then(() => {
          const resetTimer = shareCopyResetTimers.get(button);
          if (resetTimer !== undefined) window.clearTimeout(resetTimer);
          button.classList.add("is-copied");
          button.setAttribute("aria-label", "Link copied");
          const label = button.querySelector<HTMLElement>("[data-profile-share-copy-label]");
          if (label) label.textContent = "Copied!";
          shareCopyResetTimers.set(
            button,
            window.setTimeout(() => {
              button.classList.remove("is-copied");
              button.setAttribute("aria-label", "Copy link");
              if (label) label.textContent = "Copy link";
              shareCopyResetTimers.delete(button);
            }, 1400),
          );
        })
        .catch(() => {});
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-profile-share-system]").forEach((button) => {
    button.disabled = !capabilities.canShare;
    button.addEventListener("click", () => {
      const browserNavigator = navigator as ShareNavigator;
      if (!getCapabilities().canShare || !browserNavigator.share) return;

      const profile = button.closest<HTMLElement>(".public-profile");
      const shareButton = profile?.querySelector<HTMLElement>("[data-profile-share-button]");
      if (!shareButton) return;

      void browserNavigator.share(getButtonShareData(shareButton));
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-profile-wechat-copy]").forEach((button) => {
    button.disabled = !capabilities.canCopy;

    button.addEventListener("click", () => {
      const browserNavigator = navigator as ShareNavigator;
      const wechatId = button.dataset.wechatId;
      if (
        !wechatId ||
        !getCapabilities().canCopy ||
        !browserNavigator.clipboard
      ) {
        return;
      }

      void browserNavigator.clipboard.writeText(wechatId).then(() => {
        button.classList.add("is-copied");
        window.setTimeout(() => {
          button.classList.remove("is-copied");
        }, 1400);
      });
    });
  });
}

attachProfileRuntime(document);
