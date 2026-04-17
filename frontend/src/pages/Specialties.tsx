import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { clusterCopy, t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

const CLUSTER_IDS = [1, 2, 3, 4, 5] as const;

export function Specialties() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);

  return (
    <div className="min-h-screen bg-slate-100 text-ink-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-extrabold text-brand-navy dark:text-sky-100">
            <BrandLogo variant="header" className="rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-600/50" />
            <span className="truncate">{t(lang, "brand")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-extrabold shadow-card ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-600/80"
            >
              {t(lang, "back")}
            </motion.button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl font-extrabold text-brand-navy dark:text-sky-50 sm:text-4xl">{t(lang, "specialties_page_title")}</h1>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">{t(lang, "specialties_page_sub")}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CLUSTER_IDS.map((id, i) => {
            const { title, desc } = clusterCopy(lang, id);
            return (
              <motion.article
                key={id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card ring-1 ring-slate-100 dark:border-slate-700/80 dark:bg-slate-900/90 dark:ring-slate-700/60"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-sm font-black text-white">
                  {id}
                </span>
                <h2 className="mt-4 text-lg font-extrabold text-brand-navy dark:text-slate-50">{title}</h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">{desc}</p>
              </motion.article>
            );
          })}
        </div>

        <motion.div className="mt-12 flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Link
            to={{ pathname: "/", hash: "start-test" }}
            className="inline-flex rounded-2xl bg-gradient-to-r from-brand-coral to-brand-coral-deep px-6 py-3 text-sm font-extrabold text-white shadow-lg ring-1 ring-white/20"
          >
            {t(lang, "specialties_cta")}
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
