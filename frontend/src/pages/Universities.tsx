import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { fetchAcademicSpecialties } from "../api/kasbnoma";
import type { AcademicSpecialty } from "../api/types";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

export function Universities() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);

  const [rows, setRows] = useState<AcademicSpecialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [city, setCity] = useState("all");
  const [study, setStudy] = useState("all");
  const [langF, setLangF] = useState("all");
  const [tuition, setTuition] = useState("all");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAcademicSpecialties();
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cities = useMemo(() => ["all", ...Array.from(new Set(rows.map((r) => (r.city ?? "").trim()).values())).filter(Boolean)], [rows]);
  const studyModes = useMemo(() => ["all", ...Array.from(new Set(rows.map((r) => (r.study_mode ?? "").trim()).values())).filter(Boolean)], [rows]);
  const languages = useMemo(() => ["all", ...Array.from(new Set(rows.map((r) => (r.language ?? "").trim()).values())).filter(Boolean)], [rows]);
  const tuitions = useMemo(() => ["all", ...Array.from(new Set(rows.map((r) => (r.tuition ?? "").trim()).values())).filter(Boolean)], [rows]);

  const filtered = useMemo(() => {
    const data = rows.filter((r) => {
      if (city !== "all" && (r.city ?? "").trim() !== city) return false;
      if (study !== "all" && (r.study_mode ?? "").trim() !== study) return false;
      if (langF !== "all" && (r.language ?? "").trim() !== langF) return false;
      if (tuition !== "all" && (r.tuition ?? "").trim() !== tuition) return false;
      return true;
    });
    return [...data].sort((a, b) => a.university_name.localeCompare(b.university_name));
  }, [rows, city, study, langF, tuition]);

  const chip = <T extends string>(value: T, current: T, set: (v: T) => void, label: string) => {
    const active = value === current;
    return (
      <motion.button
        type="button"
        onClick={() => set(value)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.985 }}
        className={[
          "rounded-full px-3 py-2 text-sm font-extrabold ring-1 sm:py-1 sm:text-xs",
          active
            ? "bg-slate-900 text-white ring-slate-900 dark:bg-sky-600 dark:ring-sky-500"
            : "bg-white/80 text-ink-800 ring-slate-200/70 dark:bg-slate-800/90 dark:text-slate-200 dark:ring-slate-600/80",
        ].join(" ")}
      >
        {label}
      </motion.button>
    );
  };

  return (
    <div className="page-shell flex min-h-full flex-col pb-16 pt-6 sm:pt-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-base font-extrabold text-ink-900 dark:text-slate-50 sm:text-sm">{t(lang, "universities_title")}</div>
          <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-slate-300 sm:text-xs">{t(lang, "universities_sub")}</div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate(-1)}
            className="rounded-2xl bg-white/80 dark:bg-slate-900/90 px-4 py-2 text-xs font-extrabold text-ink-900 dark:text-slate-50 shadow-card ring-1 ring-slate-200/70 dark:ring-slate-700/80"
          >
            {t(lang, "back")}
          </motion.button>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="mt-8 rounded-3xl bg-white/80 dark:bg-slate-900/90 p-6 shadow-soft ring-1 ring-slate-200/70 dark:ring-slate-700/80">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <div className="text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">{t(lang, "filter_place")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {cities.map((v) => chip(v, city, setCity, v === "all" ? t(lang, "all") : v))}
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">{t(lang, "filter_type")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {studyModes.map((v) => chip(v, study, setStudy, v === "all" ? t(lang, "all") : v))}
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">{t(lang, "filter_lang")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {languages.map((v) => chip(v, langF, setLangF, v === "all" ? t(lang, "all") : v))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">{t(lang, "filter_price")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {tuitions.map((v) => chip(v, tuition, setTuition, v === "all" ? t(lang, "all") : v))}
            </div>
          </div>
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

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {filtered.map((r, i) => (
          <motion.article
            key={r.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft ring-1 ring-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:ring-slate-600/80"
          >
            <div>
              <div className="text-lg font-extrabold text-slate-950 dark:text-slate-50">{r.university_name}</div>
              <div className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t(lang, "uni_faculty")}: {r.faculty_name}
              </div>
              <div className="mt-1 text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {r.code ? `${r.code} — ` : ""}
                {r.name}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="rounded-full bg-slate-200/90 px-2 py-1 text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                  {r.city ?? "—"} · {r.district ?? "—"}
                </span>
                <span className="rounded-full bg-slate-200/90 px-2 py-1 text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                  {r.study_mode ?? "—"}
                </span>
                <span className="rounded-full bg-slate-200/90 px-2 py-1 text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                  {r.language ?? "—"}
                </span>
                <span className="rounded-full bg-slate-200/90 px-2 py-1 text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                  {r.tuition ?? "—"}
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
