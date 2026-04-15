import { motion } from "framer-motion";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

/** Switches `light` / `dark`; syncs to `<html class="dark">` via `DocumentLang`. */
export function ThemeToggle({ className }: { className?: string }) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      onClick={() => toggleTheme()}
      whileTap={{ scale: 0.94 }}
      aria-pressed={isDark}
      aria-label={isDark ? t(lang, "theme_light") : t(lang, "theme_dark")}
      title={isDark ? t(lang, "theme_light") : t(lang, "theme_dark")}
      className={[
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-base shadow-sm transition-colors",
        "border-slate-200/90 bg-white/95 text-amber-600 ring-1 ring-slate-200/50",
        "dark:border-slate-600 dark:bg-slate-800 dark:text-amber-300 dark:ring-slate-600/80",
        className ?? "",
      ].join(" ")}
    >
      <span className="sr-only">{isDark ? t(lang, "theme_light") : t(lang, "theme_dark")}</span>
      <span aria-hidden>{isDark ? "☀️" : "🌙"}</span>
    </motion.button>
  );
}
