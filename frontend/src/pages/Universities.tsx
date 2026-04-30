import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { fetchAcademicFaculties, fetchAcademicSpecialties, fetchAcademicUniversities, fetchAcademicSpecialtiesPage } from "../api/kasbnoma";
import type { AcademicSpecialty, AcademicFaculty, AcademicUniversity } from "../api/types";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

const MAX_PICK = 12;
const UZ_MAKON = "ҶТ";
const RU_MAKON = "РТ";

const inputFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const inputBase =
  "w-full rounded-xl border border-slate-600/60 bg-slate-800/50 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner transition hover:border-slate-500 " +
  inputFocus;

const selectBase =
  "w-full appearance-none rounded-xl border border-slate-600/60 bg-slate-800/50 px-3.5 py-2.5 pr-10 text-sm text-slate-100 shadow-inner transition hover:border-slate-500 " +
  inputFocus;

function normalize(str: string): string {
  return str.trim().toLowerCase();
}

function IconFilter(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

function IconMenu(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function IconClose(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronDown(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGraduation(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3L2 8l10 5 10-5-10-5z" strokeLinejoin="round" />
      <path d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" strokeLinecap="round" />
    </svg>
  );
}

type FiltersState = {
  faculty_id: string;
  university_id: string;
  makon: string;
  code_name: string;
  language: string;
  study_mode: string;
  tuition: string;
};

function countActiveFilters(f: FiltersState): number {
  let n = 0;
  if (f.faculty_id) n++;
  if (f.university_id) n++;
  if (f.makon) n++;
  if (f.code_name.trim()) n++;
  if (f.language) n++;
  if (f.study_mode) n++;
  if (f.tuition) n++;
  return n;
}

function uniqSorted(values: (string | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const s = v?.trim();
    if (s) set.add(s);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
}

function formatLocation(row: AcademicSpecialty): string {
  const parts = [row.region, row.city].filter((x): x is string => Boolean(x?.trim()));
  return parts.length ? parts.join(" · ") : "—";
}

export function Universities() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);

  const [universities, setUniversities] = useState<AcademicUniversity[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [faculties, setFaculties] = useState<AcademicFaculty[]>([]);
  const [langOptions, setLangOptions] = useState<string[]>([]);
  const [modeOptions, setModeOptions] = useState<string[]>([]);
  const [tuitionOptions, setTuitionOptions] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<AcademicSpecialty[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    faculty_id: "",
    university_id: "",
    makon: "",
    code_name: "",
    language: "",
    study_mode: "",
    tuition: "",
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) navigate(-1);
    else navigate("/");
  }, [navigate]);
  const selectedFacultyForPick = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const first = specialties.find((s) => s.id === selectedIds[0]);
    return first?.faculty_id ?? null;
  }, [selectedIds, specialties]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingUniversities(true);
      try {
        const [unis, facs, page1] = await Promise.all([
          fetchAcademicUniversities(),
          fetchAcademicFaculties(),
          fetchAcademicSpecialtiesPage({ page: 1, limit: 500 }),
        ]);
        if (!cancelled) {
          setUniversities(unis);
          setFaculties(facs);
          setLangOptions(uniqSorted(page1.data.map((r) => r.language)));
          setModeOptions(uniqSorted(page1.data.map((r) => r.study_mode)));
          setTuitionOptions(uniqSorted(page1.data.map((r) => r.tuition)));
        }
      } catch {
        if (!cancelled) {
          setUniversities([]);
          setFaculties([]);
        }
      } finally {
        if (!cancelled) setLoadingUniversities(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const facultyOptions = useMemo(() => faculties, [faculties]);
  const universityOptions = useMemo(() => universities, [universities]);

  const codeSuggest = useMemo(() => {
    const q = normalize(filters.code_name);
    if (!q || q.length < 2) return [] as string[];
    const out = new Set<string>();
    for (const s of specialties) {
      const label = `${s.code ?? ""} — ${s.name}`.trim();
      if (normalize(label).includes(q)) out.add(label);
      if (out.size >= 15) break;
    }
    return Array.from(out).slice(0, 12);
  }, [filters.code_name, specialties]);

  const refreshSpecialties = useCallback(async () => {
    setLoadingSpecialties(true);
    try {
      const rows = await fetchAcademicSpecialties({
        faculty_id: filters.faculty_id ? Number(filters.faculty_id) : undefined,
        university_id: filters.university_id ? Number(filters.university_id) : undefined,
        makon: filters.makon || undefined,
        code_name: filters.code_name.trim() || undefined,
        language: filters.language || undefined,
        study_mode: filters.study_mode || undefined,
        tuition: filters.tuition || undefined,
      });
      setSpecialties(rows);
    } catch {
      setSpecialties([]);
    } finally {
      setLoadingSpecialties(false);
    }
  }, [filters]);

  useEffect(() => {
    void refreshSpecialties();
  }, [refreshSpecialties]);

  const pickFacultyName = useMemo(() => {
    if (!selectedFacultyForPick) return "";
    const f = faculties.find((x) => x.id === selectedFacultyForPick);
    return f?.name ?? "";
  }, [faculties, selectedFacultyForPick]);

  const setField = (key: keyof FiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      faculty_id: "",
      university_id: "",
      makon: "",
      code_name: "",
      language: "",
      study_mode: "",
      tuition: "",
    });
  };

  const clearUniversityFilter = () => setField("university_id", "");

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  useEffect(() => {
    const open = filterSheetOpen || mobileMenuOpen;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filterSheetOpen, mobileMenuOpen]);

  const toggleRow = (row: AcademicSpecialty) => {
    const id = row.id;
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PICK) return prev;
      if (prev.length === 0) return [id];
      const baseFaculty = selectedFacultyForPick;
      if (baseFaculty != null && row.faculty_id !== baseFaculty) return prev;
      return [...prev, id];
    });
  };

  const clearPick = () => setSelectedIds([]);

  const invalidPickHint =
    selectedFacultyForPick != null && specialties.some((s) => selectedIds.includes(s.id) && s.faculty_id !== selectedFacultyForPick);

  const universityLabel = (u: AcademicUniversity) => u.name.trim();

  const FilterFields = ({
    className,
    showApplyButton,
  }: {
    className?: string;
    showApplyButton?: boolean;
  }) => (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t(lang, "uni_faculty")}</span>
          <div className="relative">
            <select
              className={selectBase}
              value={filters.faculty_id}
              onChange={(e) => setField("faculty_id", e.target.value)}
              disabled={loadingUniversities}
            >
              <option value="">{t(lang, "all")}</option>
              {facultyOptions.map((f: AcademicFaculty) => (
                <option key={f.id} value={String(f.id)}>
                  {f.name}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
        </label>
        <label className="block space-y-1.5 sm:col-span-2 xl:col-span-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t(lang, "uni_col_code_name")}</span>
          <input
            className={inputBase}
            list="uni-code-suggest"
            value={filters.code_name}
            onChange={(e) => setField("code_name", e.target.value)}
            placeholder={t(lang, "filter_place")}
          />
          <datalist id="uni-code-suggest">
            {codeSuggest.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t(lang, "filter_location")}</span>
          <div className="relative">
            <select
              className={selectBase}
              value={filters.makon}
              onChange={(e) => setField("makon", e.target.value)}
              disabled={loadingUniversities}
            >
              <option value="">{t(lang, "all")}</option>
              <option value={UZ_MAKON}>{UZ_MAKON}</option>
              <option value={RU_MAKON}>{RU_MAKON}</option>
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t(lang, "filter_type")}</span>
          <div className="relative">
            <select
              className={selectBase}
              value={filters.study_mode}
              onChange={(e) => setField("study_mode", e.target.value)}
              disabled={loadingUniversities}
            >
              <option value="">{t(lang, "all")}</option>
              {modeOptions.map((m: string) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t(lang, "filter_lang")}</span>
          <div className="relative">
            <select
              className={selectBase}
              value={filters.language}
              onChange={(e) => setField("language", e.target.value)}
              disabled={loadingUniversities}
            >
              <option value="">{t(lang, "all")}</option>
              {langOptions.map((l: string) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t(lang, "filter_price")}</span>
          <div className="relative">
            <select
              className={selectBase}
              value={filters.tuition}
              onChange={(e) => setField("tuition", e.target.value)}
              disabled={loadingUniversities}
            >
              <option value="">{t(lang, "all")}</option>
              {tuitionOptions.map((p: string) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={resetFilters}
          className={"rounded-xl border border-slate-600/70 bg-slate-800/40 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 " + inputFocus}
        >
          {t(lang, "uni_filter_reset")}
        </button>
        {showApplyButton && (
          <button
            type="button"
            onClick={() => setFilterSheetOpen(false)}
            className={"rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500 " + inputFocus}
          >
            {t(lang, "uni_filters_apply")}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className={"mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8 " + (selectedIds.length > 0 ? "pb-28 md:pb-8" : "")}>
        {/* Desktop header */}
        <div className="mb-6 hidden items-start justify-between gap-4 lg:flex">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t(lang, "universities_title")}</h1>
            <p className="text-sm text-slate-400">{t(lang, "uni_pick_faculty_rule")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={goBack}
              className={"rounded-xl border border-slate-600/70 bg-slate-800/40 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 " + inputFocus}
            >
              ← {t(lang, "back")}
            </button>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile sticky bar */}
        <div
          className={
            "sticky top-0 z-40 -mx-4 mb-4 flex items-center gap-2 border-b border-slate-700/60 bg-slate-950/90 px-4 py-3 backdrop-blur-md sm:-mx-5 sm:px-5 lg:hidden"
          }
        >
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-white">{t(lang, "universities_title")}</h1>
          </div>
          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className={"relative flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-slate-600/70 bg-slate-800/60 px-3 text-slate-100 transition active:scale-[0.98] " + inputFocus}
            aria-label={t(lang, "uni_filters_title")}
          >
            <IconFilter className="h-5 w-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={"flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-slate-600/70 bg-slate-800/60 px-3 text-slate-100 transition active:scale-[0.98] " + inputFocus}
            aria-label={t(lang, "uni_mobile_menu")}
          >
            <IconMenu className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 lg:hidden">
          <p className="text-xs leading-relaxed text-slate-400">{t(lang, "uni_pick_faculty_rule")}</p>
        </div>

        {/* Universities strip */}
        <section className="mb-8 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-950/95 p-4 shadow-xl shadow-black/20 sm:p-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                  <IconGraduation className="h-5 w-5" />
                </span>
                {t(lang, "uni_universities_block")}
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-400 sm:text-sm">{t(lang, "uni_universities_sub")}</p>
            </div>
            {filters.university_id ? (
              <button
                type="button"
                onClick={clearUniversityFilter}
                className={"shrink-0 rounded-lg border border-slate-600/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 " + inputFocus}
              >
                {t(lang, "uni_universities_clear")}
              </button>
            ) : null}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loadingUniversities ? (
              <p className="text-sm text-slate-500">{t(lang, "uni_loading_catalog")}</p>
            ) : (
              universityOptions.map((u) => {
                const idStr = String(u.id);
                const active = filters.university_id === idStr;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setField("university_id", active ? "" : idStr)}
                    className={
                      "shrink-0 rounded-2xl border px-4 py-2.5 text-left text-sm font-medium transition " +
                      (active
                        ? "border-indigo-400/70 bg-indigo-600/25 text-white shadow-lg shadow-indigo-900/30 ring-1 ring-indigo-400/40"
                        : "border-slate-600/50 bg-slate-800/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70")
                    }
                  >
                    <span className="line-clamp-2">{universityLabel(u)}</span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Desktop filters */}
        <section className="mb-6 hidden rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 shadow-inner lg:block">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">{t(lang, "uni_filters_title")}</h2>
          <FilterFields />
        </section>

        {/* Pick status */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300">
            {t(lang, "uni_pick_selected").replace("{n}", String(selectedIds.length))}
            {pickFacultyName ? (
              <span className="block text-xs text-slate-500 sm:mt-0 sm:inline sm:before:content-['_\2014_']">
                {pickFacultyName}
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={clearPick}
            disabled={selectedIds.length === 0}
            className={"self-start rounded-xl border border-slate-600/70 bg-slate-800/40 px-4 py-2 text-sm text-slate-200 transition enabled:hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40 " + inputFocus}
          >
            {t(lang, "uni_clear_pick")}
          </button>
        </div>
        {invalidPickHint ? (
          <p className="mb-3 text-sm text-amber-300/90">{t(lang, "uni_pick_other_faculty")}</p>
        ) : null}

        {/* Results */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white sm:text-xl">{t(lang, "uni_specialties_title")}</h2>
          <span className="rounded-full border border-slate-600/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
            {t(lang, "uni_results_short").replace("{n}", String(specialties.length))}
          </span>
        </div>

        {loadingSpecialties ? (
          <p className="text-sm text-slate-400">{t(lang, "uni_loading_catalog")}</p>
        ) : (
          <>
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/30 shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/80 bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-semibold">{t(lang, "uni_col_code_name")}</th>
                      <th className="px-4 py-3 font-semibold">{t(lang, "uni_col_institution")}</th>
                      <th className="px-4 py-3 font-semibold">{t(lang, "uni_col_makon")}</th>
                      <th className="px-4 py-3 font-semibold">{t(lang, "uni_col_shakl")}</th>
                      <th className="px-4 py-3 font-semibold">{t(lang, "uni_col_namud")}</th>
                      <th className="px-4 py-3 font-semibold">{t(lang, "uni_col_lang")}</th>
                      <th className="w-14 px-2 py-3 text-center font-semibold">✓</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specialties.map((row) => {
                      const checked = selectedIds.includes(row.id);
                      const disabled =
                        !checked &&
                        (selectedIds.length >= MAX_PICK ||
                          (selectedFacultyForPick != null && row.faculty_id !== selectedFacultyForPick));
                      return (
                        <tr
                          key={row.id}
                          className={
                            "border-b border-slate-800/80 transition " +
                            (checked ? "bg-indigo-950/40" : "hover:bg-slate-800/30")
                          }
                        >
                          <td className="px-4 py-3 align-top text-slate-100">
                            <div className="font-mono text-xs text-indigo-200/90">{row.code}</div>
                            <div className="mt-0.5 font-medium">{row.name}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-slate-300">{row.university_name}</td>
                          <td className="px-4 py-3 align-top text-slate-300">{formatLocation(row)}</td>
                          <td className="px-4 py-3 align-top text-slate-300">{row.study_mode ?? "—"}</td>
                          <td className="px-4 py-3 align-top text-slate-300">{row.degree ?? "—"}</td>
                          <td className="px-4 py-3 align-top text-slate-300">{row.language ?? "—"}</td>
                          <td className="px-2 py-3 text-center align-middle">
                            <input
                              type="checkbox"
                              className="h-5 w-5 rounded border-slate-500 bg-slate-800 accent-indigo-500"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => toggleRow(row)}
                              aria-label={row.name}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {specialties.map((row) => {
                const checked = selectedIds.includes(row.id);
                const disabled =
                  !checked &&
                  (selectedIds.length >= MAX_PICK ||
                    (selectedFacultyForPick != null && row.faculty_id !== selectedFacultyForPick));
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => !disabled && toggleRow(row)}
                    disabled={disabled}
                    className={
                      "w-full rounded-2xl border p-4 text-left transition " +
                      (checked
                        ? "border-indigo-400/60 bg-indigo-950/35 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-400/30"
                        : "border-slate-700/60 bg-slate-900/50 hover:border-slate-600 active:scale-[0.99]") +
                      (disabled ? " cursor-not-allowed opacity-50" : "")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs text-indigo-300/90">{row.code}</div>
                        <div className="mt-1 text-base font-semibold leading-snug text-white">{row.name}</div>
                        <div className="mt-2 space-y-1 text-xs text-slate-400">
                          <div>{row.university_name}</div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-slate-300">{formatLocation(row)}</span>
                            <span className="rounded-md bg-slate-800/80 px-2 py-0.5">{row.study_mode ?? "—"}</span>
                            <span className="rounded-md bg-slate-800/80 px-2 py-0.5">{row.degree ?? "—"}</span>
                            <span className="rounded-md bg-slate-800/80 px-2 py-0.5">{row.language ?? "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border " +
                          (checked
                            ? "border-indigo-400 bg-indigo-600/40 text-white"
                            : "border-slate-600 bg-slate-800/80 text-slate-400")
                        }
                        aria-hidden
                      >
                        {checked ? (
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span className="text-lg font-light">+</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {selectedIds.length > 0 ? (
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-700/80 bg-slate-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <span className="truncate text-sm text-slate-200">
                {t(lang, "uni_pick_selected").replace("{n}", String(selectedIds.length))}
              </span>
              <button
                type="button"
                onClick={clearPick}
                className={"shrink-0 rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 " + inputFocus}
              >
                {t(lang, "uni_clear_pick")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Filter bottom sheet (mobile) */}
      <AnimatePresence>
        {filterSheetOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              aria-label="Close"
              onClick={() => setFilterSheetOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="filter-sheet-title"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[51] max-h-[85vh] overflow-hidden rounded-t-2xl border border-slate-700/80 bg-slate-950 shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h2 id="filter-sheet-title" className="text-lg font-semibold text-white">
                  {t(lang, "uni_filters_title")}
                </h2>
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(false)}
                  className={"flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white " + inputFocus}
                  aria-label={t(lang, "uni_filters_apply")}
                >
                  <IconClose className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[calc(85vh-56px)] overflow-y-auto px-4 pb-6 pt-4">
                <FilterFields showApplyButton />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-[51] flex h-full w-[min(100%,320px)] flex-col border-l border-slate-700/80 bg-slate-950 shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <span className="font-semibold text-white">{t(lang, "uni_mobile_menu")}</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className={"flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 " + inputFocus}
                  aria-label="Close"
                >
                  <IconClose className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                <button
                  type="button"
                  onClick={() => {
                    goBack();
                    setMobileMenuOpen(false);
                  }}
                  className={"w-full rounded-xl border border-slate-600/70 bg-slate-800/40 py-3 text-left text-sm font-medium text-slate-100 " + inputFocus}
                >
                  ← {t(lang, "back")}
                </button>
                <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
                  <LanguageSwitcher />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearPick();
                    setMobileMenuOpen(false);
                  }}
                  disabled={selectedIds.length === 0}
                  className={"w-full rounded-xl border border-slate-600/70 py-3 text-sm font-medium text-slate-200 disabled:opacity-40 " + inputFocus}
                >
                  {t(lang, "uni_clear_pick")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setMobileMenuOpen(false);
                  }}
                  className={"w-full rounded-xl border border-amber-600/40 bg-amber-950/30 py-3 text-sm font-medium text-amber-100 " + inputFocus}
                >
                  {t(lang, "uni_filter_reset")}
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
