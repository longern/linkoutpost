import { useTranslation, type Language } from "../i18n";

export function AppLanguageSelect({ className }: { className: string }) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <select
      aria-label={t("navigation.language")}
      className={`app-language-select ${className}`}
      onChange={(event) =>
        setLanguage(event.currentTarget.value as Language)
      }
      value={language}
    >
      <option value="en">English</option>
      <option value="zh">中文</option>
    </select>
  );
}
