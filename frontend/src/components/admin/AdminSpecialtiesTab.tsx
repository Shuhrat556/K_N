import { FormEvent, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  clearAllSpecialties,
  deleteSpecialty,
  fetchSpecialties,
  fetchSpecialtyFilters,
  previewSpecialtyExcel,
  uploadSpecialtyExcel,
} from "../../api/kasbnoma";
import type { Specialty, SpecialtyFilters } from "../../api/types";

type Props = {
  inputClass: string;
  sectionCardClass: string;
};

export function AdminSpecialtiesTab({ inputClass, sectionCardClass }: Props) {
  const [data, setData] = useState<Specialty[]>([]);
  const [filters, setFilters] = useState<SpecialtyFilters | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [studyTypeFilter, setStudyTypeFilter] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Upload states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: unknown[][] } | null>(null);
  const [importing, setImporting] = useState(false);

  const loadFilters = async () => {
    try {
      const f = await fetchSpecialtyFilters();
      setFilters(f);
    } catch (err) {
      console.error("Failed to load filters:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
      };
      if (search) params.search = search;
      if (locationFilter) params.location = locationFilter;
      if (languageFilter) params.language = languageFilter;
      if (studyTypeFilter) params.studyType = studyTypeFilter;
      if (universityFilter) params.university = universityFilter;
      
      const result = await fetchSpecialties(params);
      setData(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFilters();
  }, []);

  useEffect(() => {
    void loadData();
  }, [page, locationFilter, languageFilter, studyTypeFilter, universityFilter]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadData();
  };

  const handlePreview = async (e: FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      setError("Select a file first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const preview = await previewSpecialtyExcel(excelFile);
      setPreviewData({ headers: preview.headers, rows: preview.rows });
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      setError("Select a file first");
      return;
    }
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await uploadSpecialtyExcel(excelFile);
      setMessage(
        `Import complete: ${result.parsed} rows parsed, ${result.inserted} inserted, ${result.skipped} skipped`
      );
      setExcelFile(null);
      setPreviewData(null);
      await loadData();
      await loadFilters();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this specialty?")) return;
    setError(null);
    setMessage(null);
    try {
      await deleteSpecialty(id);
      setMessage("Specialty deleted");
      await loadData();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Delete failed");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear ALL specialties? This cannot be undone!")) return;
    setError(null);
    setMessage(null);
    try {
      await clearAllSpecialties();
      setMessage("All specialties cleared");
      await loadData();
      await loadFilters();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Clear failed");
    }
  };

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.university.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <>
      <div className={`mt-6 ${sectionCardClass}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-ink-900 dark:text-slate-50">Ихтисосҳо (Excel Import)</h2>
            <p className="mt-1 text-sm font-medium text-ink-600 dark:text-slate-300">
              Upload Excel files with university specialties data. Supports multiple sheets.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-extrabold text-ink-900 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-2xl bg-rose-100 px-4 py-2 text-xs font-extrabold text-rose-800 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900/50"
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
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
      </div>

      {/* Upload Form */}
      <form onSubmit={previewData ? handleImport : handlePreview} className={`mt-6 ${sectionCardClass}`}>
        <h3 className="text-base font-extrabold text-ink-900 dark:text-slate-50">Upload Excel File</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="file"
            accept=".xlsx"
            className={inputClass}
            onChange={(e) => {
              setExcelFile(e.target.files?.[0] ?? null);
              setPreviewData(null);
            }}
          />
          <button
            type="submit"
            disabled={!excelFile || loading || importing}
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
          >
            {previewData ? (importing ? "Importing..." : "Confirm Import") : (loading ? "Preview..." : "Preview")}
          </button>
        </div>
        
        {/* Preview Table */}
        {previewData && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  {previewData.headers.map((h, i) => (
                    <th key={i} className="px-2 py-1 text-left font-bold text-ink-600 dark:text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                    {row.map((cell, j) => (
                      <td key={j} className="px-2 py-1 text-ink-800 dark:text-slate-200">
                        {String(cell ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-ink-500 dark:text-slate-400">
              Showing 5 of {previewData.rows.length} rows. Click "Confirm Import" to proceed.
            </p>
          </div>
        )}
      </form>

      {/* Filters */}
      <div className={`mt-6 ${sectionCardClass}`}>
        <h3 className="text-base font-extrabold text-ink-900 dark:text-slate-50">Filters</h3>
        <form onSubmit={handleSearch} className="mt-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              className={inputClass}
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={inputClass}
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Locations</option>
              {filters?.locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select
              className={inputClass}
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Languages</option>
              {filters?.languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select
              className={inputClass}
              value={studyTypeFilter}
              onChange={(e) => {
                setStudyTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Types</option>
              {filters?.studyTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              className={inputClass}
              value={universityFilter}
              onChange={(e) => {
                setUniversityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Universities</option>
              {filters?.universities.slice(0, 50).map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white dark:bg-indigo-600"
          >
            Search
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className={`mt-6 ${sectionCardClass}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-base font-extrabold text-ink-900 dark:text-slate-50">
            Data ({total} records)
          </h3>
        </div>
        
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">ID</th>
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">Code</th>
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">Name</th>
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">University</th>
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">Location</th>
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">Form</th>
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">Type</th>
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">Price</th>
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">Lang</th>
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">Quota</th>
                <th className="px-2 py-2 text-left font-bold text-ink-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-2 py-4 text-center text-ink-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-2 py-4 text-center text-ink-500">
                    No data. Upload an Excel file to get started.
                  </td>
                </tr>
              ) : (
                filteredData.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="px-2 py-2 text-ink-800 dark:text-slate-200">{s.id}</td>
                    <td className="px-2 py-2 text-ink-800 dark:text-slate-200 font-mono">{s.code}</td>
                    <td className="px-2 py-2 text-ink-800 dark:text-slate-200 max-w-xs truncate">{s.name}</td>
                    <td className="px-2 py-2 text-ink-800 dark:text-slate-200 max-w-xs truncate">{s.university}</td>
                    <td className="px-2 py-2 text-ink-800 dark:text-slate-200">{s.location || "-"}</td>
                    <td className="px-2 py-2 text-ink-800 dark:text-slate-200">{s.studyForm || "-"}</td>
                    <td className="px-2 py-2 text-ink-800 dark:text-slate-200">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                        s.studyType === "free" 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                      }`}>
                        {s.studyType || "-"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-ink-800 dark:text-slate-200">{s.price || "-"}</td>
                    <td className="px-2 py-2 text-ink-800 dark:text-slate-200">{s.language || "-"}</td>
                    <td className="px-2 py-2 text-ink-800 dark:text-slate-200">{s.quota || "-"}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-ink-500 dark:text-slate-400">
              Page {page} of {totalPages} ({total} total)
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-2xl bg-white/90 px-3 py-1 text-xs font-extrabold text-ink-900 ring-1 ring-slate-200/80 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-2xl bg-white/90 px-3 py-1 text-xs font-extrabold text-ink-900 ring-1 ring-slate-200/80 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}