import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { clusterCopy, t } from "../i18n/translations";
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
  const location = useLocation();
  const reduce = useReducedMotion();
  const va = viewAnim(reduce);
  const [bootError, setBootError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const lang = useAppStore((s) => s.lang);
  const setSession = useAppStore((s) => s.setSession);
  const clearSession = useAppStore((s) => s.clearSession);
  const setReadinessOutcome = useAppStore((s) => s.setReadinessOutcome);
  const bumpTestAttempt = useAppStore((s) => s.bumpTestAttempt);

  const onStart = async () => {
    try {
      setBootError(null);
      clearSession();
      setReadinessOutcome(null);
      const res = await startTest(null);
      bumpTestAttempt();
      setSession(res.user_id, res.session_id);
      navigate("/readiness");
    } catch {
      setBootError(t(lang, "error_generic"));
    }
  };

  const closeNav = () => setNavOpen(false);

  useEffect(() => {
    if (location.hash !== "#start-test") return;
    const el = document.getElementById("start-test");
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [location.hash, location.pathname]);

  const steps = [
    { n: 1, Icon: IconStep1, titleKey: "landing_step1_title", descKey: "landing_step1_desc" },
    { n: 2, Icon: IconStep2, titleKey: "landing_step2_title", descKey: "landing_step2_desc" },
    { n: 3, Icon: IconStep3, titleKey: "landing_step3_title", descKey: "landing_step3_desc" },
    { n: 4, Icon: IconStep4, titleKey: "landing_step4_title", descKey: "landing_step4_desc" },
  ] as const;

  const clusterIds = [1, 2, 3, 4, 5] as const;
  const advantageKeys = ["landing_adv_1", "landing_adv_2", "landing_adv_3", "landing_adv_4", "landing_adv_5"] as const;
  const sampleCluster = clusterCopy(lang, 5);

  const ctaBtn =
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-coral to-brand-coral-deep px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-brand-coral/25 ring-1 ring-white/20 transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950";

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-ink-900 dark:bg-slate-950 dark:text-slate-100 sm:pb-0">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3" onClick={() => setNavOpen(false)}>
              <BrandLogo variant="header" className="rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-600/50" />
              <div className="min-w-0">
                <div className="truncate text-brand-mark-3d">{t(lang, "brand")}</div>
                <div className="truncate text-xs text-brand-navy dark:text-sky-200 sm:text-sm">
                  <span className="text-submark-3d">{t(lang, "landing_kicker")}</span>
                </div>
              </div>
            </Link>
          </motion.div>

          <nav className="hidden flex-wrap items-center justify-center gap-0.5 text-[11px] font-bold text-brand-navy/90 dark:text-sky-100/90 md:flex lg:text-xs xl:text-sm">
            <Link to="/" className="rounded-xl px-2 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 xl:px-3">
              {t(lang, "nav_home")}
            </Link>
            <Link to="/about" className="rounded-xl px-2 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 xl:px-3">
              {t(lang, "nav_about_platform")}
            </Link>
            <a href="#how-it-works" className="rounded-xl px-2 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 xl:px-3">
              {t(lang, "nav_how")}
            </a>
            <Link to="/specialties" className="rounded-xl px-2 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 xl:px-3">
              {t(lang, "nav_specialties")}
            </Link>
            <Link to="/universities" className="rounded-xl px-2 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 xl:px-3">
              {t(lang, "nav_universities")}
            </Link>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="hidden rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-extrabold text-brand-navy shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 md:inline-flex lg:text-sm"
            >
              {t(lang, "nav_login")}
            </Link>
            <motion.button type="button" onClick={onStart} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className={`${ctaBtn} hidden md:inline-flex`}>
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
                <Link to="/" className="rounded-xl px-3 py-3 text-sm font-bold text-brand-navy dark:text-sky-100" onClick={closeNav}>
                  {t(lang, "nav_home")}
                </Link>
                <a href="#how-it-works" className="rounded-xl px-3 py-3 text-sm font-bold text-brand-navy dark:text-sky-100" onClick={closeNav}>
                  {t(lang, "nav_how")}
                </a>
                <Link to="/specialties" className="rounded-xl px-3 py-3 text-sm font-bold text-brand-navy dark:text-sky-100" onClick={closeNav}>
                  {t(lang, "nav_specialties")}
                </Link>
                <Link to="/universities" className="rounded-xl px-3 py-3 text-sm font-bold text-brand-navy dark:text-sky-100" onClick={closeNav}>
                  {t(lang, "nav_universities")}
                </Link>
                <Link to="/result" className="rounded-xl px-3 py-3 text-sm font-bold text-brand-navy dark:text-sky-100" onClick={closeNav}>
                  {t(lang, "nav_my_result")}
                </Link>
                <Link to="/login" className="rounded-xl px-3 py-3 text-sm font-bold text-brand-navy dark:text-sky-100" onClick={closeNav}>
                  {t(lang, "nav_account")}
                </Link>
                <Link to="/subscriptions" className="rounded-xl px-3 py-3 text-sm font-bold text-brand-navy dark:text-sky-100" onClick={closeNav}>
                  {t(lang, "nav_subscriptions")}
                </Link>
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
            <h1 className="mt-5 text-balance font-display text-3xl leading-[1.12] text-hero-3d sm:text-4xl md:text-5xl lg:text-[2.75rem]">
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
                href="#how-it-works"
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
                className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-sky-200/35 to-indigo-200/25 blur-3xl dark:from-sky-500/20 dark:to-indigo-600/10"
                animate={reduce ? undefined : { opacity: [0.45, 0.75, 0.45] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
              <img
                src="/landing-hero.png"
                alt=""
                decoding="async"
                className="relative z-[1] mx-auto h-auto w-full max-h-[min(85vh,56rem)] max-w-5xl rounded-2xl object-contain object-center shadow-xl shadow-slate-900/15 dark:shadow-black/50 lg:max-w-6xl"
              />
            </div>
          </motion.div>
        </div>

      </section>

      {/* 2. Кластерҳо */}
      <section id="clusters" className="scroll-mt-24 bg-white px-4 py-16 dark:bg-slate-950 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <motion.div {...va} className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-navy dark:text-sky-100 sm:text-3xl">{t(lang, "landing_clusters_title")}</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">{t(lang, "landing_clusters_sub")}</p>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clusterIds.map((id, i) => {
              const { title, desc } = clusterCopy(lang, id);
              return (
                <motion.article
                  key={id}
                  {...va}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : i * 0.05 }}
                  whileHover={reduce ? undefined : { y: -4 }}
                  className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-card ring-1 ring-slate-100 dark:border-slate-700/80 dark:from-slate-900 dark:to-slate-900/80 dark:ring-slate-700/60"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-black text-white">
                    {id}
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold text-brand-navy dark:text-slate-50">{title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">{desc}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Чӣ гуна кор мекунад */}
      <section
        id="how-it-works"
        className="relative scroll-mt-24 bg-slate-50 px-4 py-16 dark:bg-slate-900/80 sm:px-6 sm:py-20 lg:px-10"
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

      {/* 4. Намунаи натиҷа */}
      <section id="sample-result" className="scroll-mt-24 bg-white px-4 py-16 dark:bg-slate-950 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <motion.div {...va} className="text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-navy dark:text-sky-100 sm:text-3xl">{t(lang, "landing_sample_title")}</h2>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">{t(lang, "landing_sample_sub")}</p>
          </motion.div>
          <motion.div
            {...va}
            className="mt-10 rounded-3xl bg-gradient-to-br from-indigo-600 via-sky-600 to-emerald-500 p-8 text-white shadow-xl ring-1 ring-white/20"
          >
            <div className="text-xs font-black uppercase tracking-wide text-white/80">{t(lang, "landing_sample_badge")}</div>
            <h3 className="mt-3 text-2xl font-extrabold leading-snug sm:text-3xl">{sampleCluster.title}</h3>
            <p className="mt-3 text-base font-medium leading-relaxed text-white/90">{sampleCluster.desc}</p>
            <p className="mt-6 text-sm font-semibold text-white/85">{t(lang, "landing_sample_specs_example")}</p>
          </motion.div>
        </div>
      </section>

      {/* 5. Афзалиятҳо */}
      <section id="advantages" className="scroll-mt-24 bg-slate-50 px-4 py-16 dark:bg-slate-900/80 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <motion.div {...va} className="text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-navy dark:text-sky-100 sm:text-3xl">{t(lang, "landing_advantages_title")}</h2>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">{t(lang, "landing_advantages_sub")}</p>
          </motion.div>
          <ul className="mt-10 space-y-4">
            {advantageKeys.map((key, i) => (
              <motion.li
                key={key}
                {...va}
                transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.05 }}
                className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-sm font-semibold leading-relaxed text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <span className="text-lg" aria-hidden>
                  ✅
                </span>
                <span>{t(lang, key)}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Фикру мулоҳизаҳо */}
      <section id="testimonials" className="scroll-mt-24 bg-white px-4 py-14 dark:bg-slate-950 sm:px-6 sm:py-16 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <motion.h2 {...va} className="mb-10 text-center text-2xl font-extrabold tracking-tight text-brand-navy dark:text-sky-100 sm:text-3xl">
            {t(lang, "landing_testimonials_heading")}
          </motion.h2>
          <motion.div
            {...va}
            className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white p-8 shadow-soft ring-1 ring-slate-100 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/95 dark:ring-slate-700 sm:p-10"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-coral/10 blur-2xl" />
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="mx-auto shrink-0 rounded-full bg-white/90 p-2 shadow-lg ring-1 ring-slate-200/80 dark:bg-slate-800/90 dark:ring-slate-600 sm:mx-0">
                <BrandLogo variant="testimonial" className="rounded-full" />
              </div>
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

      {/* 7. Оғози тест */}
      <section id="start-test" className="scroll-mt-24 bg-gradient-to-b from-slate-100 to-white px-4 py-16 dark:from-slate-900 dark:to-slate-950 sm:px-6 sm:py-20 lg:px-10">
        <motion.div {...va} className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-brand-navy dark:text-sky-100 sm:text-3xl">{t(lang, "landing_final_title")}</h2>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">{t(lang, "landing_final_sub")}</p>
          <motion.button type="button" onClick={onStart} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className={`${ctaBtn} mt-8 px-8 py-3.5 text-base`}>
            {t(lang, "landing_cta")}
            <span aria-hidden>→</span>
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer id="contacts" className="scroll-mt-24 bg-gradient-to-b from-brand-navy-deep to-brand-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-10">
          <div>
            <div className="flex items-center gap-3">
              <BrandLogo variant="footer" className="rounded-xl bg-white/10 p-0.5 ring-1 ring-white/20" />
              <span className="font-display text-sm font-extrabold tracking-tight text-white drop-shadow-md">{t(lang, "brand")}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-white/70">{t(lang, "landing_sub")}</p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold">
            <Link to="/about" className="text-white/85 transition hover:text-white">
              {t(lang, "nav_about_platform")}
            </Link>
            <a href="#how-it-works" className="text-white/85 transition hover:text-white">
              {t(lang, "nav_how")}
            </a>
            <Link to="/specialties" className="text-white/85 transition hover:text-white">
              {t(lang, "nav_specialties")}
            </Link>
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
