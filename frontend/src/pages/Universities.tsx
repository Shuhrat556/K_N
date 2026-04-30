import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { fetchAcademicSpecialties } from "../api/kasbnoma";
import type { AcademicSpecialty } from "../api/types";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

const MAX_PICK = 12;
/** Agar noyob qiymatlar shundan kam bo‘lsa — select ishlatiladi */
const SELECT_CAP = 48;

type FilterState = {
  faculty_id: string;
  university_id: string;
  makon: string;
  code_name: string;
  study_mode: string;
  tuition: string;
  language: string;
};

const emptyFilters: FilterState = {
  faculty_id: "",
  university_id: "",
  makon: "",
  code_name: "",
  study_mode: "",
  tuition: "",
  language: "",
};

function buildQueryParams(f: FilterState): Parameters<typeof fetchAcademicSpecialties>[0] {
  const params: NonNullable<Parameters<typeof fetchAcademicSpecialties>[0]> = {};
  if (f.faculty_id.trim()) {
    const n = Number(f.faculty_id.trim());
    if (Number.isFinite(n) && n > 0) params.faculty_id = n;
  }
  if (f.university_id.trim()) {
    const n = Number(f.university_id.trim());
    if (Number.isFinite(n) && n > 0) params.university_id = n;
  }
  if (f.makon.trim()) params.makon = f.makon.trim();
  if (f.code_name.trim()) params.code_name = f.code_name.trim();
  if (f.study_mode.trim()) params.study_mode = f.study_mode.trim();
  if (f.tuition.trim()) params.tuition = f.tuition.trim();
  if (f.language.trim()) params.language = f.language.trim();
  return params;
}

function uniqSorted(values: (string | null | undefined)[]): string[] {
  const s = new Set<string>();
  for (const v of values) {
    const x = (v ?? "").trim();
    if (x) s.add(x);
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

function SmartFilter({
  label,
  value,
  onChange,
  options,
  placeholder,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  emptyLabel: string;
}) {
  const inputCls =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 shadow-sm outline-none ring-slate-200 placeholder:text-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
  const useSelect = options.length > 0 && options.length <= SELECT_CAP;
  return (
    <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
      {label}
      {useSelect ? (
        <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{emptyLabel}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o.length > 72 ? `${o.slice(0, 72)}…` : o}
            </option>
          ))}
        </select>
      ) : (
        <input type="text" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? "…"} />
      )}
    </label>
  );
}

export function Universities() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);

  const [catalog, setCatalog] = useState<AcademicSpecialty[]>([]);
  const [rows, setRows] = useState<AcademicSpecialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [hint, setHint] = useState<string | null>(null);

  const paramsSerialized = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingCatalog(true);
      try {
        const data = await fetchAcademicSpecialties({});
        if (!cancelled) setCatalog(data);
      } catch {
        if (!cancelled) setCatalog([]);
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(() => setHint(null), 2800);
    return () => window.clearTimeout(id);
  }, [hint]);

  const facultyOptions = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of catalog) {
      const label = `${r.faculty_code ? `${r.faculty_code} — ` : ""}${r.faculty_name}`.trim();
      if (!m.has(r.faculty_id)) m.set(r.faculty_id, label);
    }
    return [...m.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, label]) => ({ id, label }));
  }, [catalog]);

  const universityOptions = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of catalog) {
      if (!m.has(r.university_id)) m.set(r.university_id, r.university_name);
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [catalog]);

  const cityOptions = useMemo(() => uniqSorted(catalog.map((r) => r.city)), [catalog]);
  const langOptions = useMemo(() => uniqSorted(catalog.map((r) => r.language)), [catalog]);
  const modeOptions = useMemo(() => uniqSorted(catalog.map((r) => r.study_mode)), [catalog]);
  const tuitionOptions = useMemo(() => uniqSorted(catalog.map((r) => r.tuition)), [catalog]);

  const codeSuggest = useMemo(() => {
    const q = filters.code_name.trim().toLowerCase();
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of catalog) {
      const line = `${r.code ? `${r.code} — ` : ""}${r.name}`.trim();
      if (!line || seen.has(line)) continue;
      if (
        !q ||
        line.toLowerCase().includes(q) ||
        (r.code ?? "").toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
      ) {
        seen.add(line);
        out.push(line);
        if (out.length >= 60) break;
      }
    }
    return out;
  }, [catalog, filters.code_name]);

  const lockedFacultyId = useMemo(() => {
    if (!selectedIds.length) return null;
    const id = selectedIds[0];
    const row = catalog.find((r) => r.id === id) ?? rows.find((r) => r.id === id);
    return row?.faculty_id ?? null;
  }, [selectedIds, catalog, rows]);

  const setField = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleRow = (row: AcademicSpecialty) => {
    const { id, faculty_id: fid } = row;
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PICK) return prev;
      if (prev.length > 0) {
        const firstRow = catalog.find((r) => r.id === prev[0]) ?? rows.find((r) => r.id === prev[0]);
        const lock = firstRow?.faculty_id;
        if (lock !== undefined && fid !== lock) {
          queueMicrotask(() => setHint(t(lang, "uni_pick_other_faculty")));
          return prev;
        }
      }
      return [...prev, id];
    });
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setSelectedIds([]);
  };

  const inputCls =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 shadow-sm outline-none ring-slate-200 placeholder:text-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

  const allLabel = t(lang, "all");

  return (
    <div className="page-shell flex min-h-full flex-col pb-16 pt-6 sm:pt-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-base font-extrabold text-ink-900 dark:text-slate-50 sm:text-sm">{t(lang, "universities_title")}</div>
          <p className="mt-2 text-[11px] font-semibold text-ink-600 dark:text-slate-400">{t(lang, "uni_pick_faculty_rule")}</p>
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
            {t(lang, "uni_faculty")}
            <select
              className={inputCls}
              value={filters.faculty_id}
              onChange={(e) => setField("faculty_id", e.target.value)}
              disabled={loadingCatalog}
            >
              <option value="">{allLabel}</option>
              {facultyOptions.map(({ id, label }) => (
                <option key={id} value={String(id)}>
                  {label.length > 90 ? `${label.slice(0, 90)}…` : label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
            {t(lang, "uni_col_institution")}
            <select
              className={inputCls}
              value={filters.university_id}
              onChange={(e) => setField("university_id", e.target.value)}
              disabled={loadingCatalog}
            >
              <option value="">{allLabel}</option>
              {universityOptions.map(([id, name]) => (
                <option key={id} value={String(id)}>
                  {name.length > 90 ? `${name.slice(0, 90)}…` : name}
                </option>
              ))}
            </select>
          </label>
          <SmartFilter
            label={t(lang, "uni_col_makon")}
            value={filters.makon}
            onChange={(v) => setField("makon", v)}
            options={cityOptions}
            emptyLabel={allLabel}
          />
          <label className="text-[10px] font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">
            {t(lang, "uni_col_code_name")}
            <input
              type="text"
              className={inputCls}
              list="uni-code-name-hints"
              value={filters.code_name}
              onChange={(e) => setField("code_name", e.target.value)}
              placeholder="…"
              autoComplete="off"
            />
            <datalist id="uni-code-name-hints">
              {codeSuggest.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <SmartFilter
            label={t(lang, "uni_col_shakl")}
            value={filters.study_mode}
            onChange={(v) => setField("study_mode", v)}
            options={modeOptions}
            emptyLabel={allLabel}
          />
          <SmartFilter
            label={t(lang, "uni_col_namud")}
            value={filters.tuition}
            onChange={(v) => setField("tuition", v)}
            options={tuitionOptions}
            emptyLabel={allLabel}
          />
          <SmartFilter
            label={t(lang, "uni_col_lang")}
            value={filters.language}
            onChange={(v) => setField("language", v)}
            options={langOptions}
            emptyLabel={allLabel}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full bg-slate-200/90 px-4 py-2 text-xs font-extrabold text-slate-900 ring-1 ring-slate-300/80 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600"
          >
            {t(lang, "uni_filter_reset")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
          >
            {t(lang, "uni_clear_pick")}
          </button>
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
            {t(lang, "uni_pick_selected").replace("{n}", String(selectedIds.length))}
          </span>
        </div>
        {hint ? (
          <p className="mt-3 text-xs font-semibold text-amber-800 dark:text-amber-200">{hint}</p>
        ) : null}
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
        <table className="w-full min-w-[900px] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/95 text-[10px] font-black uppercase tracking-wide text-ink-500 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-400 sm:text-[11px]">
              <th className="sticky left-0 z-10 w-10 whitespace-nowrap bg-slate-50/95 px-2 py-3 dark:bg-slate-800/90" />
              <th className="whitespace-nowrap px-3 py-3">{t(lang, "uni_faculty")}</th>
              <th className="min-w-[180px] px-3 py-3">{t(lang, "uni_col_code_name")}</th>
              <th className="min-w-[200px] px-3 py-3">{t(lang, "uni_col_institution")}</th>
              <th className="min-w-[140px] px-3 py-3">{t(lang, "uni_col_makon")}</th>
              <th className="whitespace-nowrap px-3 py-3">{t(lang, "uni_col_shakl")}</th>
              <th className="min-w-[120px] px-3 py-3">{t(lang, "uni_col_namud")}</th>
              <th className="whitespace-nowrap px-3 py-3">{t(lang, "uni_col_lang")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const checked = selectedIds.includes(r.id);
              const disabledPick =
                !checked &&
                (selectedIds.length >= MAX_PICK || (lockedFacultyId !== null && r.faculty_id !== lockedFacultyId));
              return (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.25 }}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 dark:border-slate-700 dark:odd:bg-slate-900 dark:even:bg-slate-800/40"
                >
                  <td className="sticky left-0 z-[1] bg-inherit px-2 py-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabledPick}
                      onChange={() => toggleRow(r)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="select"
                    />
                  </td>
                  <td className="max-w-[200px] px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                    {r.faculty_code ? `${r.faculty_code} — ` : ""}
                    {r.faculty_name}
                  </td>
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
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && !error && rows.length === 0 ? (
        <div className="mt-6 text-sm font-medium text-ink-500 dark:text-slate-400">Маълумот нест.</div>
      ) : null}
    </div>
  );
}
