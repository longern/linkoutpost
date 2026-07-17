export type AppTheme = "dark" | "light";

export const appThemeStorageKey = "linkoutpost:app-theme";

function isAppTheme(value: string | null): value is AppTheme {
  return value === "dark" || value === "light";
}

export function readAppTheme(): AppTheme {
  if (typeof document !== "undefined") {
    const documentTheme = document.documentElement.dataset.appTheme ?? null;
    if (isAppTheme(documentTheme)) return documentTheme;
  }

  if (typeof window !== "undefined") {
    try {
      const storedTheme = window.localStorage.getItem(appThemeStorageKey);
      if (isAppTheme(storedTheme)) return storedTheme;
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }

  return "dark";
}

export function applyAppTheme(theme: AppTheme) {
  document.documentElement.dataset.appTheme = theme;

  try {
    window.localStorage.setItem(appThemeStorageKey, theme);
  } catch {
    // The active tab still receives the theme through the document attribute.
  }
}
