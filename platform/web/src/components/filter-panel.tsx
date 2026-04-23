"use client";

import type { FiltersResponse } from "@/lib/specializations-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type FilterValues = {
  city: string;
  institution: string;
  category: string;
  education_form: string;
  education_type: string;
  language: string;
};

type Props = {
  filters: FilterValues;
  options: FiltersResponse | null;
  onChange: (patch: Partial<FilterValues>) => void;
  onReset: () => void;
  className?: string;
};

const sel =
  "mt-1 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900";

export function FilterPanel({ filters, options, onChange, onReset, className }: Props) {
  const opt = options;

  return (
    <div className={cn("grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2 lg:grid-cols-3", className)}>
      <div>
        <Label htmlFor="city">Город</Label>
        <select id="city" className={sel} value={filters.city} onChange={(e) => onChange({ city: e.target.value })}>
          <option value="">Все</option>
          {(opt?.cities ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="institution">Муассиса</Label>
        <select id="institution" className={sel} value={filters.institution} onChange={(e) => onChange({ institution: e.target.value })}>
          <option value="">Все</option>
          {(opt?.institutions ?? []).slice(0, 500).map((c) => (
            <option key={c} value={c}>
              {c.length > 80 ? `${c.slice(0, 80)}…` : c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="category">Категория (лист)</Label>
        <select id="category" className={sel} value={filters.category} onChange={(e) => onChange({ category: e.target.value })}>
          <option value="">Все</option>
          {(opt?.categories ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="education_form">Форма обучения</Label>
        <select id="education_form" className={sel} value={filters.education_form} onChange={(e) => onChange({ education_form: e.target.value })}>
          <option value="">Все</option>
          {(opt?.education_forms ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="education_type">Тип / оплата</Label>
        <select id="education_type" className={sel} value={filters.education_type} onChange={(e) => onChange({ education_type: e.target.value })}>
          <option value="">Все</option>
          {(opt?.education_types ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="language">Язык</Label>
        <select id="language" className={sel} value={filters.language} onChange={(e) => onChange({ language: e.target.value })}>
          <option value="">Все</option>
          {(opt?.languages ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end md:col-span-2 lg:col-span-3">
        <Button type="button" variant="outline" onClick={onReset} className="w-full sm:w-auto">
          Сбросить фильтры
        </Button>
      </div>
    </div>
  );
}
