import { motion } from "framer-motion";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";
import { ThemeToggle } from "./ThemeToggle";

export function LanguageSwitcher() {
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);

  const pill = (code: Lang, label: string) => {
    const active = lang === code;
    return (
      <motion.button
        type="button"
        onClick={() => setLang(code)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={[
          "relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors sm:py-1 sm:text-xs",
          active ? "text-white" : "text-ink-700 hover:text-ink-900 dark:text-slate-200 dark:hover:text-white",
        ].join(" ")}
      >
        {active ? (
          <motion.span
            layoutId="lang-pill"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 shadow-soft"
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          />
        ) : null}
        <span className="relative z-10">{label}</span>
      </motion.button>
    );
  };

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 p-1 pr-1.5 shadow-card ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-800/80 dark:ring-slate-600/80">
      {pill("ru", t(lang, "lang_ru"))}
      {pill("tg", t(lang, "lang_tg"))}
      <ThemeToggle />
    </div>
  );
}
