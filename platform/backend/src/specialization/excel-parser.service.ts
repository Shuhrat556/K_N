import { BadRequestException, Injectable } from "@nestjs/common";
import * as XLSX from "xlsx";

export type ParsedSpecializationRow = {
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
};

function norm(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toStr(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t.length ? t : null;
}

function toNum(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  const s = String(v).replace(/\s/g, "").replace(/,/g, ".");
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function extractCodeName(raw: string): string {
  const t = raw.trim();
  const m = t.match(/^([0-9A-Za-z\-_/]+)\s*[-–—:]\s*(.+)$/);
  if (m) return `${m[1].trim()} — ${m[2].trim()}`;
  const m2 = t.match(/^([0-9]{5,})\s+(.+)$/);
  if (m2) return `${m2[1].trim()} — ${m2[2].trim()}`;
  return t;
}

type ColMap = {
  id?: number;
  direction?: number;
  codeName?: number;
  institution?: number;
  city?: number;
  educationForm?: number;
  educationType?: number;
  language?: number;
  quota?: number;
};

function matchCol(headers: Map<string, number>, keys: string[]): number | undefined {
  for (const [h, idx] of headers) {
    if (keys.some((k) => h.includes(k))) return idx;
  }
  return undefined;
}

function buildColMap(headers: Map<string, number>): ColMap {
  return {
    id: matchCol(headers, ["id", "№"]),
    direction: matchCol(headers, ["самт", "направлен", "direction"]),
    codeName: matchCol(headers, ["рамз", "номи ихтисос", "ихтисос", "special", "code"]),
    institution: matchCol(headers, ["муассис", "донишгох", "универс", "institution"]),
    city: matchCol(headers, ["мақон", "макон", "шаҳр", "город", "city"]),
    educationForm: matchCol(headers, ["шакли", "шакл", "форма", "form"]),
    educationType: matchCol(headers, ["намуди", "намуд", "тип", "tuition", "оплат", "пул", "сомон"]),
    language: matchCol(headers, ["забон", "language", "язык"]),
    quota: matchCol(headers, ["нақша", "қабул", "plan", "quota", "мест"]),
  };
}

function headerRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 18); i++) {
    const row = rows[i] ?? [];
    const keys = new Map<string, number>();
    row.forEach((cell, j) => {
      const tx = toStr(cell);
      if (tx) keys.set(norm(tx), j);
    });
    if (keys.size === 0) continue;
    const keyArr = [...keys.keys()];
    const hasInst = keyArr.some((k) => k.includes("муассис") || k.includes("донишгох") || k.includes("univers"));
    const hasSpec = keyArr.some((k) => k.includes("ихтисос") || k.includes("рамз") || k.includes("special"));
    if (hasInst && hasSpec) return i;
  }
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i] ?? [];
    const filled = row.filter((c) => toStr(c)).length;
    if (filled >= 4) return i;
  }
  throw new BadRequestException("Could not detect header row in Excel");
}

@Injectable()
export class ExcelParserService {
  parseBuffer(buffer: Buffer, categoryOverride?: string): ParsedSpecializationRow[] {
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
    } catch {
      throw new BadRequestException("Invalid Excel file");
    }

    const out: ParsedSpecializationRow[] = [];

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;

      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: null,
        raw: true,
      }) as unknown[][];

      if (matrix.length < 2) continue;

      let headerIdx: number;
      try {
        headerIdx = headerRowIndex(matrix);
      } catch {
        continue;
      }

      const headerCells = matrix[headerIdx] ?? [];
      const headerKeys = new Map<string, number>();
      headerCells.forEach((cell, j) => {
        const tx = toStr(cell);
        if (tx) headerKeys.set(norm(tx), j);
      });

      const cols = buildColMap(headerKeys);
      const category = (categoryOverride ?? sheetName).trim() || "Sheet";

      for (let r = headerIdx + 1; r < matrix.length; r++) {
        const row = matrix[r] ?? [];
        const institution = cols.institution !== undefined ? toStr(row[cols.institution]) : null;

        let code_name = "";
        if (cols.codeName !== undefined) {
          const raw = toStr(row[cols.codeName]);
          code_name = raw ? extractCodeName(raw) : "";
        }

        if (!code_name.trim() || !institution?.trim()) continue;

        const externalId = cols.id !== undefined ? toNum(row[cols.id]) : null;

        out.push({
          externalId,
          direction: cols.direction !== undefined ? toStr(row[cols.direction]) : null,
          code_name: code_name.trim(),
          institution: institution.trim(),
          city: cols.city !== undefined ? toStr(row[cols.city]) : null,
          education_form: cols.educationForm !== undefined ? toStr(row[cols.educationForm]) : null,
          education_type: cols.educationType !== undefined ? toStr(row[cols.educationType]) : null,
          language: cols.language !== undefined ? toStr(row[cols.language]) : null,
          quota: cols.quota !== undefined ? toNum(row[cols.quota]) : null,
          category,
        });
      }
    }

    return out;
  }

  previewBuffer(buffer: Buffer): {
    sheets: { name: string; rowCount: number; previewRows: ParsedSpecializationRow[] }[];
    totalRows: number;
  } {
    const all = this.parseBuffer(buffer);
    const groups = new Map<string, ParsedSpecializationRow[]>();
    for (const row of all) {
      const list = groups.get(row.category) ?? [];
      list.push(row);
      groups.set(row.category, list);
    }

    const sheets = [...groups.entries()].map(([name, rows]) => ({
      name,
      rowCount: rows.length,
      previewRows: rows.slice(0, 20),
    }));

    return { sheets, totalRows: all.length };
  }
}
