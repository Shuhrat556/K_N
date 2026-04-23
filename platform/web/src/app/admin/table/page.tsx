"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Search } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { FilterPanel, type FilterValues } from "@/components/filter-panel";
import { ApiError } from "@/lib/api";
import {
  exportUrl,
  fetchFilters,
  fetchSpecializations,
  type FiltersResponse,
  type ListResponse,
} from "@/lib/specializations-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptyFilters: FilterValues = {
  city: "",
  institution: "",
  category: "",
  education_form: "",
  education_type: "",
  language: "",
};

export default function AdminTablePage() {
  const [options, setOptions] = useState<FiltersResponse | null>(null);
  const [filters, setFilters] = useState<FilterValues>(emptyFilters);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [list, setList] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void (async () => {
      try {
        const f = await fetchFilters();
        setOptions(f);
      } catch {
        setOptions(null);
      }
    })();
  }, []);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit));
    if (debouncedSearch.trim()) p.set("search", debouncedSearch.trim());
    if (filters.city) p.set("city", filters.city);
    if (filters.institution) p.set("institution", filters.institution);
    if (filters.category) p.set("category", filters.category);
    if (filters.education_form) p.set("education_form", filters.education_form);
    if (filters.education_type) p.set("education_type", filters.education_type);
    if (filters.language) p.set("language", filters.language);
    return p;
  }, [page, limit, debouncedSearch, filters]);

  const paramsKey = params.toString();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSpecializations(new URLSearchParams(paramsKey));
        if (!cancelled) setList(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paramsKey]);

  const patchFilters = useCallback((patch: Partial<FilterValues>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(emptyFilters);
    setSearch("");
    setPage(1);
  }, []);

  const onExport = () => {
    const p = new URLSearchParams(paramsKey);
    p.delete("page");
    p.delete("limit");
    window.open(exportUrl(p), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Специальности</CardTitle>
            <CardDescription>Фильтры, поиск и пагинация (данные с сервера).</CardDescription>
          </div>
          <Button type="button" variant="outline" className="gap-2" onClick={onExport}>
            <Download className="h-4 w-4" /> Экспорт Excel
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Label htmlFor="search">Поиск по коду/названию или муассиса</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="search"
                className="pl-10"
                placeholder="Начните вводить…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <FilterPanel filters={filters} options={options} onChange={patchFilters} onReset={resetFilters} />

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</div>
          ) : null}

          <DataTable rows={list?.data ?? []} loading={loading} />

          {list && list.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500">
                Стр. {list.page} из {list.totalPages} · всего {list.total}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Назад
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= list.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
