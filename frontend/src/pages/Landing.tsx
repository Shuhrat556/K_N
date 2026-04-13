import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Illustration } from "../components/Illustration";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";
import { startTest } from "../api/kasbnoma";

export function Landing() {
  const navigate = useNavigate();
  const [bootError, setBootError] = useState<string | null>(null);
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

  return (
    <div className="page-shell flex min-h-full flex-col pb-16 pt-8 sm:pt-12">
      <header className="flex items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-3"
        >
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-sm font-black text-white shadow-soft">
            K
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-ink-500">{t(lang, "brand")}</div>
            <div className="text-sm font-extrabold text-ink-900">{t(lang, "landing_kicker")}</div>
          </div>
        </motion.div>
        <LanguageSwitcher />
      </header>

      <main className="mt-10 grid flex-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-ink-700 shadow-card ring-1 ring-slate-200/70">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t(lang, "landing_kicker")}
            </div>
            <h1 className="mt-5 text-balance text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              {t(lang, "landing_title")}
            </h1>
            <p className="mt-5 max-w-prose text-pretty text-base font-medium leading-relaxed text-ink-700 sm:text-lg">
              {t(lang, "landing_sub")}
            </p>
            <p className="mt-4 text-sm font-medium text-ink-500">{t(lang, "landing_note")}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <motion.button
                type="button"
                onClick={onStart}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-400 px-6 py-3 text-sm font-extrabold text-white shadow-soft ring-1 ring-white/25"
              >
                {t(lang, "landing_cta")}
              </motion.button>
              <motion.a
                href="#how"
                whileHover={{ y: -1 }}
                className="inline-flex items-center justify-center rounded-2xl bg-white/80 px-6 py-3 text-sm font-extrabold text-ink-900 shadow-card ring-1 ring-slate-200/70"
              >
                {t(lang, "landing_faq_link")}
              </motion.a>
              <motion.button
                type="button"
                onClick={() => navigate("/admin")}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-extrabold text-white shadow-card"
              >
                Админ
              </motion.button>
            </div>
            {bootError ? <div className="mt-4 text-sm font-semibold text-rose-700">{bootError}</div> : null}
          </motion.div>

          <motion.div id="how" className="mt-10 grid gap-3 sm:grid-cols-3" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
            {[
              { tKey: "landing_flow_chip", dKey: "landing_flow_desc" },
              { tKey: "landing_adaptive_chip", dKey: "landing_adaptive_desc" },
              { tKey: "landing_tech_chip", dKey: "landing_tech_desc" },
            ].map((x) => (
              <motion.div
                key={x.tKey}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                className="rounded-3xl bg-white/70 p-4 shadow-card ring-1 ring-slate-200/70"
              >
                <div className="text-lg font-black text-ink-900">{t(lang, x.tKey)}</div>
                <div className="mt-1 text-xs font-semibold text-ink-600">{t(lang, x.dKey)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-indigo-500/15 via-sky-400/10 to-emerald-400/15 blur-2xl" />
          <Illustration />
        </motion.div>
      </main>
    </div>
  );
}
