import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

export function Login() {
  const lang = useAppStore((s) => s.lang);

  return (
    <div className="min-h-screen bg-slate-100 text-ink-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-white/95 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold">
            <BrandLogo variant="header" className="rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-600/50" />
            {t(lang, "brand")}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-8 shadow-soft ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700/80">
          <h1 className="text-xl font-extrabold">{t(lang, "placeholder_login_title")}</h1>
          <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">{t(lang, "placeholder_login_body")}</p>
          <Link to="/" className="mt-8 inline-flex rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-extrabold text-white dark:bg-sky-600">
            {t(lang, "placeholder_back_home")}
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
