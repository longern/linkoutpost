import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { resources } from "./resources";

export type Language = keyof typeof resources;
export type TranslationOptions = Record<string, string | number>;
export type Translate = (key: string, options?: TranslationOptions) => string;

const fallbackLanguage: Language = "en";

function normalizeLanguage(value: string): Language | null {
  const language = value.trim().toLowerCase().split("-")[0];
  return language === "en" || language === "zh" ? language : null;
}

export function detectLanguage(
  preferences: string | readonly string[] | null | undefined,
): Language {
  const values = Array.isArray(preferences)
    ? preferences
    : typeof preferences === "string"
      ? preferences.split(",").map((value) => value.split(";")[0])
      : [];

  for (const value of values) {
    const language = normalizeLanguage(value);
    if (language) return language;
  }

  return fallbackLanguage;
}

export function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return fallbackLanguage;
  return detectLanguage(
    navigator.languages.length ? navigator.languages : [navigator.language],
  );
}

function lookup(language: Language, key: string): unknown {
  return key.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[segment];
  }, resources[language]);
}

function interpolate(value: string, options: TranslationOptions): string {
  return value.replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(options, name)
      ? String(options[name])
      : match,
  );
}

export function createTranslator(language: Language): Translate {
  return (key, options = {}) => {
    const value = lookup(language, key) ?? lookup(fallbackLanguage, key);
    if (typeof value === "string") return interpolate(value, options);
    return typeof options.defaultValue === "string"
      ? interpolate(options.defaultValue, options)
      : key;
  };
}

type I18nContextValue = {
  language: Language;
  t: Translate;
};

const I18nContext = createContext<I18nContextValue>({
  language: fallbackLanguage,
  t: createTranslator(fallbackLanguage),
});

export function I18nProvider({
  children,
  language = detectBrowserLanguage(),
}: {
  children: ReactNode;
  language?: Language;
}) {
  const value = useMemo(
    () => ({ language, t: createTranslator(language) }),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}
