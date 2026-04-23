import { ApiError } from "./api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type SpecializationDto = {
  id: number;
  externalId: number | null;
  direction: string | null;
  code_name: string;
  institution: string;
  city: string | null;
  education_form: string | null;
  education_type: string | null;
  language: string | null;
  quota: number | null;
  category: string;
  created_at: string;
};

export type ListResponse = {
  data: SpecializationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type FiltersResponse = {
  cities: string[];
  institutions: string[];
  categories: string[];
  education_forms: string[];
  education_types: string[];
  languages: string[];
};

export type PreviewResponse = {
  sheets: { name: string; rowCount: number; previewRows: Record<string, unknown>[] }[];
  totalRows: number;
};

async function parseErr(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const msg = body?.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.map(String).join("; ");
    return `Ошибка (${res.status})`;
  } catch {
    return `Ошибка (${res.status})`;
  }
}

export async function fetchFilters(): Promise<FiltersResponse> {
  const res = await fetch(`${API_BASE}/specializations/filters`, { cache: "no-store" });
  if (!res.ok) throw new ApiError(await parseErr(res), res.status);
  return res.json();
}

export async function fetchSpecializations(params: URLSearchParams): Promise<ListResponse> {
  const res = await fetch(`${API_BASE}/specializations?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new ApiError(await parseErr(res), res.status);
  return res.json();
}

export async function previewExcel(file: File): Promise<PreviewResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/upload-excel/preview`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new ApiError(await parseErr(res), res.status);
  return res.json();
}

export async function uploadExcel(file: File): Promise<{
  ok: boolean;
  filename: string;
  parsed: number;
  inserted: number;
  skipped: number;
}> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/upload-excel`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new ApiError(await parseErr(res), res.status);
  return res.json();
}

export function exportUrl(params: URLSearchParams): string {
  return `${API_BASE}/specializations/export?${params.toString()}`;
}
