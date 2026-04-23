"use client";

import type { SpecializationDto } from "@/lib/specializations-api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Props = {
  rows: SpecializationDto[];
  loading?: boolean;
};

export function DataTable({ rows, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900/50">
        Загрузка…
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900/50">
        Нет записей по текущим фильтрам.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 z-[1] bg-white dark:bg-slate-900">ID</TableHead>
            <TableHead>самт</TableHead>
            <TableHead className="min-w-[220px]">рамз ва номи ихтисос</TableHead>
            <TableHead className="min-w-[200px]">Муассиса</TableHead>
            <TableHead>макон</TableHead>
            <TableHead>шакли таҳсил</TableHead>
            <TableHead>намуди таҳсил</TableHead>
            <TableHead>забон</TableHead>
            <TableHead>нақша</TableHead>
            <TableHead>лист</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="sticky left-0 z-[1] bg-white font-mono text-xs tabular-nums dark:bg-slate-900">{r.id}</TableCell>
              <TableCell className="max-w-[140px] truncate">{r.direction ?? "—"}</TableCell>
              <TableCell className="font-semibold text-indigo-700 dark:text-indigo-300">{r.code_name}</TableCell>
              <TableCell className="max-w-[260px]">{r.institution}</TableCell>
              <TableCell>{r.city ?? "—"}</TableCell>
              <TableCell className="max-w-[160px] truncate">{r.education_form ?? "—"}</TableCell>
              <TableCell className="max-w-[160px] truncate">{r.education_type ?? "—"}</TableCell>
              <TableCell>{r.language ?? "—"}</TableCell>
              <TableCell className="tabular-nums">{r.quota ?? "—"}</TableCell>
              <TableCell className="text-xs text-slate-500">{r.category}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
