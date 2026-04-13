import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

/** Syncs `<html lang>` and document title with UI language (RU / TJ). */
export function DocumentLang() {
  const lang = useAppStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.lang = lang === "tg" ? "tg-Cyrl" : "ru";
    document.title =
      lang === "tg" ? "Kasbnoma — интихоби касб" : "Kasbnoma — выбор профессии";
  }, [lang]);

  return null;
}
