export type ProfileShareData = {
  text: string;
  title: string;
  url?: string;
};

type ShareNavigator = Navigator & {
  clipboard?: {
    writeText(value: string): Promise<void>;
  };
  share?: (data: { text?: string; title?: string; url?: string }) => Promise<void>;
};

export async function shareProfile(data: ProfileShareData): Promise<void> {
  const browserNavigator = typeof navigator === "undefined"
    ? null
    : navigator as ShareNavigator;
  const shareUrl = data.url ?? (typeof window === "undefined" ? "" : window.location.href);

  if (browserNavigator?.share) {
    await browserNavigator.share({
      text: data.text,
      title: data.title,
      url: shareUrl
    });
    return;
  }

  if (browserNavigator?.clipboard && shareUrl) {
    await browserNavigator.clipboard.writeText(shareUrl);
  }
}

export function attachProfileShareButtons(root: ParentNode = document): void {
  const buttons = root.querySelectorAll<HTMLElement>("[data-profile-share-button]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      void shareProfile({
        text: button.dataset.shareText ?? "",
        title: button.dataset.shareTitle ?? document.title,
        url: button.dataset.shareUrl || window.location.href
      });
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
    shareProfile.toString(),
    attachProfileShareButtons.toString(),
    'attachProfileShareButtons(document);'
  ].join("\n\n");
}
