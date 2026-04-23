"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExcelBuffer = parseExcelBuffer;
exports.previewExcel = previewExcel;
const XLSX = __importStar(require("xlsx"));
function toStr(v) {
    if (v === undefined || v === null)
        return null;
    const t = String(v).trim();
    return t.length ? t : null;
}
function toNum(v) {
    if (v === undefined || v === null || v === "")
        return null;
    if (typeof v === "number" && Number.isFinite(v))
        return Math.trunc(v);
    const s = String(v).replace(/\s/g, "").replace(/,/g, ".");
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
}
function norm(s) {
    return s
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}
function parseStudyType(value) {
    if (!value)
        return { type: "free", price: 0 };
    const lower = value.toLowerCase();
    // Check for "ройгон" (free)
    if (lower.includes("ройгон") || lower.includes("бесплат") || lower === "free") {
        return { type: "free", price: 0 };
    }
    // Parse "пулакӣ (6950)" or similar patterns
    const match = value.match(/пулакӣ\s*\(?(\d+)\)?/i) || value.match(/(\d+)\s*сомон/i);
    if (match) {
        return { type: "paid", price: parseInt(match[1], 10) };
    }
    // Check for any number in parentheses
    const priceMatch = value.match(/\((\d+)\)/);
    if (priceMatch) {
        return { type: "paid", price: parseInt(priceMatch[1], 10) };
    }
    return { type: "paid", price: 0 };
}
function extractCodeName(raw) {
    const t = raw.trim();
    // Pattern: "1010100 — Иктисоси иктисосӣ"
    const m = t.match(/^([0-9A-Za-z\-_/]+)\s*[-–—:]\s*(.+)$/);
    if (m) {
        return { code: m[1].trim(), name: m[2].trim() };
    }
    // Pattern: "1010100 Иктисоси иктисосӣ"
    const m2 = t.match(/^([0-9]{5,})\s+(.+)$/);
    if (m2) {
        return { code: m2[1].trim(), name: m2[2].trim() };
    }
    return { code: t.substring(0, 10).trim(), name: t };
}
function matchCol(headers, keys) {
    for (const [h, idx] of headers) {
        if (keys.some((k) => h.includes(k)))
            return idx;
    }
    return undefined;
}
function buildColMap(headers) {
    return {
        id: matchCol(headers, ["id", "№"]),
        codeName: matchCol(headers, ["рамз", "номи ихтисос", "ихтисос", "special", "code"]),
        university: matchCol(headers, ["муассис", "донишгох", "универс", "institution"]),
        location: matchCol(headers, ["макон", "шаҳр", "город", "city"]),
        studyForm: matchCol(headers, ["шакли", "шакл", "форма", "form"]),
        studyType: matchCol(headers, ["намуди", "намуд", "тип", "tuition", "оплат", "пул", "сомон"]),
        language: matchCol(headers, ["забон", "language", "язык"]),
        quota: matchCol(headers, ["накша", "кабул", "plan", "quota", "мест"]),
        degree: matchCol(headers, ["даража", "daraja", "degree", "level"]),
    };
}
function headerRowIndex(rows) {
    for (let i = 0; i < Math.min(rows.length, 18); i++) {
        const row = rows[i] ?? [];
        const keys = new Map();
        row.forEach((cell, j) => {
            const tx = toStr(cell);
            if (tx)
                keys.set(norm(tx), j);
        });
        if (keys.size === 0)
            continue;
        const keyArr = [...keys.keys()];
        const hasInst = keyArr.some((k) => k.includes("муассис") || k.includes("донишгох") || k.includes("univers"));
        const hasSpec = keyArr.some((k) => k.includes("ихтисос") || k.includes("рамз") || k.includes("special"));
        if (hasInst && hasSpec)
            return i;
    }
    for (let i = 0; i < Math.min(rows.length, 12); i++) {
        const row = rows[i] ?? [];
        const filled = row.filter((c) => toStr(c)).length;
        if (filled >= 4)
            return i;
    }
    throw new Error("Could not detect header row in Excel");
}
function parseExcelBuffer(buffer) {
    let wb;
    try {
        wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
    }
    catch {
        throw new Error("Invalid Excel file");
    }
    const out = [];
    for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        if (!sheet)
            continue;
        const matrix = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: null,
            raw: true,
        });
        if (matrix.length < 2)
            continue;
        let headerIdx;
        try {
            headerIdx = headerRowIndex(matrix);
        }
        catch {
            continue;
        }
        const headerCells = matrix[headerIdx] ?? [];
        const headerKeys = new Map();
        headerCells.forEach((cell, j) => {
            const tx = toStr(cell);
            if (tx)
                headerKeys.set(norm(tx), j);
        });
        const cols = buildColMap(headerKeys);
        for (let r = headerIdx + 1; r < matrix.length; r++) {
            const row = matrix[r] ?? [];
            // Skip empty rows
            const filled = row.filter((c) => toStr(c)).length;
            if (filled < 2)
                continue;
            const university = cols.university !== undefined ? toStr(row[cols.university]) : null;
            if (!university)
                continue;
            // Parse code and name
            let code = "";
            let name = "";
            if (cols.codeName !== undefined) {
                const codeNameRaw = toStr(row[cols.codeName]);
                if (codeNameRaw) {
                    const parsed = extractCodeName(codeNameRaw);
                    code = parsed.code;
                    name = parsed.name;
                }
            }
            // Parse study type and price
            const studyTypeRaw = cols.studyType !== undefined ? toStr(row[cols.studyType]) : null;
            const { type, price } = parseStudyType(studyTypeRaw);
            const specialty = {
                externalId: cols.id !== undefined ? toNum(row[cols.id]) : null,
                code: code || `SPEC-${r}`,
                name: name || university,
                university,
                location: cols.location !== undefined ? toStr(row[cols.location]) : null,
                studyForm: cols.studyForm !== undefined ? toStr(row[cols.studyForm]) : null,
                studyType: type,
                price,
                language: cols.language !== undefined ? toStr(row[cols.language]) : null,
                quota: cols.quota !== undefined ? toNum(row[cols.quota]) : null,
                degree: cols.degree !== undefined ? toStr(row[cols.degree]) : null,
            };
            out.push(specialty);
        }
    }
    return out;
}
function previewExcel(buffer, maxRows = 10) {
    const parsed = parseExcelBuffer(buffer);
    return {
        headers: ["code", "name", "university", "location", "studyForm", "studyType", "price", "language", "quota", "degree"],
        rows: parsed.slice(0, maxRows).map((p) => [
            p.code,
            p.name,
            p.university,
            p.location,
            p.studyForm,
            p.studyType,
            p.price,
            p.language,
            p.quota,
            p.degree,
        ]),
    };
}
//# sourceMappingURL=excel-parser.js.map