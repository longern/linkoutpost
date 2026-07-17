import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa6";
import {
  appThemeStorageKey,
  applyAppTheme,
  readAppTheme,
  type AppTheme,
} from "../appTheme";

export function AppThemeToggle() {
  const [theme, setTheme] = useState<AppTheme>(readAppTheme);
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme} mode`;

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (
        event.key === appThemeStorageKey &&
        (event.newValue === "dark" || event.newValue === "light")
      ) {
        document.documentElement.dataset.appTheme = event.newValue;
        setTheme(event.newValue);
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <button
      aria-label={label}
      className="circle-icon-button app-theme-toggle"
      onClick={() => {
        applyAppTheme(nextTheme);
        setTheme(nextTheme);
      }}
      title={label}
      type="button"
    >
      {theme === "dark" ? (
        <FaSun aria-hidden="true" size={17} />
      ) : (
        <FaMoon aria-hidden="true" size={17} />
      )}
    </button>
  );
}
