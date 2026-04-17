import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { getAboutContent } from "../content/aboutPlatform";
import { BrandLogo } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

export function About() {
  const lang = useAppStore((s) => s.lang);
  const content = getAboutContent(lang);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  return (
    <div className="min-h-screen bg-slate-100 text-ink-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-extrabold text-brand-navy dark:text-sky-100">
            <BrandLogo variant="header" className="rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-600/50" />
            <span className="truncate">{t(lang, "brand")}</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="text-sm font-bold tracking-wide text-sky-700 dark:text-sky-300">{content.tagline}</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-navy dark:text-sky-50 sm:text-4xl">
            {content.pageTitle}
          </h1>

          <div className="mt-10 space-y-8">
            {content.blocks.map((block, i) => {
              if (block.type === "h2") {
                return (
                  <h2
                    key={i}
                    className="border-b border-slate-200 pb-2 text-xl font-extrabold text-brand-navy dark:border-slate-700 dark:text-sky-100"
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "p") {
                return (
                  <p key={i} className="text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                    {block.text}
                  </p>
                );
              }
              return (
                <ul key={i} className="list-disc space-y-2 pl-5 text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            })}
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-extrabold text-white shadow-soft"
            >
              {t(lang, "placeholder_back_home")}
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
