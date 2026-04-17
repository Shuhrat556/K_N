import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchResult } from "../api/kasbnoma";
import type { ResultApiResponse } from "../api/types";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ResultCard } from "../components/ResultCard";
import { SAMPLE_PROGRAMS_HISTORY, clusterKlimovProfile } from "../data/resultConstants";
import { apiClusterName, apiSpecName, clusterCopy, specCopy, t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

export function Result() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);
  const userId = useAppStore((s) => s.userId);
  const lastResultUserId = useAppStore((s) => s.lastResultUserId);
  const clearSession = useAppStore((s) => s.clearSession);
  const testAttemptNo = useAppStore((s) => s.testAttemptNo);

  const effectiveUserId = lastResultUserId ?? userId;

  const [data, setData] = useState<ResultApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!effectiveUserId) {
      navigate("/");
      return;
    }
    (async () => {
      try {
        const res = await fetchResult(effectiveUserId);
        setData(res);
      } catch {
        setError(t(useAppStore.getState().lang, "error_generic"));
      }
    })();
  }, [effectiveUserId, navigate]);

  const topClusterId = data?.breakdown.top_cluster_id ?? null;
  const topSpecs = data?.breakdown.top_group_ids ?? [];

  const cluster = useMemo(() => {
    if (!topClusterId) return { title: "—", desc: "" };
    return clusterCopy(lang, topClusterId);
  }, [topClusterId, lang]);

  const specTitles = useMemo(() => topSpecs.map((id) => specCopy(lang, id)), [topSpecs, lang]);

  const clusterTitle = useMemo(() => {
    const fromApi = data?.top_cluster_name?.trim();
    if (lang === "tg") {
      if (fromApi) return apiClusterName(lang, fromApi);
      return cluster.title;
    }
    return fromApi || cluster.title;
  }, [data?.top_cluster_name, lang, cluster.title]);

  const specLine = useMemo(() => {
    if (data?.specializations?.length) {
      return data.specializations.map((s) => apiSpecName(lang, s.name)).join(" · ");
    }
    return specTitles.length ? specTitles.join(" · ") : "—";
  }, [data, specTitles, lang]);

  const klimovProfile = useMemo(() => clusterKlimovProfile(topClusterId), [topClusterId]);

  const samplePrograms = useMemo(() => {
    if (topClusterId !== 4) return [];
    return [...SAMPLE_PROGRAMS_HISTORY].sort((a, b) => {
      const rank = (p: (typeof SAMPLE_PROGRAMS_HISTORY)[0]) => (p.tuitionTj.includes("пулакӣ") ? 0 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return b.seats - a.seats;
    });
  }, [topClusterId]);

  if (!effectiveUserId) return null;

  if (error) {
    return (
      <div className="page-shell max-w-xl py-16 text-center">
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/90 p-8 shadow-soft ring-1 ring-slate-200/70 dark:ring-slate-700/80">
          <div className="text-sm font-semibold text-ink-900 dark:text-slate-50">{error}</div>
          <button type="button" className="mt-6 text-sm font-extrabold text-indigo-700" onClick={() => navigate("/test")}>
            {t(lang, "back")}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-shell py-10">
        <div className="flex items-center justify-between">
          <div className="h-10 w-44 animate-pulse rounded-2xl bg-white/70 ring-1 ring-slate-200/70 dark:ring-slate-700/80" />
          <LanguageSwitcher />
        </div>
        <div className="mt-10 h-64 animate-pulse rounded-3xl bg-white/70 ring-1 ring-slate-200/70 dark:ring-slate-700/80" />
      </div>
    );
  }

  return (
    <div className="page-shell flex min-h-full flex-col pb-16 pt-6 sm:pt-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-extrabold text-ink-900 dark:text-slate-50 sm:text-sm">{t(lang, "result_title")}</div>
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => window.print()}
            className="rounded-2xl bg-white/80 dark:bg-slate-900/90 px-4 py-2.5 text-sm font-extrabold text-ink-900 dark:text-slate-50 shadow-card ring-1 ring-slate-200/70 dark:ring-slate-700/80 sm:py-2 sm:text-xs"
          >
            {t(lang, "result_print")}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `kasbnoma-result-${data.session_id.slice(0, 8)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-2xl bg-white/80 dark:bg-slate-900/90 px-4 py-2.5 text-sm font-extrabold text-ink-900 dark:text-slate-50 shadow-card ring-1 ring-slate-200/70 dark:ring-slate-700/80 sm:py-2 sm:text-xs"
          >
            {t(lang, "result_save")}
          </motion.button>
          <LanguageSwitcher />
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <ResultCard
            highlight
            badge={t(lang, "result_badge_top")}
            title={clusterTitle}
            subtitle={cluster.desc}
            icon={<span aria-hidden="true">🎯</span>}
            delay={0.05}
          />
          {klimovProfile ? (
            <ResultCard
              badge={t(lang, "result_klimov_block")}
              title={lang === "tg" ? klimovProfile.klimovTypeTg : klimovProfile.klimovTypeRu}
              subtitle={lang === "tg" ? klimovProfile.bodyTg : klimovProfile.bodyRu}
              icon={<span aria-hidden="true">📋</span>}
              delay={0.08}
            />
          ) : null}
        </div>
        <div className="grid gap-4">
          <ResultCard
            badge={t(lang, "result_badge_detail")}
            title={t(lang, "result_specs")}
            subtitle={specLine}
            icon={<span aria-hidden="true">🧭</span>}
            delay={0.12}
          />
          <ResultCard
            badge={t(lang, "result_badge_meta")}
            title={t(lang, "brand")}
            subtitle={t(lang, "result_attempt_blurb").replace("{n}", String(Math.max(1, testAttemptNo)))}
            icon={<span aria-hidden="true">✅</span>}
            delay={0.18}
          />
        </div>
      </motion.div>

      {samplePrograms.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-10 rounded-3xl bg-white/85 dark:bg-slate-900/92 p-5 shadow-soft ring-1 ring-slate-200/70 dark:ring-slate-700/80 sm:p-8"
        >
          <h2 className="text-base font-extrabold text-ink-900 dark:text-slate-50">{t(lang, "result_sample_programs_title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-slate-300">{t(lang, "result_sample_programs_note")}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-extrabold uppercase tracking-wide text-ink-500 dark:text-slate-400">
                  <th className="py-2 pr-2">{t(lang, "result_col_id")}</th>
                  <th className="py-2 pr-2">{t(lang, "result_col_program")}</th>
                  <th className="py-2 pr-2">{t(lang, "result_col_location")}</th>
                  <th className="py-2 pr-2">{t(lang, "result_col_form")}</th>
                  <th className="py-2 pr-2">{t(lang, "result_col_tuition")}</th>
                  <th className="py-2 pr-2">{t(lang, "result_col_lang")}</th>
                  <th className="py-2">{t(lang, "result_col_seats")}</th>
                </tr>
              </thead>
              <tbody>
                {samplePrograms.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-700/80 align-top text-ink-800 dark:text-slate-200">
                    <td className="py-3 pr-2 font-mono text-[11px] text-ink-500 dark:text-slate-400">{row.id}</td>
                    <td className="py-3 pr-2">
                      <div className="font-semibold text-ink-900 dark:text-slate-50">{row.specialtyCodeNameTj}</div>
                      <div className="mt-1 text-[11px] leading-snug text-ink-600 dark:text-slate-300">{row.institutionTj}</div>
                    </td>
                    <td className="py-3 pr-2 whitespace-nowrap">{row.locationTj}</td>
                    <td className="py-3 pr-2 whitespace-nowrap">{row.formTj}</td>
                    <td className="py-3 pr-2 whitespace-nowrap">{row.tuitionTj}</td>
                    <td className="py-3 pr-2 whitespace-nowrap">{row.languageTj}</td>
                    <td className="py-3 font-semibold">{row.seats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      ) : null}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-10 flex flex-col gap-3 sm:flex-row">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate("/universities")}
          className="inline-flex min-h-[3rem] flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3.5 text-base font-extrabold text-white shadow-soft sm:min-h-0 sm:py-3 sm:text-sm"
        >
          {t(lang, "result_cta_unis")}
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => {
            clearSession();
            navigate("/");
          }}
          className="inline-flex min-h-[3rem] flex-1 items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-900/90 px-5 py-3.5 text-base font-extrabold text-ink-900 dark:text-slate-50 shadow-card ring-1 ring-slate-200/70 dark:ring-slate-700/80 sm:min-h-0 sm:py-3 sm:text-sm"
        >
          {t(lang, "result_cta_retake")}
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate("/feedback")}
          className="inline-flex min-h-[3rem] flex-1 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-base font-extrabold text-white shadow-soft sm:min-h-0 sm:py-3 sm:text-sm"
        >
          {t(lang, "result_cta_feedback")}
        </motion.button>
      </motion.div>
    </div>
  );
}
