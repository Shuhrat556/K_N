import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

/** Syncs `<html lang>`, color-scheme, `dark` class, and document title. */
export function DocumentLang() {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.lang = lang === "tg" ? "tg-Cyrl" : "ru";
    document.title = lang === "tg" ? "Касбнома — интихоби касб" : "Касбнома — профориентация";
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    const dark = theme === "dark";
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  }, [theme]);

  return null;
}
