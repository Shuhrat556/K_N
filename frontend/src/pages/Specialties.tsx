import { motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { fetchAcademicSpecialtiesPage, fetchAcademicSpecialtyStats } from "../api/kasbnoma";
import type { AcademicSpecialty, AcademicSpecialtyPage, AcademicSpecialtyStats } from "../api/types";
import { BrandLogo } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

type FilterState = {
  q: string;
  university: string;
  makon: string;
  group_code: string;
  study_mode: string;
  tuition: string;
  language: string;
  degree: string;
};

const emptyFilters: FilterState = {
  q: "",
  university: "",
  makon: "",
  group_code: "",
  study_mode: "",
  tuition: "",
  language: "",
  degree: "",
};

const emptyStats: AcademicSpecialtyStats = {
  total_specialties: 0,
  universities_count: 0,
  faculties_count: 0,
  languages_count: 0,
  study_modes_count: 0,
  free_count: 0,
  paid_count: 0,
};

function compactFilters(filters: FilterState) {
  return Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value),
  ) as Partial<FilterState>;
}

function copy(lang: "ru" | "tg") {
  if (lang === "tg") {
    return {
      title: "Каталоги ихтисосҳо",
      subtitle: "Ихтисосҳоро бо филтрҳо ҷустуҷӯ кунед, муассиса ва шартҳои таҳсилро муқоиса намоед.",
      badge: "Базаи ихтисосҳо",
      search: "Ҷустуҷӯ аз рӯи ном, рамз ё донишгоҳ",
      university: "Донишгоҳ",
      place: "Шаҳр / ноҳия",
      group: "Гурӯҳ / самт",
      mode: "Шакли таҳсил",
      tuition: "Пардохт",
      language: "Забон",
      degree: "Дараҷа",
      apply: "Ҷустуҷӯ",
      reset: "Тоза кардан",
      selected: "Ихтисоси интихобшуда",
      choose: "Интихоб",
      chosen: "Интихоб шуд",
      empty: "Маълумот ёфт нашуд.",
      loading: "Бор шуда истодааст...",
      total: "Ҳамаи ихтисосҳо",
      universities: "Муассисаҳо",
      faculties: "Гурӯҳҳо",
      langs: "Забонҳо",
      forms: "Шаклҳо",
      freePaid: "Ройгон / пулакӣ",
      found: "ёфт шуд",
      page: "саҳифа",
      back: "Қафо",
      next: "Ба пеш",
      detailsHint: "Барои дидани тафсилот карточкаро интихоб кунед.",
      cta: "Гузаштан ба тест",
    };
  }
  return {
    title: "Каталог специальностей",
    subtitle: "Ищите специальности по фильтрам, сравнивайте вузы, условия обучения и выбирайте подходящий вариант.",
    badge: "База ихтисосов",
    search: "Поиск по названию, коду или вузу",
    university: "Университет",
    place: "Город / район",
    group: "Группа / направление",
    mode: "Форма обучения",
    tuition: "Оплата",
    language: "Язык",
    degree: "Степень",
    apply: "Найти",
    reset: "Сбросить",
    selected: "Выбранная специальность",
    choose: "Выбрать",
    chosen: "Выбрано",
    empty: "Записи не найдены.",
    loading: "Загрузка...",
    total: "Всего ихтисосов",
    universities: "Учебные заведения",
    faculties: "Группы",
    langs: "Языки",
    forms: "Формы",
    freePaid: "Бесплатно / платно",
    found: "найдено",
    page: "страница",
    back: "Назад",
    next: "Вперёд",
    detailsHint: "Выберите карточку, чтобы увидеть подробности.",
    cta: "Пройти тест",
  };
}

export function Specialties() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);
  const c = copy(lang);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [data, setData] = useState<AcademicSpecialtyPage>({
    data: [],
    page: 1,
    limit: 12,
    total: 0,
    total_pages: 0,
  });
  const [stats, setStats] = useState<AcademicSpecialtyStats>(emptyStats);
  const [selected, setSelected] = useState<AcademicSpecialty | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(data.total_pages, 1);
  const activeFilterCount = useMemo(
    () => Object.values(appliedFilters).filter((value) => value.trim()).length,
    [appliedFilters],
  );

  const statCards = [
    { label: c.total, value: stats.total_specialties, tone: "from-indigo-500 to-sky-500" },
    { label: c.universities, value: stats.universities_count, tone: "from-emerald-500 to-teal-500" },
    { label: c.faculties, value: stats.faculties_count, tone: "from-fuchsia-500 to-pink-500" },
    { label: c.langs, value: stats.languages_count, tone: "from-amber-500 to-orange-500" },
    { label: c.forms, value: stats.study_modes_count, tone: "from-cyan-500 to-blue-500" },
    {
      label: c.freePaid,
      value: `${stats.free_count.toLocaleString()} / ${stats.paid_count.toLocaleString()}`,
      tone: "from-lime-500 to-emerald-500",
    },
  ];

  const loadPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAcademicSpecialtiesPage({
        ...compactFilters(appliedFilters),
        page,
        limit,
      });
      setData(result);
      setSelected((current) => {
        if (!current) return result.data[0] ?? null;
        return result.data.find((row) => row.id === current.id) ?? current;
      });
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : t(lang, "error_generic"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, [appliedFilters, page, limit, lang]);

  useEffect(() => {
    void (async () => {
      try {
        setStats(await fetchAcademicSpecialtyStats());
      } catch {
        // The list remains usable even if aggregate stats are temporarily unavailable.
      }
    })();
  }, []);

  const setFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
    setSelected(null);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),rgba(241,245,249,0.96)_36%,rgba(248,250,252,1)_100%)] text-ink-900 dark:bg-slate-950 dark:text-slate-100">
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        <div className="overflow-hidden rounded-[2.25rem] bg-slate-950 shadow-soft ring-1 ring-slate-900/10">
          <div className="relative px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.55fr)] lg:items-end">
              <div>
                <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-sky-100 ring-1 ring-white/15">
                  {c.badge}
                </div>
                <h1 className="mt-5 max-w-3xl font-display text-4xl font-black tracking-tight sm:text-5xl">{c.title}</h1>
                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-200 sm:text-base">{c.subtitle}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    to="/"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 shadow-card transition hover:-translate-y-0.5"
                  >
                    {t(lang, "nav_home")}
                  </Link>
                  <Link
                    to={{ pathname: "/", hash: "start-test" }}
                    className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:-translate-y-0.5"
                  >
                    {c.cta}
                  </Link>
                </div>
              </div>
              <SelectedPanel selected={selected} labels={c} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((card) => (
            <div key={card.label} className="overflow-hidden rounded-[1.7rem] bg-white shadow-card ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
              <div className={`h-2 bg-gradient-to-r ${card.tone}`} />
              <div className="p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{card.label}</div>
                <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                  {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-soft ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
          <form onSubmit={applyFilters} className="bg-gradient-to-r from-slate-50 via-indigo-50 to-sky-50 p-5 dark:from-slate-900 dark:via-indigo-950/30 dark:to-sky-950/20 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                  {data.total.toLocaleString()} {c.found}
                </div>
                <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{c.title}</h2>
              </div>
              <div className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
                {activeFilterCount ? `${activeFilterCount} filter` : t(lang, "all")}
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FilterInput label={c.search} value={filters.q} onChange={(value) => setFilter("q", value)} wide />
              <FilterInput label={c.university} value={filters.university} onChange={(value) => setFilter("university", value)} />
              <FilterInput label={c.place} value={filters.makon} onChange={(value) => setFilter("makon", value)} />
              <FilterInput label={c.group} value={filters.group_code} onChange={(value) => setFilter("group_code", value)} />
              <FilterInput label={c.mode} value={filters.study_mode} onChange={(value) => setFilter("study_mode", value)} />
              <FilterInput label={c.tuition} value={filters.tuition} onChange={(value) => setFilter("tuition", value)} />
              <FilterInput label={c.language} value={filters.language} onChange={(value) => setFilter("language", value)} />
              <FilterInput label={c.degree} value={filters.degree} onChange={(value) => setFilter("degree", value)} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="submit" className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-card">
                {c.apply}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
              >
                {c.reset}
              </button>
            </div>
          </form>

          {error ? (
            <div className="m-5 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-bold text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900/50">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.data.map((row, index) => (
              <SpecialtyCard
                key={row.id}
                row={row}
                selected={selected?.id === row.id}
                labels={c}
                delay={Math.min(index * 0.025, 0.25)}
                onSelect={() => setSelected(row)}
              />
            ))}
          </div>

          {!loading && !error && data.data.length === 0 ? (
            <div className="px-5 pb-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">{c.empty}</div>
          ) : null}
          {loading ? (
            <div className="px-5 pb-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">{c.loading}</div>
          ) : null}

          <div className="flex flex-col gap-3 bg-slate-50 px-5 py-5 dark:bg-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {c.page} {page} / {totalPages}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[6, 12, 24, 48].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-2xl bg-white px-4 py-2 text-xs font-extrabold text-slate-900 ring-1 ring-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
              >
                {c.back}
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="rounded-2xl bg-white px-4 py-2 text-xs font-extrabold text-slate-900 ring-1 ring-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
              >
                {c.next}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  return (
    <label className={`text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 ${wide ? "md:col-span-2" : ""}`}>
      {label}
      <input
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-950/50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="..."
      />
    </label>
  );
}

function SelectedPanel({
  selected,
  labels,
}: {
  selected: AcademicSpecialty | null;
  labels: ReturnType<typeof copy>;
}) {
  return (
    <div className="rounded-[1.75rem] bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-sky-100">{labels.selected}</div>
      {selected ? (
        <div className="mt-3">
          <div className="text-xl font-black leading-tight text-white">{selected.name}</div>
          <div className="mt-2 text-sm font-semibold text-slate-200">{selected.university_name}</div>
          <div className="mt-4 grid gap-2 text-xs font-bold text-slate-200">
            <div>{selected.faculty_code ? `${selected.faculty_code} · ` : ""}{selected.faculty_name}</div>
            <div>{[selected.region, selected.city, selected.district].filter(Boolean).join(" / ") || "—"}</div>
            <div>{selected.study_mode ?? "—"} · {selected.language ?? "—"}</div>
            <div>{selected.tuition ?? selected.price ?? "—"} · {selected.admission_quota ?? "—"}</div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{labels.detailsHint}</p>
      )}
    </div>
  );
}

function SpecialtyCard({
  row,
  selected,
  labels,
  delay,
  onSelect,
}: {
  row: AcademicSpecialty;
  selected: boolean;
  labels: ReturnType<typeof copy>;
  delay: number;
  onSelect: () => void;
}) {
  const place = [row.region, row.city, row.district].filter(Boolean).join(" / ") || "—";
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      className={[
        "group flex flex-col rounded-[1.65rem] bg-white p-5 shadow-card ring-1 transition hover:-translate-y-1 hover:shadow-soft dark:bg-slate-900",
        selected ? "ring-2 ring-indigo-400" : "ring-slate-200/80 dark:ring-slate-700",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-2xl bg-indigo-100 px-3 py-1.5 font-mono text-xs font-black text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-200">
          {row.code ?? `ID ${row.id}`}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200">
          {row.tuition ?? "—"}
        </span>
      </div>
      <h3 className="mt-4 line-clamp-3 text-lg font-black leading-snug text-slate-950 dark:text-white">{row.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{row.university_name}</p>
      <div className="mt-4 grid gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
        <div>{row.faculty_code ? `${row.faculty_code} · ` : ""}{row.faculty_name}</div>
        <div>{place}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-black text-sky-700 dark:bg-sky-950/70 dark:text-sky-200">
          {row.study_mode ?? "—"}
        </span>
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-700 dark:bg-violet-950/70 dark:text-violet-200">
          {row.language ?? "—"}
        </span>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-950/70 dark:text-amber-200">
          {row.admission_quota ?? "—"}
        </span>
      </div>
      <button
        type="button"
        onClick={onSelect}
        className={[
          "mt-5 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition",
          selected
            ? "bg-indigo-600 text-white shadow-card"
            : "bg-slate-100 text-slate-900 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-slate-100",
        ].join(" ")}
      >
        {selected ? labels.chosen : labels.choose}
      </button>
    </motion.article>
  );
}
