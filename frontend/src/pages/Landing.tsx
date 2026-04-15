import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Illustration } from "../components/Illustration";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";
import { startTest } from "../api/kasbnoma";

const viewAnim = (reduce: boolean | null) =>
  reduce
    ? { initial: false, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      };

function IconStep1({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="8" y="10" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M14 18h20M14 24h14M14 30h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconStep2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M10 36V16l14-8 14 8v20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 22v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconStep3({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="22" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M18 38h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconStep4({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M14 30l8-8 6 6 10-12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8" y="8" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M20 4l2.2 8.2L30 14l-7.8 3.6L24 26l-4-8.4L12 18l8-2L20 4z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const va = viewAnim(reduce);
  const [bootError, setBootError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const lang = useAppStore((s) => s.lang);
  const setSession = useAppStore((s) => s.setSession);
  const clearSession = useAppStore((s) => s.clearSession);
  const setReadinessOutcome = useAppStore((s) => s.setReadinessOutcome);

  const onStart = async () => {
    try {
      setBootError(null);
      clearSession();
      setReadinessOutcome(null);
      const res = await startTest(null);
      setSession(res.user_id, res.session_id);
      navigate("/readiness");
    } catch {
      setBootError(t(lang, "error_generic"));
    }
  };

  const closeNav = () => setNavOpen(false);

  const steps = [
    { n: 1, Icon: IconStep1, titleKey: "landing_step1_title", descKey: "landing_step1_desc" },
    { n: 2, Icon: IconStep2, titleKey: "landing_step2_title", descKey: "landing_step2_desc" },
    { n: 3, Icon: IconStep3, titleKey: "landing_step3_title", descKey: "landing_step3_desc" },
    { n: 4, Icon: IconStep4, titleKey: "landing_step4_title", descKey: "landing_step4_desc" },
  ] as const;

  const stats = [
    { titleKey: "landing_stat1_title", descKey: "landing_stat1_desc" },
    { titleKey: "landing_stat2_title", descKey: "landing_stat2_desc" },
    { titleKey: "landing_stat3_title", descKey: "landing_stat3_desc" },
    { titleKey: "landing_stat4_title", descKey: "landing_stat4_desc" },
  ] as const;

  const ctaBtn =
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-coral to-brand-coral-deep px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-brand-coral/25 ring-1 ring-white/20 transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950";

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-ink-900 dark:bg-slate-950 dark:text-slate-100 sm:pb-0">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <motion.div
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-navy to-sky-600 text-sm font-black text-white shadow-md sm:h-11 sm:w-11">
              K
            </div>
            <div className="min-w-0">
              <div className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 sm:text-xs">
                {t(lang, "brand")}
              </div>
              <div className="truncate text-xs font-extrabold text-brand-navy dark:text-sky-200 sm:text-sm">{t(lang, "landing_kicker")}</div>
            </div>
          </motion.div>

          <nav className="hidden items-center gap-1 text-sm font-bold text-brand-navy/90 dark:text-sky-100/90 md:flex">
            <a href="#about" className="rounded-xl px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800">
              {t(lang, "nav_about")}
            </a>
            <a href="#clusters" className="rounded-xl px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800">
              {t(lang, "nav_clusters")}
            </a>
            <a href="#contacts" className="rounded-xl px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800">
              {t(lang, "nav_contacts")}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <motion.button type="button" onClick={onStart} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className={`${ctaBtn} hidden sm:inline-flex`}>
              {t(lang, "landing_cta")}
              <motion.span aria-hidden className="inline-block" animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}>
                →
              </motion.span>
            </motion.button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-brand-navy shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 md:hidden"
              aria-expanded={navOpen}
              aria-label="Menu"
              onClick={() => setNavOpen((v) => !v)}
            >
              <span className="sr-only">Menu</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {navOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                ) : (
                  <>
                    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {navOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="border-t border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-900 md:hidden"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
                <a href="#about" className="rounded-xl px-3 py-3 text-sm font-bold text-brand-navy dark:text-sky-100" onClick={closeNav}>
                  {t(lang, "nav_about")}
                </a>
                <a href="#clusters" className="rounded-xl px-3 py-3 text-sm font-bold text-brand-navy dark:text-sky-100" onClick={closeNav}>
                  {t(lang, "nav_clusters")}
                </a>
                <a href="#contacts" className="rounded-xl px-3 py-3 text-sm font-bold text-brand-navy dark:text-sky-100" onClick={closeNav}>
                  {t(lang, "nav_contacts")}
                </a>
                <motion.button type="button" onClick={() => { closeNav(); void onStart(); }} className={`${ctaBtn} mt-2 w-full`}>
                  {t(lang, "landing_cta")}
                </motion.button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[length:24px_24px] opacity-[0.35] dark:opacity-[0.12]"
          style={{
            backgroundImage: `linear-gradient(to right, rgb(148 163 184 / 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(148 163 184 / 0.12) 1px, transparent 1px)`,
          }}
        />
        <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-sky-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-navy-deep/90 via-brand-navy/40 to-transparent dark:from-brand-navy-deep/90 dark:via-brand-navy/40" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-10 sm:gap-12 sm:px-6 sm:pb-24 sm:pt-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 lg:pt-16">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 rounded-3xl border border-slate-200/60 bg-white/55 p-6 text-brand-navy shadow-sm ring-1 ring-white/60 backdrop-blur-md dark:border-transparent dark:bg-transparent dark:p-0 dark:text-white dark:shadow-none dark:ring-0 lg:order-1"
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-bold text-brand-navy shadow-sm ring-1 ring-slate-100 backdrop-blur-sm dark:border-transparent dark:bg-white/15 dark:text-white/95 dark:shadow-none dark:ring-white/25"
              animate={reduce ? undefined : { boxShadow: ["0 0 0 0 rgba(255,255,255,0)", "0 0 0 10px rgba(255,255,255,0.06)", "0 0 0 0 rgba(255,255,255,0)"] }}
              transition={{ duration: 2.8, repeat: Infinity }}
            >
              <IconSpark className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              {t(lang, "landing_kicker")}
            </motion.div>
            <h1 className="mt-5 text-balance text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[2.75rem] dark:text-white">
              {t(lang, "landing_title")}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base font-medium leading-relaxed text-slate-700 sm:text-lg dark:text-white/85">
              {t(lang, "landing_sub")}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-white/65">{t(lang, "landing_note")}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <motion.button
                type="button"
                onClick={onStart}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`${ctaBtn} px-7 py-3.5 text-base shadow-xl sm:text-sm`}
              >
                {t(lang, "landing_cta")}
                <span aria-hidden>→</span>
              </motion.button>
              <motion.a
                href="#about"
                whileHover={{ y: -1 }}
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-2xl border border-slate-300/90 bg-white/80 px-6 py-3 text-sm font-extrabold text-brand-navy shadow-sm backdrop-blur-sm transition hover:bg-white dark:border-white/35 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/15"
              >
                {t(lang, "landing_faq_link")}
              </motion.a>
            </div>
            {bootError ? (
              <div className="mt-4 text-sm font-semibold text-rose-700 dark:text-amber-200">{bootError}</div>
            ) : null}
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 lg:order-2"
          >
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <motion.div
                className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-slate-200/40 to-sky-100/30 blur-2xl dark:from-white/25 dark:to-white/5"
                animate={reduce ? undefined : { opacity: [0.5, 0.85, 0.5] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative rounded-[1.75rem] border border-slate-200/70 bg-white/70 p-4 shadow-lg shadow-slate-900/5 ring-1 ring-white/80 backdrop-blur-md dark:border-transparent dark:bg-white/10 dark:shadow-none dark:ring-white/25 sm:p-6">
                <Illustration className="mx-auto w-full max-w-md drop-shadow-2xl sm:max-w-lg" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="about"
        className="relative -mt-12 scroll-mt-24 rounded-t-[2rem] bg-white px-4 py-16 shadow-[0_-12px_40px_-20px_rgba(15,39,68,0.15)] dark:bg-slate-950 dark:shadow-[0_-12px_40px_-20px_rgba(0,0,0,0.4)] sm:px-6 sm:py-20 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div {...va} className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-navy dark:text-sky-100 sm:text-3xl">{t(lang, "landing_how_title")}</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">{t(lang, "landing_how_sub")}</p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {steps.map((s, i) => (
              <motion.article
                key={s.n}
                {...va}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : i * 0.08 }}
                whileHover={reduce ? undefined : { y: -6 }}
                className="group relative flex flex-col rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-card ring-1 ring-slate-100 transition hover:shadow-lg dark:border-slate-700/80 dark:from-slate-900 dark:to-slate-900/80 dark:ring-slate-700/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-coral/90 to-brand-coral-deep text-sm font-black text-white shadow-md">
                    {s.n}
                  </span>
                  <s.Icon className="h-9 w-9 text-brand-navy/35 transition group-hover:text-brand-coral dark:text-slate-500 dark:group-hover:text-brand-coral" />
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-brand-navy dark:text-slate-50">{t(lang, s.titleKey)}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">{t(lang, s.descKey)}</p>
              </motion.article>
            ))}
          </div>

          <motion.div {...va} className="mt-12 flex justify-center">
            <motion.button type="button" onClick={onStart} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className={ctaBtn}>
              {t(lang, "landing_cta")}
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Stats / clusters teaser */}
      <section id="clusters" className="scroll-mt-24 bg-slate-50 px-4 py-16 dark:bg-slate-900/80 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <motion.div {...va} className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-navy dark:text-sky-100 sm:text-3xl">{t(lang, "landing_stats_title")}</h2>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((st, i) => (
              <motion.div
                key={st.titleKey}
                {...va}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : i * 0.06 }}
                whileHover={reduce ? undefined : { y: -4 }}
                className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50/90 to-white p-5 shadow-sm ring-1 ring-sky-100/80 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/90 dark:ring-slate-700/80"
              >
                <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" />
                <h3 className="mt-4 text-base font-extrabold text-brand-navy dark:text-slate-50">{t(lang, st.titleKey)}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">{t(lang, st.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-white px-4 py-14 dark:bg-slate-950 sm:px-6 sm:py-16 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <motion.div
            {...va}
            className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white p-8 shadow-soft ring-1 ring-slate-100 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/95 dark:ring-slate-700 sm:p-10"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-coral/10 blur-2xl" />
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <motion.div
                className="mx-auto grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-navy to-sky-600 text-xl font-black text-white shadow-lg sm:mx-0 sm:h-24 sm:w-24 sm:text-2xl"
                animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              >
                K
              </motion.div>
              <div>
                <div className="flex gap-0.5 text-brand-coral" aria-hidden>
                  {[1, 2, 3, 4].map((k) => (
                    <motion.span key={k} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ delay: k * 0.06 }}>
                      ★
                    </motion.span>
                  ))}
                </div>
                <blockquote className="mt-3 text-pretty text-base font-semibold leading-relaxed text-brand-navy dark:text-slate-100 sm:text-lg">
                  «{t(lang, "landing_testimonial_quote")}»
                </blockquote>
                <footer className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">— {t(lang, "landing_testimonial_name")}</footer>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacts" className="scroll-mt-24 bg-gradient-to-b from-brand-navy-deep to-brand-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-sm font-black">K</div>
              <span className="text-sm font-extrabold">{t(lang, "brand")}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-white/70">{t(lang, "landing_sub")}</p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold">
            <a href="#about" className="text-white/85 transition hover:text-white">
              {t(lang, "footer_about")}
            </a>
            <Link to="/universities" className="text-white/85 transition hover:text-white">
              {t(lang, "footer_unis")}
            </Link>
            <Link to="/feedback" className="text-white/85 transition hover:text-white">
              {t(lang, "footer_feedback")}
            </Link>
            <a href="#contacts" className="text-white/85 transition hover:text-white">
              {t(lang, "nav_contacts")}
            </a>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs font-semibold text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
            <span>
              © {new Date().getFullYear()} {t(lang, "brand")}. {t(lang, "footer_rights")}
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile FAB CTA */}
      <motion.div
        className="fixed bottom-4 left-4 right-4 z-40 sm:hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <motion.button
          type="button"
          onClick={onStart}
          whileTap={{ scale: 0.98 }}
          className={`${ctaBtn} w-full py-3.5 text-base shadow-2xl`}
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {t(lang, "landing_cta")}
        </motion.button>
      </motion.div>
    </div>
  );
}
