import { FormEvent, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { fetchAdminAcademicSpecialtiesPage, importAcademicExcel } from "../../api/kasbnoma";
import type { AcademicSpecialty, AcademicSpecialtyPage } from "../../api/types";

type Props = {
  inputClass: string;
  sectionCardClass: string;
};

type SpecialtyFilters = {
  q: string;
  university: string;
  makon: string;
  group_code: string;
  study_mode: string;
  tuition: string;
  language: string;
  degree: string;
};

const EMPTY_FILTERS: SpecialtyFilters = {
  q: "",
  university: "",
  makon: "",
  group_code: "",
  study_mode: "",
  tuition: "",
  language: "",
  degree: "",
};

function compactFilters(filters: SpecialtyFilters) {
  return Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value),
  ) as Partial<SpecialtyFilters>;
}

export function AdminSpecialtiesOnlyTab({ inputClass, sectionCardClass }: Props) {
  const [filters, setFilters] = useState<SpecialtyFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<SpecialtyFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [data, setData] = useState<AcademicSpecialtyPage>({
    data: [],
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = data.data;
  const totalPages = Math.max(data.total_pages, 1);
  const firstRow = data.total ? (page - 1) * limit + 1 : 0;
  const lastRow = Math.min(page * limit, data.total);

  const activeFilterCount = useMemo(
    () => Object.values(appliedFilters).filter((value) => value.trim()).length,
    [appliedFilters],
  );

  const loadPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminAcademicSpecialtiesPage({
        ...compactFilters(appliedFilters),
        page,
        limit,
      });
      setData(result);
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось загрузить список");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, [appliedFilters, page, limit]);

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const onImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      setError("Выберите Excel-файл.");
      return;
    }

    setImporting(true);
    setError(null);
    setMessage("Файл загружается. Большие файлы могут обрабатываться несколько минут.");
    try {
      const result = await importAcademicExcel(excelFile, clearExisting);
      setExcelFile(null);
      setPage(1);
      setMessage(
        `Импорт завершён: обработано ${result.rows_seen}, загружено ${result.rows_imported}, пропущено ${result.skipped_rows}.`,
      );
      await loadPage();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Ошибка импорта Excel");
    } finally {
      setImporting(false);
    }
  };

  const setFilter = (key: keyof SpecialtyFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <form onSubmit={onImport} className={`mt-6 ${sectionCardClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-ink-900 dark:text-slate-50">Загрузка Excel</h2>
            <p className="mt-1 text-sm font-medium text-ink-600 dark:text-slate-300">
              Один ряд Excel сохраняется как одна запись. Большие файлы загружаются полностью, без ограничения по количеству строк.
            </p>
          </div>
          <div className="rounded-2xl bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-900">
            {importing ? "Идёт загрузка..." : "Готово к импорту"}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            type="file"
            accept=".xlsx"
            className={inputClass}
            disabled={importing}
            onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
          />
          <label className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/90 px-4 py-2 text-xs font-bold text-ink-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600">
            <input type="checkbox" checked={clearExisting} disabled={importing} onChange={(e) => setClearExisting(e.target.checked)} />
            Очистить перед загрузкой
          </label>
          <button
            type="submit"
            disabled={importing}
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
          >
            {importing ? "Загружается..." : "Загрузить в базу"}
          </button>
        </div>
      </form>

      <div className={`mt-6 ${sectionCardClass}`}>
        <form onSubmit={applyFilters}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-ink-900 dark:text-slate-50">Ихтисосы</h2>
              <p className="mt-1 text-sm font-medium text-ink-600 dark:text-slate-300">
                Один общий список с фильтрами сверху и пагинацией снизу.
              </p>
            </div>
            <div className="text-sm font-bold text-ink-600 dark:text-slate-300">
              {data.total.toLocaleString()} записей {activeFilterCount ? `· фильтров: ${activeFilterCount}` : ""}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input className={inputClass} placeholder="Поиск по названию, коду, вузу" value={filters.q} onChange={(e) => setFilter("q", e.target.value)} />
            <input className={inputClass} placeholder="Университет" value={filters.university} onChange={(e) => setFilter("university", e.target.value)} />
            <input className={inputClass} placeholder="Город / район" value={filters.makon} onChange={(e) => setFilter("makon", e.target.value)} />
            <input className={inputClass} placeholder="Группа / лист" value={filters.group_code} onChange={(e) => setFilter("group_code", e.target.value)} />
            <input className={inputClass} placeholder="Форма обучения" value={filters.study_mode} onChange={(e) => setFilter("study_mode", e.target.value)} />
            <input className={inputClass} placeholder="Оплата" value={filters.tuition} onChange={(e) => setFilter("tuition", e.target.value)} />
            <input className={inputClass} placeholder="Язык" value={filters.language} onChange={(e) => setFilter("language", e.target.value)} />
            <input className={inputClass} placeholder="Степень" value={filters.degree} onChange={(e) => setFilter("degree", e.target.value)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-extrabold text-white dark:bg-indigo-600">
              Применить фильтр
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-2xl bg-white px-5 py-2.5 text-xs font-extrabold text-ink-900 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
            >
              Сбросить
            </button>
            <button
              type="button"
              onClick={() => void loadPage()}
              className="rounded-2xl bg-white px-5 py-2.5 text-xs font-extrabold text-ink-900 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
            >
              {loading ? "Обновление..." : "Обновить"}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {message ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800/50">
              {message}
            </span>
          ) : null}
          {error ? (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900/50">
              {error}
            </span>
          ) : null}
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl ring-1 ring-slate-200/80 dark:ring-slate-700">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Код</th>
                <th className="px-4 py-3">Ихтисос</th>
                <th className="px-4 py-3">Университет</th>
                <th className="px-4 py-3">Группа</th>
                <th className="px-4 py-3">Место</th>
                <th className="px-4 py-3">Форма</th>
                <th className="px-4 py-3">Язык</th>
                <th className="px-4 py-3">Квота</th>
                <th className="px-4 py-3">Оплата</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <SpecialtyRow key={row.id} row={row} />
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {loading ? "Загрузка..." : "Записи не найдены."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm font-semibold text-ink-600 dark:text-slate-300">
            Показано {firstRow.toLocaleString()}-{lastRow.toLocaleString()} из {data.total.toLocaleString()}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={`${inputClass} w-auto`}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[25, 50, 100, 200, 500].map((value) => (
                <option key={value} value={value}>
                  {value} / страница
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-2xl bg-white px-4 py-2 text-xs font-extrabold text-ink-900 ring-1 ring-slate-200/80 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
            >
              Назад
            </button>
            <span className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-2xl bg-white px-4 py-2 text-xs font-extrabold text-ink-900 ring-1 ring-slate-200/80 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function SpecialtyRow({ row }: { row: AcademicSpecialty }) {
  const place = [row.region, row.city, row.district].filter(Boolean).join(" / ") || "—";
  return (
    <tr className="border-t border-slate-100 text-slate-800 dark:border-slate-800 dark:text-slate-200">
      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{row.id}</td>
      <td className="px-4 py-3 font-mono text-xs">{row.code ?? "—"}</td>
      <td className="px-4 py-3 font-bold">{row.name}</td>
      <td className="px-4 py-3">{row.university_name}</td>
      <td className="px-4 py-3">
        {row.faculty_code ? `${row.faculty_code} · ` : ""}
        {row.faculty_name}
      </td>
      <td className="px-4 py-3">{place}</td>
      <td className="px-4 py-3">{row.study_mode ?? "—"}</td>
      <td className="px-4 py-3">{row.language ?? "—"}</td>
      <td className="px-4 py-3">{row.admission_quota ?? "—"}</td>
      <td className="px-4 py-3">{row.tuition ?? row.price ?? "—"}</td>
    </tr>
  );
}
