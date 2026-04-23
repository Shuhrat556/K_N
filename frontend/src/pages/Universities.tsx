import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { fetchAcademicSpecialties } from "../api/kasbnoma";
import type { AcademicSpecialty } from "../api/types";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

type FilterState = {
  specialty_id: string;
  samt: string;
  university: string;
  makon: string;
  code_name: string;
  study_mode: string;
  tuition: string;
  language: string;
  admission_quota: string;
};

const emptyFilters: FilterState = {
  specialty_id: "",
  samt: "",
  university: "",
  makon: "",
  code_name: "",
  study_mode: "",
  tuition: "",
  language: "",
  admission_quota: "",
};

function buildQueryParams(f: FilterState): Parameters<typeof fetchAcademicSpecialties>[0] {
  const params: NonNullable<Parameters<typeof fetchAcademicSpecialties>[0]> = {};
  if (f.specialty_id.trim()) {
    const n = Number(f.specialty_id.trim());
    if (Number.isFinite(n) && n > 0) params.specialty_id = n;
  }
  if (f.samt.trim()) params.samt = f.samt.trim();
  if (f.university.trim()) params.university = f.university.trim();
  if (f.makon.trim()) params.makon = f.makon.trim();
  if (f.code_name.trim()) params.code_name = f.code_name.trim();
  if (f.study_mode.trim()) params.study_mode = f.study_mode.trim();
  if (f.tuition.trim()) params.tuition = f.tuition.trim();
  if (f.language.trim()) params.language = f.language.trim();
  if (f.admission_quota.trim()) params.admission_quota = f.admission_quota.trim();
  return params;
}

export function Universities() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);

  const [rows, setRows] = useState<AcademicSpecialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  const paramsSerialized = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    let cancelled = false;
    const f = JSON.parse(paramsSerialized) as FilterState;
    const tmr = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchAcademicSpecialties(buildQueryParams(f));
          if (!cancelled) setRows(data);
        } catch (err) {
          if (!cancelled) {
            setError(
              isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : t(lang, "error_generic"),
            );
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 380);
    return () => {
      cancelled = true;
      window.clearTimeout(tmr);
    };
  }, [paramsSerialized, lang]);

  const inputCls =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 shadow-sm outline-none ring-slate-200 placeholder:text-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

  const setField = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="page-shell flex min-h-full flex-col pb-16 pt-6 sm:pt-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-base font-extrabold text-ink-900 dark:text-slate-50 sm:text-sm">{t(lang, "universities_title")}</div>
          <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-slate-300 sm:text-xs">{t(lang, "universities_sub")}</div>
          <p className="mt-2 max-w-3xl text-xs font-medium text-ink-500 dark:text-slate-400">{t(lang, "uni_filters_hint")}</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate(-1)}
            className="rounded-2xl bg-white/80 px-4 py-2 text-xs font-extrabold text-ink-900 shadow-card ring-1 ring-slate-200/70 dark:bg-slate-900/90 dark:text-slate-50 dark:ring-slate-700/80"
          >
            {t(lang, "back")}
          </motion.button>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="mt-6 rounded-3xl bg-white/80 p-5 shadow-soft ring-1 ring-slate-200/70 dark:bg-slate-900/90 dark:ring-slate-700/80">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
            {t(lang, "uni_col_id")}
            <input type="text" inputMode="numeric" className={inputCls} value={filters.specialty_id} onChange={(e) => setField("specialty_id", e.target.value)} placeholder="…" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
            {t(lang, "uni_col_samt")}
            <input type="text" className={inputCls} value={filters.samt} onChange={(e) => setField("samt", e.target.value)} placeholder="…" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
            {t(lang, "uni_col_code_name")}
            <input type="text" className={inputCls} value={filters.code_name} onChange={(e) => setField("code_name", e.target.value)} placeholder="…" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
            {t(lang, "uni_col_institution")}
            <input type="text" className={inputCls} value={filters.university} onChange={(e) => setField("university", e.target.value)} placeholder="…" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
            {t(lang, "uni_col_makon")}
            <input type="text" className={inputCls} value={filters.makon} onChange={(e) => setField("makon", e.target.value)} placeholder="…" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
            {t(lang, "uni_col_shakl")}
            <input type="text" className={inputCls} value={filters.study_mode} onChange={(e) => setField("study_mode", e.target.value)} placeholder="…" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
            {t(lang, "uni_col_namud")}
            <input type="text" className={inputCls} value={filters.tuition} onChange={(e) => setField("tuition", e.target.value)} placeholder="…" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
            {t(lang, "uni_col_lang")}
            <input type="text" className={inputCls} value={filters.language} onChange={(e) => setField("language", e.target.value)} placeholder="…" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400 sm:col-span-2 lg:col-span-3 xl:col-span-1">
            {t(lang, "uni_col_naqsha")}
            <input type="text" className={inputCls} value={filters.admission_quota} onChange={(e) => setField("admission_quota", e.target.value)} placeholder="…" />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilters(emptyFilters)}
            className="rounded-full bg-slate-200/90 px-4 py-2 text-xs font-extrabold text-slate-900 ring-1 ring-slate-300/80 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600"
          >
            {t(lang, "uni_filter_reset")}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="mt-8 text-sm font-medium text-ink-500 dark:text-slate-400">Загрузка…</div>
      ) : null}
      {error ? (
        <div className="mt-8 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-bold text-rose-800 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900/50">
          {error}
        </div>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200/80 bg-white/90 shadow-soft ring-1 ring-slate-100 dark:border-slate-600 dark:bg-slate-900/80 dark:ring-slate-600/80">
        <table className="w-full min-w-[1100px] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/95 text-[10px] font-black uppercase tracking-wide text-ink-500 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-400 sm:text-[11px]">
              <th className="sticky left-0 z-10 whitespace-nowrap bg-slate-50/95 px-3 py-3 dark:bg-slate-800/90">{t(lang, "uni_col_id")}</th>
              <th className="whitespace-nowrap px-3 py-3">{t(lang, "uni_col_samt")}</th>
              <th className="min-w-[180px] px-3 py-3">{t(lang, "uni_col_code_name")}</th>
              <th className="min-w-[200px] px-3 py-3">{t(lang, "uni_col_institution")}</th>
              <th className="min-w-[140px] px-3 py-3">{t(lang, "uni_col_makon")}</th>
              <th className="whitespace-nowrap px-3 py-3">{t(lang, "uni_col_shakl")}</th>
              <th className="min-w-[120px] px-3 py-3">{t(lang, "uni_col_namud")}</th>
              <th className="whitespace-nowrap px-3 py-3">{t(lang, "uni_col_lang")}</th>
              <th className="min-w-[100px] px-3 py-3">{t(lang, "uni_col_naqsha")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.25 }}
                className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 dark:border-slate-700 dark:odd:bg-slate-900 dark:even:bg-slate-800/40"
              >
                <td className="sticky left-0 z-[1] whitespace-nowrap bg-inherit px-3 py-2.5 font-mono font-bold tabular-nums text-slate-700 dark:text-slate-200">{r.id}</td>
                <td className="max-w-[160px] px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100">{r.faculty_name}</td>
                <td className="px-3 py-2.5 font-semibold text-indigo-800 dark:text-indigo-300">
                  {r.code ? `${r.code} — ` : ""}
                  {r.name}
                </td>
                <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">{r.university_name}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700 dark:text-slate-300">
                  {[r.city, r.district].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="max-w-[140px] px-3 py-2.5 text-slate-700 dark:text-slate-300">{r.study_mode ?? "—"}</td>
                <td className="max-w-[160px] px-3 py-2.5 text-slate-700 dark:text-slate-300">{r.tuition ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700 dark:text-slate-300">{r.language ?? "—"}</td>
                <td className="max-w-[120px] px-3 py-2.5 text-slate-700 dark:text-slate-300">{r.admission_quota ?? "—"}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && !error && rows.length === 0 ? (
        <div className="mt-6 text-sm font-medium text-ink-500 dark:text-slate-400">Маълумот нест.</div>
      ) : null}
    </div>
  );
}
