import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { FacultyMode, FacultyType } from "@prisma/client";
import * as XLSX from "xlsx";
import { PrismaService } from "../prisma/prisma.service";

type RowObj = Record<string, unknown>;

const MAX_ROWS = 5000;
const ALLOWED_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function pick(row: RowObj, keys: string[]): unknown {
  for (const k of Object.keys(row)) {
    const nk = normKey(k);
    for (const want of keys) {
      if (nk === normKey(want)) return row[k];
    }
  }
  return undefined;
}

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(Math.trunc(v));
  return String(v).trim();
}

function parseType(raw: string): FacultyType {
  const s = raw.toLowerCase();
  if (s === "free" || s.includes("бесплат") || s.includes("бепул")) return FacultyType.FREE;
  if (s === "paid" || s.includes("плат") || s.includes("пулак") || s.includes("pul")) return FacultyType.PAID;
  throw new Error(`Invalid type: ${raw}`);
}

function parseMode(raw: string): FacultyMode {
  const s = raw.toLowerCase();
  if (s === "online" || s.includes("онлайн")) return FacultyMode.ONLINE;
  if (s === "offline" || s.includes("офлайн") || s.includes("очно") || s.includes("рӯзона") || s.includes("hozirag")) {
    return FacultyMode.OFFLINE;
  }
  throw new Error(`Invalid mode: ${raw}`);
}

function isZipXlsxBuffer(buf: Buffer): boolean {
  // XLSX is a ZIP archive; check PK\x03\x04 signature
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07);
}

function compositeKey(parts: { university: string; name: string; clusterId: number; city: string }): string {
  return [parts.university, parts.name, String(parts.clusterId), parts.city].map((s) => normKey(s)).join("|");
}

@Injectable()
export class ExcelImportService {
  private readonly logger = new Logger(ExcelImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importFaculties(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Empty file");
    }
    if (file.mimetype && !ALLOWED_MIME.has(file.mimetype)) {
      // Some browsers omit mimetype; don't hard-fail if empty
      this.logger.warn(`Unexpected mimetype: ${file.mimetype}`);
    }
    if (!isZipXlsxBuffer(file.buffer)) {
      throw new BadRequestException("Invalid file: expected an .xlsx (Office Open XML) workbook");
    }

    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(file.buffer, { type: "buffer", cellDates: true });
    } catch {
      throw new BadRequestException("Failed to parse Excel file");
    }
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new BadRequestException("Workbook has no sheets");
    const sheet = wb.Sheets[sheetName];
    if (!sheet) throw new BadRequestException("Missing first sheet");
    const rows = XLSX.utils.sheet_to_json<RowObj>(sheet, { defval: "", raw: false });
    if (rows.length > MAX_ROWS) {
      throw new BadRequestException(`Too many rows (max ${MAX_ROWS})`);
    }

    const clusters = await this.prisma.cluster.findMany();
    if (!clusters.length) {
      throw new BadRequestException("No clusters exist in the database; seed clusters before importing faculties");
    }
    const clusterByName = new Map(clusters.map((c) => [c.name.toLowerCase(), c]));

    let skippedEmpty = 0;
    const errors: string[] = [];
    const batch: {
      university: string;
      name: string;
      clusterId: number;
      city: string;
      language: string;
      type: FacultyType;
      mode: FacultyMode;
      scoreRequirement: number;
    }[] = [];

    const seenInFile = new Set<string>();

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx]!;
      const university = str(pick(row, ["university", "uni", "донишгох", "муассиса", "muassisa"]));
      const faculty = str(pick(row, ["faculty", "факультет", "fakultet"]));
      const clusterName = str(pick(row, ["cluster", "кластер", "самт"]));
      const city = str(pick(row, ["city", "шахр", "город", "макон"]));
      const language = str(pick(row, ["language", "забон", "lang"]));
      const typeRaw = str(pick(row, ["type", "тип", "namud"]));
      const modeRaw = str(pick(row, ["mode", "шакл", "форм", "format"]));
      const scoreRaw = str(pick(row, ["score", "score_requirement", "балл", "requirement"]));

      if (!university && !faculty && !clusterName && !city && !language && !typeRaw && !modeRaw && !scoreRaw) {
        skippedEmpty++;
        continue;
      }

      const rowLabel = `row ${idx + 2}`;
      if (!university || !faculty || !clusterName || !city || !language || !typeRaw || !modeRaw || !scoreRaw) {
        errors.push(`${rowLabel}: missing required fields (need university, faculty, cluster, city, language, type, mode, score)`);
        continue;
      }

      const cluster = clusterByName.get(clusterName.toLowerCase());
      if (!cluster) {
        errors.push(`${rowLabel}: unknown cluster '${clusterName}' (must match an existing cluster name)`);
        continue;
      }

      const scoreNum = Number(scoreRaw);
      if (!Number.isFinite(scoreNum)) {
        errors.push(`${rowLabel}: score must be a number`);
        continue;
      }
      const scoreInt = Math.trunc(scoreNum);
      if (scoreInt !== scoreNum) {
        errors.push(`${rowLabel}: score must be a whole number`);
        continue;
      }
      if (scoreInt < 0 || scoreInt > 100000) {
        errors.push(`${rowLabel}: score out of allowed range (0..100000)`);
        continue;
      }

      let type: FacultyType;
      let mode: FacultyMode;
      try {
        type = parseType(typeRaw);
        mode = parseMode(modeRaw);
      } catch (e) {
        errors.push(`${rowLabel}: ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }

      const rec = {
        university,
        name: faculty,
        clusterId: cluster.id,
        city,
        language,
        type,
        mode,
        scoreRequirement: scoreInt,
      };

      const key = compositeKey(rec);
      if (seenInFile.has(key)) {
        errors.push(`${rowLabel}: duplicate row in file (same university/faculty/cluster/city)`);
        continue;
      }
      seenInFile.add(key);
      batch.push(rec);
    }

    if (!batch.length) {
      if (errors.length) {
        throw new BadRequestException({
          message: "Import failed validation",
          errors,
          skippedEmpty,
          inserted: 0,
        });
      }
      return { inserted: 0, skippedEmpty, skippedDbDuplicates: 0, errors: [], attempted: 0 };
    }

    const res = await this.prisma.faculty.createMany({
      data: batch,
      skipDuplicates: true,
    });
    const inserted = res.count;
    const skippedDbDuplicates = Math.max(0, batch.length - inserted);

    return {
      inserted,
      skippedEmpty,
      skippedDbDuplicates,
      errors,
      attempted: batch.length,
      note:
        errors.length && batch.length
          ? "Some rows had errors but valid rows were imported. Review `errors` and re-upload missing rows."
          : undefined,
    };
  }
}
