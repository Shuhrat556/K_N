"use client";

import { useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { previewExcel, uploadExcel, type PreviewResponse } from "@/lib/specializations-api";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const onPick = async (f: File | null) => {
    setFile(f);
    setPreview(null);
    setResult(null);
    setError(null);
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setError("Только файлы .xlsx");
      return;
    }
    setPreviewLoading(true);
    try {
      const p = await previewExcel(f);
      setPreview(p);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка предпросмотра");
    } finally {
      setPreviewLoading(false);
    }
  };

  const onUpload = async () => {
    if (!file) return;
    setUploadLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await uploadExcel(file);
      setResult(`Готово: разобрано ${r.parsed}, добавлено ${r.inserted}, пропущено (дубликаты) ${r.skipped}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Загрузка каталога</CardTitle>
          <CardDescription>Файл .xlsx, несколько листов = категории. Заголовки определяются автоматически.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">Файл Excel</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="mt-2 cursor-pointer"
              onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
            />
          </div>

          {previewLoading ? (
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Предпросмотр…
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {result}
            </div>
          ) : null}

          <Button type="button" disabled={!file || uploadLoading} onClick={() => void onUpload()} className="gap-2">
            {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Загрузить в базу
          </Button>
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Предпросмотр</CardTitle>
            <CardDescription>Всего строк (после фильтра): {preview.totalRows}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.sheets.map((s) => (
              <div key={s.name} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Лист: {s.name} · строк: {s.rowCount}
                </div>
                <ul className="mt-2 list-inside list-disc text-xs text-slate-600 dark:text-slate-400">
                  {s.previewRows.slice(0, 5).map((row, i) => (
                    <li key={i}>
                      {(row as { code_name?: string }).code_name ?? ""} — {(row as { institution?: string }).institution ?? ""}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
